const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const uuid = require('node-uuid');
const httpProxy = require('http-proxy');
const nodemailer = require("nodemailer");

let port = 3000;
if (process.argv[2]) {
    port = parseInt(process.argv[2], 10);
}
let proxyTarget = 'http://localhost:4444';
if (process.argv[3]) {
    proxyTarget = process.argv[3];
}

function assignId(req, res, next) {
    req.id = uuid.v4();
    next();
}

const isSuspectedUserAgent = userAgent => {
    if (!userAgent) {
        return false;
    }
    return userAgent.match(/mysql/gi) || userAgent.match(/driver/gi);
};

async function sendEmail(messageBody) {
    const user = 'joomla_honeypot@janpogocki.pl';
    const pass = 'Joomla1:)';
    const transporter = nodemailer.createTransport({
        host: 'janpogocki.civ.pl',
        port: 465,
        secure: true,
        auth: {user, pass}
    });

    return await transporter.sendMail({
        from: user,
        to: user,
        subject: "Suspicious behaviour detected (request to Joomla)",
        text: messageBody
    });
}


function prepareMessageBody(req) {
    const method = req.method;
    const httpVersion = req.httpVersion;
    const originalUrl = req.originalUrl;
    const requestId = req.id;
    const headers = Object.entries(req.headers).map(entry => `${entry[0]}: ${entry[1]}`).join('\r\n');
    const peername = req.connection._peername;
    const ip = peername.address;
    const ipType = peername.family;
    const port = peername.port;
    const body = (Object.entries(req.body).length === 0 && req.body.constructor === Object) ? '' : req.body;
    return 'Suspicious behaviour detected:\r\n' +
        `${method} ${originalUrl} (HTTP ${httpVersion})\r\n` +
        `Request ID: ${requestId}\r\n` +
        `Client: ${ipType}, IP=${ip}, port=${port}\r\n` +
        'Headers:\r\n' +
        headers +
        '\r\nBody:\r\n' +
        `${body}\r\n`;
}

async function main() {
    const joomlaProxy = httpProxy.createProxyServer();

    morgan.token('id', function getId(req) {
        return req.id
    });

    const app = express();
    app.use(assignId);
    app.use(bodyParser.text());
    const logPattern = ':id (:response-time ms)|:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
    app.use(morgan(logPattern));
    app.use(function (req, res, next) {
        const userAgent = req.get('User-Agent');
        if (isSuspectedUserAgent(userAgent)) {
            const messageBody = prepareMessageBody(req);
            console.log(`suspected request found: ${req.id}, sending alert (email)...`);
            sendEmail(messageBody)
                .then(() => console.log('email sent'))
                .catch(e => console.error('error while sending email', e));
        }
        next();
    });
    app.all('*', function (req, res) {
        joomlaProxy.web(req, res, {target: proxyTarget});
    });

    app.listen(port, () => console.log(`Honeypot app listening on port ${port}, proxy target ${proxyTarget}`));
}

main().catch(console.error);

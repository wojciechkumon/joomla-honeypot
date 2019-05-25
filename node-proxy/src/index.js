const express = require('express');
const morgan = require('morgan');
const uuid = require('node-uuid');
const proxy = require('express-http-proxy');
const nodemailer = require("nodemailer");


function assignId(req, res, next) {
    req.id = uuid.v4();
    next();
}

async function sendTestEmail() {
    const user = 'joomla_honeypot@int.pl';
    const pass = 'joomla:)';
    const transporter = nodemailer.createTransport({
        host: 'poczta.int.pl',
        port: 465,
        secure: true,
        auth: {user, pass}
    });

    const info = await transporter.sendMail({
        from: user,
        to: user,
        subject: "Hello ✔",
        text: "Hello world?",
        html: "<b>Hello world?</b>"
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}


async function main() {
    morgan.token('id', function getId(req) {
        return req.id
    });

    const app = express();
    const port = 3000;
    app.use(assignId);
    const logPattern = '#:id (:response-time ms)|:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
    app.use(morgan(logPattern));
    app.use('/proxy', proxy(`localhost:${port}`));

    app.get('/', (req, res) => res.send('Hello World!'));

    app.listen(port, () => console.log(`Example app listening on port ${port}!`));

    // await sendTestEmail();
}

main().catch(console.error);

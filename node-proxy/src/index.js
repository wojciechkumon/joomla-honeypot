const express = require('express');
const morgan = require('morgan');
const uuid = require('node-uuid');


morgan.token('id', function getId(req) {
    return req.id
});

const app = express();
const port = 3000;
app.use(assignId);
const logPattern = '#:id (:response-time ms)|:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
app.use(morgan(logPattern));

function assignId(req, res, next) {
    req.id = uuid.v4();
    next();
}

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const express = require('express');
const sass = require('node-sass-middleware');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require("path");
const app = express();
const routes = require('./routes/static');
const users = require('./routes/users');
const details = require('./routes/details');

// LG: Should we store this in mongo?
app.use(session({
    secret: 'B3LtdsBFWqqVrH5Vj7qm36Q',
    //cookie: { secure: true },
    name: 'weathery_session',
    //store: ,
    resave: true,
    saveUninitialized: true

}));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('views', path.join(__dirname, 'html')); // Set view directory.
app.use(sass({
    src: path.join(__dirname, 'resources', 'sass'),
    dest: path.join(__dirname, 'resources', 'css'),
    debug: true,
}));
app.use(express.static(path.join(__dirname, 'resources', 'css'))); // Set css directory.
app.use(express.static(path.join(__dirname, 'resources', 'js'))); // Set javascript directory.
app.use(express.static(path.join(__dirname, 'resources', 'images'))); // Set javascript directory.
app.use("/datetimepicker", express.static(path.join(__dirname, 'node_modules', 'pc-bootstrap4-datetimepicker', 'build'))); // Set node directory.

app.set('view engine', 'ejs'); // Set view engine to ejs for Templating

app.use('/', routes);
app.use('/account', users);
app.use('/details', details);

module.exports = app;
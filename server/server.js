'use strict';

var express = require('express');
var path = require('path');
var lobby = require('./lobby.js');
var multiplayer = require('./routes/multiplayer.js');

var TEST_PORT = 5000;

exports.start = function(callback) {
    var app = express();

    app.use(express.static(path.resolve(__dirname + '/../client')));

    app.use(express.cookieParser());

    app.get('/multiplayer', multiplayer);

    var port = process.env.PORT || TEST_PORT;
    console.log('starting server on port ' + port);
    var server = app.listen(port, callback);
    lobby(server);
};
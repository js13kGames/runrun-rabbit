'use strict';

var modelFactory = require('../shared/model.js');
var levels = require('../shared/levels.js');
var RNG = require('../shared/utils/rng.js').RNG;

module.exports = (function() {
    var model;
    var message;
    var arena;
    var socket;
    var connected = false;
    var container;

    function disconnect() {
        if (connected) {
            connected = false;
            socket.disconnect(true);
        }
    }

    function startGame(gameData) {
        gameData.level = levels[gameData.levelId];
        gameData.random = new RNG(gameData.seed);
        model = modelFactory.build(gameData);
        arena = require('./views/arena.js')(container, model);

        arena.placeArrow(function placeArrow(newArrow) {
            if (model.addArrow(gameData.playerId, newArrow) && socket) {
                socket.emit('placeArrow', newArrow);
            }
        });
        arena.gameOver(function() {
            message.setText('Game over!');
            connected = false;
        });

        if (socket) {
            socket.on('placeArrow', function (arrowData) {
                model.addArrow(arrowData.playerId, arrowData.arrow);
            });
            socket.emit('started');
        }

        var hudFactory = require('./views/hud.js');
        model.registerHud(hudFactory.build(container, gameData));
    }

    var init = function init(multiplayer) {
        container = document.getElementById('game');
        message = require('./views/message.js').build(container);
        container.appendChild(message.view);

        if (multiplayer) {
            socket = io.connect('/');
            connected = true;

            message.setText('Waiting for other players to join...');

            socket.on('start', function(gameData) {
                if (connected) {
                    message.setText('');
                    startGame(gameData);
                }
            });

            var connectionError = function connectionError() {
                // Don't show an error immediately, in case the other client disconnected just
                // because they finished running the game a moment before us.
                setTimeout(function() {
                    if (connected) {
                        disconnect();
                        if (arena) {
                            arena.close();
                        }
                        model = null;
                        arena = null;
                        message.setText('Connection error!');
                    }
                }, 500);
            };
            socket.on('disconnect', connectionError);
            socket.on('opponentDisconnect', connectionError);
        } else {
            startGame({
                playerId: 0,
                levelId: 1,
                totalPlayers: 2,
                totalTime: 90000
            });
        }
    };

    return {
        init: init
    };

}());
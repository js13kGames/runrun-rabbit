'use strict';

var modelFactory = require('../../shared/model.js');
var levels = require('../../shared/levels.js');
var standard = require('../../shared/bots/standard.js');
var RNG = require('../../shared/utils/rng.js').RNG;

module.exports = (function() {
    var model;
    var message;
    var arena;
    var socket;
    var connected = false;
    var container;
    var inputMethod;
    var visualStyle;

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
        arena = require('./../views/arena.js')(container, model, gameData,
            function placeArrow(newArrow) {
                if (model.addArrow(gameData.playerId, newArrow) && socket) {
                    socket.emit('placeArrow', newArrow);
                }
            }
        );

        arena.setInputMethod(inputMethod);
        arena.setVisualStyle(visualStyle);

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

        if (gameData.bots && gameData.bots.length) {
            gameData.bots.forEach(function (bot) {
                bot.start(model);
            });
        }
    }

    var init = function init(multiplayer, options) {
        container = document.createElement('div');
        container.setAttribute('id', 'game');
        document.body.appendChild(container);
        inputMethod = options.inputMethod;
        visualStyle = options.visualStyle;

        message = require('./../views/message.js').build(container);
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
                levelId: new Date().getTime() % levels.length,
                totalPlayers: 2,
                totalTime: 90000,
                bots: [ new standard.Bot(1) ]
            });
        }
    };

    return {
        init: init
    };

}());
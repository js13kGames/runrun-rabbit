'use strict';

module.exports = (function() {
    var activeKey = null;

    var modelFactory = require('../shared/model.js');
    var direction = require('../shared/utils/direction.js');
    var levels = require('../shared/levels.js');
    var RNG = require('../shared/utils/rng.js').RNG;

    var model;
    var playArea;
    var socket;

    function startGame(gameData) {
        gameData.level = levels[gameData.levelId];
        gameData.random = new RNG(gameData.seed);
        model = modelFactory.build(gameData);

        var container = document.getElementById('game');
        playArea = require('./views/arena.js').build(container, model);

        playArea.click(function playAreaClick(cell, time) {
            if (activeKey !== null) {
                var newArrow = {
                    x: cell.x,
                    y: cell.y,
                    direction: direction.fromKey(activeKey),
                    from: time + 100 // Give us a little bit of leeway for network lag, but not enough to be perceptible
                };

                if (model.addArrow(gameData.playerId, newArrow) && socket) {
                    socket.emit('placeArrow', newArrow);
                }

            }
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
        window.oncontextmenu = function() { return false; };

        window.onkeydown = function (event) {
            if (direction.fromKey(event.keyCode) !== null) {
                activeKey = event.keyCode;
                event.preventDefault();
            }
        };

        window.onkeyup = function (event) {
            if (event.keyCode === activeKey) {
                activeKey = null;
            }
        };

        if (multiplayer) {
            socket = io.connect('/');
            socket.on('start', startGame);

            var disconnect = function disconnect() {
                playArea.close();
                model = null;
                playArea = null;
            };
            socket.on('disconnect', disconnect);
            socket.on('opponentDisconnect', disconnect);
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
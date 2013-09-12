'use strict';

var Source = function Source(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.lastUpdate = 0;
};

var Sink = function Sink(p, x, y) {
    return {
        player: p,
        x: x,
        y: y
    };
};

var TICK = 100;

var sprites = require('./sprites.js');

Source.prototype.init = function initSource(random) {
    this.random = random;
};

Source.prototype.update = function updateSource(model, gameTime) {
    for (var time = this.lastUpdate + TICK - (this.lastUpdate % TICK); time <= gameTime; time += TICK) {
        var rand = this.random.nextByte();
        if (rand > 253) {
            model.critters.push(new sprites.Critter(this, sprites.FOX, time));
        } else if (rand > 220) {
            model.critters.push(new sprites.Critter(this, sprites.RABBIT, time));
        }
    }
    this.lastUpdate = gameTime;
};

module.exports.Source = Source;
module.exports.Sink = Sink;
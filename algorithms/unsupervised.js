'use strict';
var gaussian = require('gaussian');

var SDEM = function(mean, variance) {
  var self = this;
  const r = 0.0005;
  const alpha = 2;
  var _mean = mean;
  var _variance = variance;

  self.calculateStep = function(tickData) {
    const probabilityOld = gaussian(_mean, _variance).pdf(tickData);
    _mean = (1 - r) * _mean + r * tickData;
    _variance = (1 - r)  * _variance + r * (tickData*tickData - _mean*_mean);
    const probabilityNew = gaussian(_mean, _variance).pdf(tickData);
    const hellingerScore = 1 / (Math.sqrt(2) * r * r) * Math.abs(Math.sqrt(probabilityOld) - Math.sqrt(probabilityNew));
    return {
          mean: _mean,
          variance: _variance,
          hellingerScore: hellingerScore,
          zone: (hellingerScore > 500 || hellingerScore < 10) ? 'red' : 'green'
        };
  }
}

module.exports = SDEM;


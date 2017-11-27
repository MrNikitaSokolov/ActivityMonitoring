'use strict';
const Unsupervised = require('../algorithms/unsupervised');
const SVM = require('../algorithms/svm');
const rp = require('request-promise');
const Q = require('Q');
const fs = require('fs');

const numOfNeighbors = 2;
var svm = new SVM();


var analyticalArray = [];

var neighborsByTimestamp = {};
var trainSet = [];

function findNeighbors(array, index, epsilon) {
  var center = array[index];
  var result = [];
  result.push(center);
  for (var i = 1; i <= epsilon; i++) {
    if (index - i < 0 || index + i >= array.length) {
      return null;
    }
    result.push(array[index - i]);
    result.push(array[index + i]);
  }
  return result;
}

module.exports = {
  executeBatchLocally: function (dataArray) {
    var slicedDeltas = dataArray.slice(0, 200).map(el => {return el.delta});
    var mean = slicedDeltas.reduce((sum, value) => { return sum + value;}, 0) / slicedDeltas.length;
    var variance = slicedDeltas.reduce((sum, value) => { return sum + (value - mean)*(value - mean);}, 0) / slicedDeltas.length;
    var algorithm = new Unsupervised(mean, variance);
    var redIndices = [];
    var algorithmResult = dataArray.map((val, index) => {
      var stepResult = algorithm.calculateStep(val.delta);
      if (stepResult.zone === 'red' && !findNeighbors(dataArray, index, numOfNeighbors)) {
        stepResult.zone = 'green'; //override if not enough neighbors
      }
      if (stepResult.zone === 'red') {
        redIndices.push(index);
      }
      analyticalArray.push({
        timestamp: val.timestamp,
        features: [val.delta]
      });
      return {
        zone: stepResult.zone,
        value: val.delta,
        timestamp: val.timestamp
      };
    });

    redIndices.forEach(index => {
      var timestamp = analyticalArray[index].timestamp;
      var neighbors = findNeighbors(analyticalArray, index, numOfNeighbors);
      if (neighbors) {
        var featureVector = [];
        neighbors.forEach(n => {
          featureVector = featureVector.concat(n.features);
        });
        neighborsByTimestamp[timestamp] = featureVector;
      }
    });

    return algorithmResult;
  },

  executeBatchLocallyForSVM: function (dataArray) {
    var projection = dataArray.map(val => {
      return {
        timestamp: val.timestamp,
        features: [val.delta]
      };
    });

    var svmResult = projection.map((element, index) => {
      var neighbors = findNeighbors(projection, index, numOfNeighbors);
      if (neighbors) {
        var featureVector = [];
        neighbors.forEach(n => {
          featureVector = featureVector.concat(n.features);
        });
        var prediction = svm.predict(featureVector);
        return {
          zone: prediction === 1 ? 'red' : 'green',
          value: element.features[0],
          timestamp: element.timestamp
        };
      }
      return {
        zone: 'green',
        value: element.features[0],
        timestamp: element.timestamp
      };
    });

    return {
      result: svmResult,
      trainSet: trainSet
    };
  },

  populateTrainSet: function (timestamp, mark) {
    var featureVector = neighborsByTimestamp[timestamp];
    trainSet.push([featureVector, mark]);
  },

  train: function () {
    return Q.fcall(() => {svm.train(trainSet);});
  }

};
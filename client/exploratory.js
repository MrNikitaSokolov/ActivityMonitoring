"use strict";
const Highcharts = require('highcharts');
const $ = require('jQuery');
var ko = require('knockout');

const batchSize = 100;;
var nextBatchStart = batchSize;

var currentChosenIndex = 0;

var dataPointModel;

// KO MODELS
var DataPointModel = function (nextPointAction) {
  var self = this;

  self.value = ko.observable(null);
  self.timestamp = ko.observable("");

  self.confirmOutlier = function () {
    $.ajax({
      type: "POST",
      url: '/outlier',
      data: { timestamp: self.timestamp, answer: 1 },
      dataType: 'application/json',
      complete: function (data) {
        nextPointAction();
      }
    });
  }

  self.declineOutlier = function () {
    $.ajax({
      type: "POST",
      url: '/outlier',
      data: { timestamp: self.timestamp, answer: 0 },
      dataType: 'application/json',
      complete: function (data) {
        nextPointAction();
      }
    });
  }
}
//

$(function () {
  var redIndices = [];
  var chart;
  var points = [];
  var categories = [];
  $.getJSON('/resultsLocally', response => {
    var prevPoint;
    response.forEach(function (data, index) {
      if (data.zone === 'red') {
        points.push({ color: 'blue', y: data.value });
        redIndices.push(index);
      } else if (data.zone === 'green') {
        points.push(data.value);
      }
      categories.push(data.timestamp);
    });

    chart = Highcharts.chart('visualization', {
      chart: {
        zoomType: "xy",
        panning: true,
        panKey: "alt"
      },
      title: {
        text: "Training data"
      },
      series: [{
        data: points.slice(0, batchSize),
        color: 'green',
        showInLegend: false
      }],
      xAxis: {
        categories: categories.slice(0, batchSize)
      }
    });
  });

  // Choosing data points
  $("#nextPoint").click(goToNextOutlier);
  $(document).keydown(function (e) {
    if (e.keyCode == 39) {
      goToNextOutlier();
      return false;
    }
  });

  $("#nextBatch").click(function () {
    displayNextBatch();
  });

  $("#trainSVM").click(function () {
    $.ajax({
      type: "POST",
      url: '/train',
      complete: function (data) {
        window.location.href = "/prediction";
      }
    });
  });

  dataPointModel = new DataPointModel(function () {
    var indexInFullCollection = redIndices[currentChosenIndex];
    if (indexInFullCollection > nextBatchStart) {
      displayNextBatch();
    }
    else {
      var possibleOutlier = chart.series[0].data[indexInFullCollection - nextBatchStart + batchSize];
      var value = possibleOutlier.y;
      var timestamp = possibleOutlier.category;
      dataPointModel.value(value);
      dataPointModel.timestamp(timestamp);
      possibleOutlier.select();
      currentChosenIndex++;
    }
  });
  ko.applyBindings(dataPointModel, document.getElementById('algorithms-aggregation'));

  function displayNextBatch() {
    chart = Highcharts.chart('visualization', {
      chart: {
        zoomType: "xy",
        panning: true,
        panKey: "alt"
      },
      series: [{
        data: points.slice(nextBatchStart, nextBatchStart + batchSize),
        color: 'green',
        showInLegend: false
      }],
      xAxis: {
        categories: categories.slice(nextBatchStart, nextBatchStart + batchSize)
      }
    }, function (c) {
      nextBatchStart += batchSize;
    });
  }

  function goToNextOutlier() {
    var indexInFullCollection = redIndices[currentChosenIndex];
    if (indexInFullCollection >= nextBatchStart) {
      displayNextBatch();
    }
    else {
      var possibleOutlier = chart.series[0].data[indexInFullCollection - nextBatchStart + batchSize];
      var value = possibleOutlier.y;
      var timestamp = possibleOutlier.category;
      dataPointModel.value(value);
      dataPointModel.timestamp(timestamp);
      possibleOutlier.select();
      currentChosenIndex++;
    }
  }
});
"use strict";
const Highcharts = require('highcharts');
const $ = require('jQuery');

const batchSize = 100;;
var nextBatchStart = batchSize;

$(function () {
  var redIndices = [];
  var chart;
  var points = [];
  var categories = [];
  $.getJSON('/resultsLocallySVM', response => {
    var prevPoint;

    var firstLeftNeighborsOutliers = [];
    var secondLeftNeighborsOutliers = [];
    var firstleftNeighborsNotOutliers = [];
    var secondLeftNeighborsNotOutliers = [];

    var firstRightNeighborsOutliers = [];
    var secondRightNeighborsOutliers = [];
    var firstRightNeighborsNotOutliers = [];
    var secondRightNeighborsNotOutliers = [];

    response.trainSet.forEach(item => {
      var dataPoints = item[0];
      var label = item[1];
      if (label === 1) {
        firstLeftNeighborsOutliers.push([dataPoints[1], dataPoints[0]]);
        firstRightNeighborsOutliers.push([dataPoints[2], dataPoints[0]]);
        secondLeftNeighborsOutliers.push([dataPoints[3], dataPoints[0]]);
        secondRightNeighborsOutliers.push([dataPoints[4], dataPoints[0]]);
      } else {
        firstleftNeighborsNotOutliers.push([dataPoints[1], dataPoints[0]]);
        firstRightNeighborsNotOutliers.push([dataPoints[2], dataPoints[0]]);
        secondLeftNeighborsNotOutliers.push([dataPoints[3], dataPoints[0]]);
        secondRightNeighborsNotOutliers.push([dataPoints[4], dataPoints[0]]);
      }
    });

    plotChart("First Left neighbor", "firstLeftNeighbors", firstLeftNeighborsOutliers, firstleftNeighborsNotOutliers);
    plotChart("First Right neighbor", "firstRightNeighbors", firstRightNeighborsOutliers, firstRightNeighborsNotOutliers);
    plotChart("Second Left neighbor", "secondLeftNeighbors", secondLeftNeighborsOutliers, secondLeftNeighborsNotOutliers);
    plotChart("Second Right neighbor", "secondRightNeighbors", secondRightNeighborsOutliers, secondRightNeighborsNotOutliers);

    response.result.forEach(function (data, index) {
      if (data.zone === 'red') {
        points.push({ color: 'red', y: data.value });
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
        text: "Testing data"
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

  $("#nextBatch").click(function () {
    displayNextBatch();
  });

  function plotChart(name, bindingElement, outlierDataset, notOutlierDataset) {
    Highcharts.chart(bindingElement, {
      chart: {
        type: 'scatter',
        zoomType: 'xy',
        height: 400,
        width: 500
      },
      title: {
        text: name
      },
      xAxis: {
        title: {
          enabled: true,
          text: name
        },
        startOnTick: true,
        endOnTick: true,
        showLastLabel: true
      },
      yAxis: {
        title: {
          text: 'Center'
        }
      },
      plotOptions: {
        scatter: {
          marker: {
            radius: 5,
            states: {
              hover: {
                enabled: true,
                lineColor: 'rgb(100,100,100)'
              }
            }
          },
          states: {
            hover: {
              marker: {
                enabled: false
              }
            }
          },
        }
      },
      series: [{
        name: 'Outlier',
        color: 'red',
        data: outlierDataset
      }, {
        name: 'Not Outlier',
        color: 'green',
        data: notOutlierDataset
      }]
    });
  }

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
});
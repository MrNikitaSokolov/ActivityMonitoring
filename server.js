'use strict';
const path = require("path");
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

const snapshotsReader = require('./services/snapshotsReader');
const algorithmExecutor = require('./services/algorithmExecutor');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'exploratory.html'));
});
app.get('/prediction', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'prediction.html'));
});
app.use('/static', express.static('public'));

app.get('/resultsLocally', (req, res) => {
  snapshotsReader.readContentsAsync('data/exploratory.json', data => {
    var parsedData = JSON.parse(data);
    var result = algorithmExecutor.executeBatchLocally(parsedData).map(el => {
      return {
        zone: el.zone,
        value: el.value,
        timestamp: el.timestamp
      }
    });
    res.json(result);
  });
});

app.get('/resultsLocallySVM', (req, res) => {
  snapshotsReader.readContentsAsync('data/main.json', data => {
    var parsedData = JSON.parse(data);
    var svmClassification = algorithmExecutor.executeBatchLocallyForSVM(parsedData);
    res.json(svmClassification);
  });
});

app.post('/outlier', (req, res) => {
  var timestamp = req.body.timestamp;
  var outlierMark = parseInt(req.body.answer);
  algorithmExecutor.populateTrainSet(timestamp, outlierMark);
  res.sendStatus(200);
});

app.post('/train', (req, res) => {
  algorithmExecutor.train().then(() => {
    res.sendStatus(200);
  });
});


const server = app.listen(3000);


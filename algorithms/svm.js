'use strict';
var svm = require('node-svm');

var SVM = function () {
  var self = this;
  var storedModel;

  self.train = function (trainSet) {
    var clf = new svm.CSVC({kFold: 1});
    clf.train(trainSet).spread(function (model) {
      storedModel = model;
    });
  }

  self.predict = function (data) {
    var newClf = svm.restore(storedModel);
    var prediction = newClf.predictSync(data);
    return prediction;
  }
}

module.exports = SVM;
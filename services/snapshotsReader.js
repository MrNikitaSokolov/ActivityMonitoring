/*
  Module for reading snapshots from the file system of the server.
*/
'use strict';
const fs = require('fs');

module.exports = {
  readContentsAsync: function (fileName, callback) {
    fs.readFile(fileName, 'utf8', (err, data) => {
      callback(data);
    });
  }
};
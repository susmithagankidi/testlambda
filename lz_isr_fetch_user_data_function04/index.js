const AWS = require('aws-sdk');

module.exports.handler = require('./handler')({
  ddb: new AWS.DynamoDB.DocumentClient(),
});

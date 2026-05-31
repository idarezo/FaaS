const AWS = require('aws-sdk');

const getClient = () => {
  if (process.env.IS_OFFLINE || process.env.STAGE === 'local') {
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000',
      accessKeyId: 'LOCAL',
      secretAccessKey: 'LOCAL',
    });
  }
  return new AWS.DynamoDB.DocumentClient();
};

const getSQS = () => {
  if (process.env.IS_OFFLINE || process.env.STAGE === 'local') {
    return new AWS.SQS({
      region: 'localhost',
      endpoint: 'http://localhost:9324',
      accessKeyId: 'LOCAL',
      secretAccessKey: 'LOCAL',
    });
  }
  return new AWS.SQS();
};

const getS3 = () => {
  if (process.env.IS_OFFLINE || process.env.STAGE === 'local') {
    return new AWS.S3({
      region: 'localhost',
      endpoint: 'http://localhost:9000',
      accessKeyId: 'LOCAL',
      secretAccessKey: 'LOCAL',
      s3ForcePathStyle: true,
    });
  }
  return new AWS.S3();
};

module.exports = { getClient, getSQS, getS3 };
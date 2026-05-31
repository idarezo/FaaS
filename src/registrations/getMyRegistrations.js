const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.userId;
    const { status } = event.queryStringParameters || {};
    const db = getClient();

    const params = {
      TableName: process.env.REGISTRATIONS_TABLE,
      IndexName: 'user-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    };

    if (status) {
      params.FilterExpression = '#s = :status';
      params.ExpressionAttributeNames = { '#s': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }

    const result = await db.query(params).promise();

    return success({
      registrations: result.Items,
      total: result.Count,
    });
  } catch (err) {
    console.error('Get my registrations error:', err);
    return error('Pridobivanje mojih prijav ni uspelo');
  }
};
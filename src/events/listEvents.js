const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const { category, limit = '20', lastKey } = event.queryStringParameters || {};
    const db = getClient();

    const params = {
      TableName: process.env.EVENTS_TABLE,
      Limit: Math.min(parseInt(limit), 100),
      FilterExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':active': 'active' },
    };

    if (category) {
      params.FilterExpression += ' AND category = :category';
      params.ExpressionAttributeValues[':category'] = category;
    }

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'));
    }

    const result = await db.scan(params).promise();

    const nextKey = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : null;

    return success({
      events: result.Items,
      count: result.Count,
      nextKey,
    });
  } catch (err) {
    console.error('List events error:', err);
    return error('Pridobivanje seznama dogodkov ni uspelo');
  }
};
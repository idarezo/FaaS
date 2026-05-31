const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const { eventId } = event.pathParameters;
    const db = getClient();

    const result = await db.get({
      TableName: process.env.EVENTS_TABLE,
      Key: { eventId },
    }).promise();

    if (!result.Item || result.Item.status === 'deleted') {
      return error('Dogodek ni bil najden', 404);
    }

    return success(result.Item);
  } catch (err) {
    console.error('Get event error:', err);
    return error('Pridobivanje dogodka ni uspelo');
  }
};
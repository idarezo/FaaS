const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

// Pridobi seznam prijavljenih udeležencev - dostop samo za organizatorja
module.exports.handler = async (event) => {
  try {
    const { eventId } = event.pathParameters;
    const userId = event.requestContext.authorizer.userId;
    const db = getClient();

    const eventResult = await db.get({
      TableName: process.env.EVENTS_TABLE,
      Key: { eventId },
    }).promise();

    if (!eventResult.Item) {
      return error('Dogodek ni bil najden', 404);
    }

    if (eventResult.Item.organizerId !== userId) {
      return error('Samo organizator si lahko ogleda seznam prijav', 403);
    }

    const result = await db.query({
      TableName: process.env.REGISTRATIONS_TABLE,
      IndexName: 'event-user-index',
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: { ':eventId': eventId },
    }).promise();

    const activeCount = result.Items.filter((r) => r.status === 'active').length;
    const cancelledCount = result.Items.filter((r) => r.status === 'cancelled').length;

    return success({
      registrations: result.Items,
      total: result.Count,
      active: activeCount,
      cancelled: cancelledCount,
    });
  } catch (err) {
    console.error('Get registrations error:', err);
    return error('Pridobivanje prijav ni uspelo');
  }
};
const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

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
      return error('Samo organizator si lahko ogleda statistiko', 403);
    }

    const [viewsResult, regsResult] = await Promise.all([
      db.query({
        TableName: process.env.ANALYTICS_TABLE,
        IndexName: 'event-views-index',
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: { ':eventId': eventId },
        Select: 'COUNT',
      }).promise(),
      db.query({
        TableName: process.env.REGISTRATIONS_TABLE,
        IndexName: 'event-user-index',
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: { ':eventId': eventId },
      }).promise(),
    ]);

    const activeRegs = regsResult.Items.filter((r) => r.status === 'active').length;
    const cancelledRegs = regsResult.Items.filter((r) => r.status === 'cancelled').length;
    const fillRate = eventResult.Item.maxCapacity > 0
      ? ((activeRegs / eventResult.Item.maxCapacity) * 100).toFixed(1)
      : 0;

    return success({
      eventId,
      title: eventResult.Item.title,
      totalViews: viewsResult.Count,
      totalRegistrations: regsResult.Count,
      activeRegistrations: activeRegs,
      cancelledRegistrations: cancelledRegs,
      maxCapacity: eventResult.Item.maxCapacity,
      fillRate: `${fillRate}%`,
      availableSpots: eventResult.Item.maxCapacity - activeRegs,
    });
  } catch (err) {
    console.error('Get event stats error:', err);
    return error('Pridobivanje statistike ni uspelo');
  }
};
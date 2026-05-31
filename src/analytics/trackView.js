const { v4: uuidv4 } = require('uuid');
const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

// Beleži ogled dogodka - anonimni ali prijavljeni uporabniki
module.exports.handler = async (event) => {
  try {
    const { eventId } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.userId || 'anonymous';
    const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'] || 'unknown';
    const ip = event.requestContext?.identity?.sourceIp || 'unknown';

    const db = getClient();

    const eventResult = await db.get({
      TableName: process.env.EVENTS_TABLE,
      Key: { eventId },
    }).promise();

    if (!eventResult.Item || eventResult.Item.status === 'deleted') {
      return error('Dogodek ni bil najden', 404);
    }

    await db.put({
      TableName: process.env.ANALYTICS_TABLE,
      Item: {
        viewId: uuidv4(),
        eventId,
        userId,
        userAgent,
        ip,
        timestamp: new Date().toISOString(),
      },
    }).promise();

    console.log(`Ogled zabeležen: event=${eventId}, user=${userId}`);
    return success({ tracked: true, eventId });
  } catch (err) {
    console.error('ERROR Track view:', err);
    return error('Beleženje ogleda ni uspelo');
  }
};
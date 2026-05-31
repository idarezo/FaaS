const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const { eventId } = event.pathParameters;
    const userId = event.requestContext.authorizer.userId;
    const db = getClient();

    const existing = await db.get({
      TableName: process.env.EVENTS_TABLE,
      Key: { eventId },
    }).promise();

    if (!existing.Item || existing.Item.status === 'deleted') {
      return error('Dogodek ni bil najden', 404);
    }

    if (existing.Item.organizerId !== userId) {
      return error('Nimate dovoljenja za brisanje tega dogodka', 403);
    }

    await db.update({
      TableName: process.env.EVENTS_TABLE,
      Key: { eventId },
      UpdateExpression: 'SET #s = :deleted, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':deleted': 'deleted',
        ':updatedAt': new Date().toISOString(),
      },
    }).promise();

    return success({ message: 'Dogodek je bil uspešno izbrisan', eventId });
  } catch (err) {
    console.error('Delete event error:', err);
    return error('Brisanje dogodka ni uspelo');
  }
};
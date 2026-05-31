const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const { eventId } = event.pathParameters;
    const userId = event.requestContext.authorizer.userId;
    const updates = JSON.parse(event.body || '{}');

    const db = getClient();

    const existing = await db.get({
      TableName: process.env.EVENTS_TABLE,
      Key: { eventId },
    }).promise();

    if (!existing.Item || existing.Item.status === 'deleted') {
      return error('Dogodek ni bil najden', 404);
    }

    if (existing.Item.organizerId !== userId) {
      return error('Nimate dovoljenja za urejanje tega dogodka', 403);
    }

    const allowedFields = ['title', 'description', 'date', 'location', 'maxCapacity', 'category', 'status'];
    const updateExpressions = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues = { ':updatedAt': new Date().toISOString() };

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = updates[field];
      }
    });

    if (updateExpressions.length === 1) {
      return error('Ni polj za posodabljanje', 400);
    }

    const result = await db.update({
      TableName: process.env.EVENTS_TABLE,
      Key: { eventId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }).promise();

    return success(result.Attributes);
  } catch (err) {
    console.error('Update event error:', err);
    return error('Posodabljanje dogodka ni uspelo');
  }
};
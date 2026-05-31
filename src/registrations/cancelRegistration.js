const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const { eventId, registrationId } = event.pathParameters;
    const userId = event.requestContext.authorizer.userId;
    const db = getClient();

    const regResult = await db.get({
      TableName: process.env.REGISTRATIONS_TABLE,
      Key: { registrationId },
    }).promise();

    if (!regResult.Item) {
      return error('Registracija ni bila najdena', 404);
    }

    const registration = regResult.Item;

    if (registration.userId !== userId) {
      return error('Nimate dovoljenja za odpoved te registracije', 403);
    }

    if (registration.eventId !== eventId) {
      return error('Registracija ne pripada temu dogodku', 400);
    }

    if (registration.status === 'cancelled') {
      return error('Registracija je bila že odpovedana', 400);
    }

    await db.transactWrite({
      TransactItems: [
        {
          Update: {
            TableName: process.env.REGISTRATIONS_TABLE,
            Key: { registrationId },
            UpdateExpression: 'SET #s = :cancelled, cancelledAt = :cancelledAt',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: {
              ':cancelled': 'cancelled',
              ':cancelledAt': new Date().toISOString(),
            },
          },
        },
        {
          Update: {
            TableName: process.env.EVENTS_TABLE,
            Key: { eventId },
            UpdateExpression: 'SET currentRegistrations = currentRegistrations - :dec',
            ConditionExpression: 'currentRegistrations > :zero',
            ExpressionAttributeValues: { ':dec': 1, ':zero': 0 },
          },
        },
      ],
    }).promise();

    return success({ message: 'Registracija je bila uspešno odpovedana', registrationId });
  } catch (err) {
    console.error('Cancel registration error:', err);
    return error('Odpoved registracije ni uspela');
  }
};
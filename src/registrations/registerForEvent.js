const { v4: uuidv4 } = require('uuid');
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

    if (!eventResult.Item || eventResult.Item.status === 'deleted') {
      return error('Dogodek ni bil najden', 404);
    }

    const faasEvent = eventResult.Item;

    if (faasEvent.status !== 'active') {
      return error('Dogodek ne sprejema prijav', 400);
    }

    if (faasEvent.currentRegistrations >= faasEvent.maxCapacity) {
      return error('Dogodek je razprodan', 400);
    }

    if (faasEvent.organizerId === userId) {
      return error('Organizator se ne more prijaviti na lastni dogodek', 400);
    }

    // Preveri, ali se je uporabnik že prijavil
    const existingReg = await db.query({
      TableName: process.env.REGISTRATIONS_TABLE,
      IndexName: 'event-user-index',
      KeyConditionExpression: 'eventId = :eventId AND userId = :userId',
      ExpressionAttributeValues: { ':eventId': eventId, ':userId': userId },
    }).promise();

    const activeReg = existingReg.Items.filter((r) => r.status === 'active');
    if (activeReg.length > 0) {
      return error('Na ta dogodek ste se že prijavili', 409);
    }

    const registrationId = uuidv4();
    const registration = {
      registrationId,
      eventId,
      userId,
      eventTitle: faasEvent.title,
      eventDate: faasEvent.date,
      eventLocation: faasEvent.location,
      status: 'active',
      registeredAt: new Date().toISOString(),
    };

    // Transakcija: ustvari registracijo in povečaj števec
    await db.transactWrite({
      TransactItems: [
        {
          Put: {
            TableName: process.env.REGISTRATIONS_TABLE,
            Item: registration,
            ConditionExpression: 'attribute_not_exists(registrationId)',
          },
        },
        {
          Update: {
            TableName: process.env.EVENTS_TABLE,
            Key: { eventId },
            UpdateExpression: 'SET currentRegistrations = currentRegistrations + :inc',
            ConditionExpression: 'currentRegistrations < maxCapacity',
            ExpressionAttributeValues: { ':inc': 1 },
          },
        },
      ],
    }).promise();

    return success(registration, 201);
  } catch (err) {
    if (err.code === 'TransactionCanceledException') {
      return error('Dogodek je razprodan ali pa ste se že prijavili', 400);
    }
    console.error('Register for event error:', err);
    return error('Prijava na dogodek ni uspela');
  }
};
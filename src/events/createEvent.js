const { v4: uuidv4 } = require('uuid');
const { getClient } = require('../utils/db');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const { title, description, date, location, maxCapacity, category } = JSON.parse(event.body || '{}');
    const organizerId = event.requestContext.authorizer.userId;

    if (!title || !date || !location) {
      return error('Polja title, date in location so obvezna', 400);
    }

    const db = getClient();
    const eventId = uuidv4();

    const newEvent = {
      eventId,
      title,
      description: description || '',
      date,
      location,
      maxCapacity: maxCapacity || 100,
      currentRegistrations: 0,
      category: category || 'splošno',
      organizerId,
      status: 'active',
      imageKey: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put({
      TableName: process.env.EVENTS_TABLE,
      Item: newEvent,
      ConditionExpression: 'attribute_not_exists(eventId)',
    }).promise();

    console.log(`Ustvarjen nov dogodek: ${eventId} - ${title}`);
    return success(newEvent, 201);
  } catch (err) {
    console.error('Create event error:', err);
    return error('Ustvarjanje dogodka ni uspelo');
  }
};
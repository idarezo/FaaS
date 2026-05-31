const { getClient, getSQS } = require('../utils/db');

// SPROŽILEC: Cron (časovni sprožilec) - vsak dan ob 8:00 UTC
// Pošlje opomnike za jutrišnje dogodke vsem prijavljenim udeležencem
module.exports.handler = async () => {
  const startTime = new Date().toISOString();
  console.log(`Cron job - dnevni opomniki - ${startTime}`);

  const db = getClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  console.log(`Iskanje dogodkov za datum: ${tomorrowDate}`);

  const eventsResult = await db.scan({
    TableName: process.env.EVENTS_TABLE,
    FilterExpression: 'begins_with(#date, :tomorrow) AND #status = :active',
    ExpressionAttributeNames: { '#date': 'date', '#status': 'status' },
    ExpressionAttributeValues: { ':tomorrow': tomorrowDate, ':active': 'active' },
  }).promise();

  console.log(`Najdenih ${eventsResult.Items.length} dogodkov za jutri`);

  let totalReminders = 0;

  for (const faasEvent of eventsResult.Items) {
    const regsResult = await db.query({
      TableName: process.env.REGISTRATIONS_TABLE,
      IndexName: 'event-user-index',
      KeyConditionExpression: 'eventId = :eventId',
      FilterExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':eventId': faasEvent.eventId, ':active': 'active' },
    }).promise();

    console.log(`Pošiljam opomnike za "${faasEvent.title}": ${regsResult.Items.length} udeležencev`);

    if (process.env.NOTIFICATIONS_QUEUE_URL && regsResult.Items.length > 0) {
      const sqs = getSQS();

      for (const reg of regsResult.Items) {
        try {
          await sqs.sendMessage({
            QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
            MessageBody: JSON.stringify({
              type: 'EVENT_REMINDER',
              userId: reg.userId,
              eventId: faasEvent.eventId,
              eventTitle: faasEvent.title,
              eventDate: faasEvent.date,
              eventLocation: faasEvent.location,
            }),
          }).promise();
          totalReminders++;
        } catch (sqsError) {
          console.error(`Napaka pri pošiljanju opomnika za ${reg.userId}:`, sqsError.message);
        }
      }
    }
  }

  const result = {
    date: tomorrowDate,
    eventsProcessed: eventsResult.Items.length,
    remindersSent: totalReminders,
    executedAt: startTime,
  };

  console.log('Rezultat cron joba:', result);
  return result;
};
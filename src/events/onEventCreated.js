const AWS = require('aws-sdk');
const { getSQS } = require('../utils/db');

// SPROŽILEC: DynamoDB Stream - podatkovne spremembe
// Aktivira se ob INSERT v tabeli EventsTable
module.exports.handler = async (event) => {
  console.log(`DynamoDB Stream - obdelava ${event.Records.length} zapisov`);

  for (const record of event.Records) {
    if (record.eventName !== 'INSERT') continue;

    const newEvent = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

    console.log(`Nov dogodek ustvarjen: "${newEvent.title}" (${newEvent.eventId})`);
    console.log(`Organizator: ${newEvent.organizerId} | Datum: ${newEvent.date}`);

    // Pošlji obvestilo v SQS za nadaljnjo obdelavo
    if (process.env.NOTIFICATIONS_QUEUE_URL) {
      try {
        const sqs = getSQS();
        await sqs.sendMessage({
          QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
          MessageBody: JSON.stringify({
            type: 'EVENT_CREATED',
            eventId: newEvent.eventId,
            organizerId: newEvent.organizerId,
            title: newEvent.title,
            date: newEvent.date,
            location: newEvent.location,
          }),
          MessageAttributes: {
            NotificationType: {
              DataType: 'String',
              StringValue: 'EVENT_CREATED',
            },
          },
        }).promise();

        console.log(`Obvestilo EVENT_CREATED poslano v SQS za dogodek ${newEvent.eventId}`);
      } catch (sqsError) {
        console.error('Napaka pri pošiljanju v SQS:', sqsError.message);
      }
    }
  }

  return { processed: event.Records.length };
};
const AWS = require('aws-sdk');
const { getSQS } = require('../utils/db');

// SPROŽILEC: DynamoDB Stream - podatkovne spremembe
// Aktivira se ob vsaki spremembi v tabeli RegistrationsTable
module.exports.handler = async (event) => {
  console.log(`DynamoDB Stream (registracije) - obdelava ${event.Records.length} zapisov`);

  for (const record of event.Records) {
    const newReg = record.dynamodb.NewImage
      ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      : null;
    const oldReg = record.dynamodb.OldImage
      ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage)
      : null;

    // Nova registracija
    if (record.eventName === 'INSERT' && newReg) {
      console.log(`Nova prijava: uporabnik ${newReg.userId} na dogodek "${newReg.eventTitle}"`);

      if (process.env.NOTIFICATIONS_QUEUE_URL) {
        try {
          const sqs = getSQS();
          await sqs.sendMessage({
            QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
            MessageBody: JSON.stringify({
              type: 'REGISTRATION_CONFIRMED',
              userId: newReg.userId,
              eventId: newReg.eventId,
              eventTitle: newReg.eventTitle,
              eventDate: newReg.eventDate,
              eventLocation: newReg.eventLocation,
              registrationId: newReg.registrationId,
            }),
          }).promise();
        } catch (sqsError) {
          console.error('SQS napaka (potrditev prijave):', sqsError.message);
        }
      }
    }

    // Odpoved registracije
    if (record.eventName === 'MODIFY' && newReg?.status === 'cancelled' && oldReg?.status === 'active') {
      console.log(`Registracija odpovedana: ${newReg.registrationId}`);

      if (process.env.NOTIFICATIONS_QUEUE_URL) {
        try {
          const sqs = getSQS();
          await sqs.sendMessage({
            QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
            MessageBody: JSON.stringify({
              type: 'REGISTRATION_CANCELLED',
              userId: newReg.userId,
              eventId: newReg.eventId,
              eventTitle: newReg.eventTitle,
              registrationId: newReg.registrationId,
            }),
          }).promise();
        } catch (sqsError) {
          console.error('SQS napaka (odpoved prijave):', sqsError.message);
        }
      }
    }
  }

  return { processed: event.Records.length };
};
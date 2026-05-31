const AWS = require('aws-sdk');
const { getSQS } = require('../utils/db');

// SPROŽILEC: DynamoDB Stream - podatkovne spremembe (INSERT v UsersTable)
// Pošlje pozdravno obvestilo ko se registrira nov uporabnik
module.exports.handler = async (event) => {
  console.log(`DynamoDB Stream (uporabniki) - ${event.Records.length} novih uporabnikov`);

  for (const record of event.Records) {
    if (record.eventName !== 'INSERT') continue;

    const newUser = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
    console.log(`Nov uporabnik: ${newUser.email} (${newUser.userId})`);

    if (process.env.NOTIFICATIONS_QUEUE_URL) {
      try {
        const sqs = getSQS();
        await sqs.sendMessage({
          QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
          MessageBody: JSON.stringify({
            type: 'WELCOME',
            userId: newUser.userId,
            email: newUser.email,
            name: newUser.name,
          }),
        }).promise();

        console.log(`Pozdravno obvestilo v vrsto za: ${newUser.email}`);
      } catch (sqsError) {
        console.error('SQS napaka (pozdravno obvestilo):', sqsError.message);
      }
    }
  }

  return { processed: event.Records.length };
};
const { getClient } = require('../utils/db');

// SPROŽILEC: S3 - shramba in datoteke
// Aktivira se ob nalaganju datoteke v S3 bucket (prefix: events/)
module.exports.handler = async (event) => {
  console.log(`S3 sprožilec - ${event.Records.length} novih datotek`);
  const db = getClient();

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const size = record.s3.object.size;
    const etag = record.s3.object.eTag;

    console.log(`Nova datoteka: ${key}`);
    console.log(`  Vedro: ${bucket}`);
    console.log(`  Velikost: ${(size / 1024).toFixed(2)} KB`);
    console.log(`  ETag: ${etag}`);

    // Izvleci eventId iz ključa: events/{eventId}/{filename}
    const parts = key.split('/');
    if (parts.length >= 3 && parts[0] === 'events') {
      const eventId = parts[1];

      try {
        await db.update({
          TableName: process.env.EVENTS_TABLE,
          Key: { eventId },
          UpdateExpression: 'SET imageKey = :imageKey, imageSize = :size, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':imageKey': key,
            ':size': size,
            ':updatedAt': new Date().toISOString(),
          },
        }).promise();

        console.log(`Dogodek ${eventId} posodobljen z novo sliko: ${key}`);
      } catch (dbError) {
        console.error(`Napaka pri posodabljanju dogodka ${eventId}:`, dbError.message);
      }
    }
  }

  return { processed: event.Records.length };
};
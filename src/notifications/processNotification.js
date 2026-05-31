const { v4: uuidv4 } = require('uuid');
const { getClient } = require('../utils/db');

// SPROŽILEC: SQS - sporočila in obveščanje
// Obdeluje obvestila iz vrste NotificationsQueue
module.exports.handler = async (event) => {
  console.log(`SQS - obdelava ${event.Records.length} obvestil`);
  const db = getClient();

  for (const record of event.Records) {
    let notification;
    try {
      notification = JSON.parse(record.body);
    } catch {
      console.error('Napaka pri razčlenjevanju SQS sporočila:', record.body);
      continue;
    }

    console.log(`Obdelava obvestila tipa: ${notification.type}`);

    // Simulacija pošiljanja e-pošte (v produkciji: AWS SES)
    switch (notification.type) {
      case 'WELCOME':
        console.log(`[E-POŠTA] Pozdravljeni ${notification.name}! Vaš račun je bil ustvarjen.`);
        console.log(`  Prejemnik: ${notification.email}`);
        break;

      case 'EVENT_CREATED':
        console.log(`[E-POŠTA] Vaš dogodek "${notification.title}" je bil uspešno ustvarjen.`);
        console.log(`  Organizator ID: ${notification.organizerId}`);
        console.log(`  Datum: ${notification.date} | Kraj: ${notification.location}`);
        break;

      case 'REGISTRATION_CONFIRMED':
        console.log(`[E-POŠTA] Prijava potrjena za "${notification.eventTitle}".`);
        console.log(`  Uporabnik: ${notification.userId}`);
        console.log(`  Datum: ${notification.eventDate} | Kraj: ${notification.eventLocation}`);
        break;

      case 'REGISTRATION_CANCELLED':
        console.log(`[E-POŠTA] Vaša prijava na "${notification.eventTitle}" je bila odpovedana.`);
        console.log(`  Uporabnik: ${notification.userId}`);
        break;

      case 'EVENT_REMINDER':
        console.log(`[E-POŠTA] Opomnik: Jutri je "${notification.eventTitle}"!`);
        console.log(`  Uporabnik: ${notification.userId}`);
        console.log(`  Kraj: ${notification.eventLocation}`);
        break;

      default:
        console.warn(`Neznan tip obvestila: ${notification.type}`);
    }

    // Shrani zapis obvestila v DynamoDB
    try {
      await db.put({
        TableName: process.env.NOTIFICATIONS_TABLE,
        Item: {
          notificationId: uuidv4(),
          userId: notification.userId || 'system',
          type: notification.type,
          payload: JSON.stringify(notification),
          sent: true,
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      }).promise();
    } catch (dbError) {
      console.error('Napaka pri shranjevanju obvestila:', dbError.message);
    }
  }

  return { processed: event.Records.length };
};
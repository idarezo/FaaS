/**
 * Skripta za ustvarjanje DynamoDB tabel za lokalni razvoj.
 * Zaženi z: node scripts/setup-local.js
 */
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'LOCAL',
  secretAccessKey: 'LOCAL',
});

const STAGE = 'local';
const SERVICE = 'faas-events';

const tables = [
  {
    TableName: `${SERVICE}-users-${STAGE}`,
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
  },
  {
    TableName: `${SERVICE}-events-${STAGE}`,
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'organizerId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'eventId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'organizer-date-index',
        KeySchema: [
          { AttributeName: 'organizerId', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
  },
  {
    TableName: `${SERVICE}-registrations-${STAGE}`,
    AttributeDefinitions: [
      { AttributeName: 'registrationId', AttributeType: 'S' },
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'registrationId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'event-user-index',
        KeySchema: [
          { AttributeName: 'eventId', KeyType: 'HASH' },
          { AttributeName: 'userId', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'user-index',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
  },
  {
    TableName: `${SERVICE}-analytics-${STAGE}`,
    AttributeDefinitions: [
      { AttributeName: 'viewId', AttributeType: 'S' },
      { AttributeName: 'eventId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'viewId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'event-views-index',
        KeySchema: [{ AttributeName: 'eventId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: `${SERVICE}-notifications-${STAGE}`,
    AttributeDefinitions: [
      { AttributeName: 'notificationId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'notificationId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user-notifications-index',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

async function createTables() {
  console.log('Ustvarjanje DynamoDB tabel za lokalni razvoj...\n');

  for (const tableParams of tables) {
    try {
      await dynamodb.createTable(tableParams).promise();
      console.log(`✓ Tabela ustvarjena: ${tableParams.TableName}`);
    } catch (err) {
      if (err.code === 'ResourceInUseException') {
        console.log(`- Tabela obstaja: ${tableParams.TableName}`);
      } else {
        console.error(`✗ Napaka pri tabeli ${tableParams.TableName}:`, err.message);
      }
    }
  }

  console.log('\nSeznam vseh tabel:');
  const list = await dynamodb.listTables().promise();
  list.TableNames.forEach((name) => console.log(`  - ${name}`));
  console.log('\nNamestitev zaključena!');
}

createTables().catch(console.error);
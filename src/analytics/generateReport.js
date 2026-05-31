const { getClient } = require('../utils/db');

// SPROŽILEC: Cron (časovni sprožilec) - vsak dan ob polnoči UTC
// Generira dnevno analitično poročilo sistema
module.exports.handler = async () => {
  const reportDate = new Date();
  reportDate.setDate(reportDate.getDate() - 1);
  const reportDateStr = reportDate.toISOString().split('T')[0];

  console.log(`Cron job - generiranje poročila za datum: ${reportDateStr}`);

  const db = getClient();

  const [eventsResult, regsResult, viewsResult, notifResult] = await Promise.all([
    db.scan({
      TableName: process.env.EVENTS_TABLE,
      FilterExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':active': 'active' },
      Select: 'COUNT',
    }).promise(),

    db.scan({
      TableName: process.env.REGISTRATIONS_TABLE,
      FilterExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':active': 'active' },
      Select: 'COUNT',
    }).promise(),

    db.scan({
      TableName: process.env.ANALYTICS_TABLE,
      FilterExpression: 'begins_with(#ts, :date)',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: { ':date': reportDateStr },
      Select: 'COUNT',
    }).promise(),

    db.scan({
      TableName: process.env.NOTIFICATIONS_TABLE,
      FilterExpression: 'begins_with(sentAt, :date)',
      ExpressionAttributeValues: { ':date': reportDateStr },
      Select: 'COUNT',
    }).promise(),
  ]);

  const report = {
    reportDate: reportDateStr,
    metrics: {
      totalActiveEvents: eventsResult.Count,
      totalActiveRegistrations: regsResult.Count,
      viewsOnDate: viewsResult.Count,
      notificationsSentOnDate: notifResult.Count,
    },
    generatedAt: new Date().toISOString(),
    system: 'FaaS Events',
  };

  console.log('=== DNEVNO POROČILO ===');
  console.log(JSON.stringify(report, null, 2));
  console.log('======================');

  // V produkciji: shrani v S3, pošlji po e-pošti ali pošlji v nadzorni sistem
  return report;
};
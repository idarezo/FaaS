const zlib = require('zlib');

// SPROŽILEC: CloudWatch Logs - logi in nadzorni dogodki
// Aktivira se ob zaznavi napak (ERROR) v dnevniku trackView funkcije
module.exports.handler = async (event) => {
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const decompressed = zlib.gunzipSync(payload).toString('utf8');
  const logData = JSON.parse(decompressed);

  console.log(`CloudWatch Logs sprožilec - logGroup: ${logData.logGroup}`);
  console.log(`Skupaj log zapisov: ${logData.logEvents.length}`);

  const errorLogs = logData.logEvents.filter((e) => e.message.includes('ERROR'));
  const warningLogs = logData.logEvents.filter((e) => e.message.includes('WARN'));

  if (errorLogs.length > 0) {
    console.warn(`Zaznanih ${errorLogs.length} napak v ${logData.logGroup}`);

    for (const logEvent of errorLogs) {
      const timestamp = new Date(logEvent.timestamp).toISOString();
      console.error(`[${timestamp}] ${logEvent.message}`);
    }

    // Alarm ob prekoračitvi praga napak
    if (errorLogs.length > 10) {
      console.error(`ALARM: Visoka stopnja napak - ${errorLogs.length} napak v skupini ${logData.logGroup}`);
      // V produkciji: pošlji alarm v SNS, PagerDuty ali Slack
    }
  }

  if (warningLogs.length > 0) {
    console.warn(`Zaznanih ${warningLogs.length} opozoril`);
  }

  return {
    logGroup: logData.logGroup,
    logStream: logData.logStream,
    totalLogs: logData.logEvents.length,
    errorsFound: errorLogs.length,
    warningsFound: warningLogs.length,
    processedAt: new Date().toISOString(),
  };
};
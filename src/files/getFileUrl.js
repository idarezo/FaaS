const { getS3 } = require('../utils/db');
const { success, error } = require('../utils/response');

// Ustvari javni podpisani URL za ogled datoteke
module.exports.handler = async (event) => {
  try {
    const { fileKey } = event.pathParameters;

    if (!fileKey) {
      return error('Ključ datoteke je obvezen', 400);
    }

    const decodedKey = decodeURIComponent(fileKey);
    const s3 = getS3();

    const viewUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.EVENTS_BUCKET,
      Key: decodedKey,
      Expires: 3600,
    });

    return success({
      viewUrl,
      fileKey: decodedKey,
      expiresInSeconds: 3600,
    });
  } catch (err) {
    console.error('Get file URL error:', err);
    return error('Generiranje URL-ja za ogled ni uspelo');
  }
};
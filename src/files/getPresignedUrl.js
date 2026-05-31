const { v4: uuidv4 } = require('uuid');
const { getS3 } = require('../utils/db');
const { success, error } = require('../utils/response');

// Ustvari predpodpisani URL za direktno nalaganje v S3
module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.userId;
    const { eventId, fileName, fileType } = event.queryStringParameters || {};

    if (!eventId || !fileName || !fileType) {
      return error('Parametri eventId, fileName in fileType so obvezni', 400);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return error('Podprti formati: JPEG, PNG, WebP', 400);
    }

    const fileExtension = fileName.split('.').pop().toLowerCase();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const fileKey = `events/${eventId}/${uniqueFileName}`;

    const s3 = getS3();
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: process.env.EVENTS_BUCKET,
      Key: fileKey,
      ContentType: fileType,
      Expires: 300,
      Metadata: {
        uploadedBy: userId,
        eventId,
        originalName: fileName,
      },
    });

    return success({
      uploadUrl: presignedUrl,
      fileKey,
      expiresInSeconds: 300,
      instructions: 'Pošljite PUT zahtevo na uploadUrl z datoteko v telesu zahteve',
    });
  } catch (err) {
    console.error('Get presigned URL error:', err);
    return error('Generiranje URL-ja za nalaganje ni uspelo');
  }
};
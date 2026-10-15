const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { config } = require('../config');
const { ValidationError } = require('../errors/AppError');

const s3 = new S3Client({ region: config.awsRegion });

const URL_EXPIRATION_SECONDS = 3600;
const ALLOWED_CONTENT_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Servicio de almacenamiento de fotografías (S3).
 * Se usan URLs prefirmadas para que el navegador suba/lea las imágenes
 * directamente, sin exponer el bucket públicamente.
 */
async function createUploadUrl({ contentType }) {
  const extension = ALLOWED_CONTENT_TYPES[contentType];
  if (!extension) {
    throw new ValidationError('Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF.');
  }

  const key = `vehiculos/${randomUUID()}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: config.fotosBucketName,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRATION_SECONDS });

  return { key, uploadUrl };
}

/** Genera una URL prefirmada de solo lectura para una clave existente. */
function createViewUrl(key) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: config.fotosBucketName, Key: key }), {
    expiresIn: URL_EXPIRATION_SECONDS,
  });
}

/** Convierte una lista de claves en objetos `{ key, url }` listos para el frontend. */
function withViewUrls(keys) {
  return Promise.all(keys.map(async (key) => ({ key, url: await createViewUrl(key) })));
}

module.exports = { createUploadUrl, createViewUrl, withViewUrls };

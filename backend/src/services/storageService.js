const { randomUUID } = require('crypto');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { config } = require('../config');
const { ValidationError } = require('../errors/AppError');

const s3 = new S3Client({ region: config.awsRegion });

const URL_EXPIRATION_SECONDS = 3600;

/** Categorías de archivo gestionadas por el sistema (HU06). */
const CATEGORIAS_ARCHIVO = ['foto', 'documento'];

/** Reglas de formato, tamaño y prefijo por categoría. */
const REGLAS_ARCHIVO = {
  foto: {
    prefijo: 'vehiculos/fotos',
    maxBytes: 5 * 1024 * 1024,
    tipos: {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    },
  },
  documento: {
    prefijo: 'vehiculos/documentos',
    maxBytes: 10 * 1024 * 1024,
    tipos: {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
    },
  },
};

/** Devuelve las reglas de una categoría o lanza `ValidationError`. */
function reglasDeCategoria(categoria) {
  const reglas = REGLAS_ARCHIVO[categoria];
  if (!reglas) {
    throw new ValidationError('Categoría de archivo no válida.', [
      { field: 'categoria', message: `Categorías permitidas: ${CATEGORIAS_ARCHIVO.join(', ')}.` },
    ]);
  }
  return reglas;
}

function formatoTamano(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * Servicio de almacenamiento de archivos (S3).
 * Se usan URLs prefirmadas para que el navegador suba/lea los archivos
 * directamente, sin exponer el bucket públicamente.
 */

/**
 * Genera una URL prefirmada para subir una fotografía o documento.
 * La firma fija el tamaño exacto (`ContentLength`), de modo que S3 rechaza
 * cualquier archivo cuyo tamaño no coincida con el declarado.
 */
async function createUploadUrl({ categoria, contentType, size }) {
  const reglas = reglasDeCategoria(categoria);
  const extension = reglas.tipos[contentType];

  if (!extension) {
    throw new ValidationError('Tipo de archivo no permitido.', [
      {
        field: 'contentType',
        message: `Formato no admitido. Permitidos: ${Object.keys(reglas.tipos).join(', ')}.`,
      },
    ]);
  }

  if (size > reglas.maxBytes) {
    throw new ValidationError('El archivo supera el tamaño máximo permitido.', [
      { field: 'size', message: `El tamaño máximo es ${formatoTamano(reglas.maxBytes)}.` },
    ]);
  }

  const key = `${reglas.prefijo}/${randomUUID()}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: config.fotosBucketName,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRATION_SECONDS });
  return { key, uploadUrl, maxSize: reglas.maxBytes };
}

/**
 * Verifica que el archivo exista en S3 y cumpla las reglas de su categoría.
 * Devuelve la metadata autoritativa (tamaño y tipo reales almacenados).
 */
async function assertArchivo(key, categoria) {
  const reglas = reglasDeCategoria(categoria);

  let head;
  try {
    head = await s3.send(new HeadObjectCommand({ Bucket: config.fotosBucketName, Key: key }));
  } catch {
    throw new ValidationError('No se encontró el archivo en el almacenamiento.', [
      { field: 'archivos', message: 'Sube nuevamente el archivo e inténtalo otra vez.' },
    ]);
  }

  if (!reglas.tipos[head.ContentType]) {
    throw new ValidationError('Tipo de archivo no permitido.', [
      { field: 'contentType', message: 'El archivo subido no corresponde a un formato autorizado.' },
    ]);
  }

  if (head.ContentLength > reglas.maxBytes) {
    throw new ValidationError('El archivo supera el tamaño máximo permitido.', [
      { field: 'size', message: `El tamaño máximo es ${formatoTamano(reglas.maxBytes)}.` },
    ]);
  }

  return { key, contentType: head.ContentType, size: head.ContentLength };
}

/** Elimina un objeto del bucket; no interrumpe la operación si ya no existe. */
async function deleteObject(key) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: config.fotosBucketName, Key: key }));
  } catch {
    // El archivo pudo eliminarse previamente; se ignora para no bloquear la operación.
  }
}

/** Genera una URL prefirmada de lectura para una clave. */
function createViewUrl(key) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: config.fotosBucketName, Key: key }), {
    expiresIn: URL_EXPIRATION_SECONDS,
  });
}

/** Convierte claves de fotos en objetos `{ key, url }` para el frontend. */
async function withViewUrls(keys) {
  return Promise.all((keys ?? []).map(async (key) => ({ key, url: await createViewUrl(key) })));
}

/** Añade la URL prefirmada de lectura a cada documento. */
async function withDocumentViewUrls(documentos) {
  return Promise.all(
    (documentos ?? []).map(async (documento) => ({
      ...documento,
      url: await createViewUrl(documento.key),
    }))
  );
}

module.exports = {
  CATEGORIAS_ARCHIVO,
  createUploadUrl,
  assertArchivo,
  deleteObject,
  createViewUrl,
  withViewUrls,
  withDocumentViewUrls,
};

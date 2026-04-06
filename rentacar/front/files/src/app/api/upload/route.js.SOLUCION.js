// SOLUCIÓN: Reemplazar el almacenamiento en disco por AWS S3
// Este archivo reemplaza: src/app/api/upload/route.js
//
// PASOS PREVIOS:
// 1. npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
// 2. Crear un bucket S3 en AWS (ej: "rentacar-imagenes")
// 3. Configurar las variables de entorno en Amplify (ver abajo)
//
// VARIABLES DE ENTORNO a agregar en Amplify Console:
//   AWS_S3_BUCKET_NAME    = nombre-de-tu-bucket
//   AWS_S3_REGION         = us-east-1  (o la región de tu bucket)
//   AWS_ACCESS_KEY_ID     = tu-access-key  (o usar IAM Role - recomendado)
//   AWS_SECRET_ACCESS_KEY = tu-secret-key  (o usar IAM Role - recomendado)

import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const cleanName = file.name
      .split('.')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const uniqueFileName = `autos/${cleanName}-${Date.now()}.${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // URL pública del archivo en S3
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION || 'us-east-1'}.amazonaws.com/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      message: 'Archivo guardado correctamente en S3',
      path: publicUrl,
    });
  } catch (error) {
    console.error('Error al subir la imagen a S3:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar la imagen', error: error.message },
      { status: 500 }
    );
  }
}

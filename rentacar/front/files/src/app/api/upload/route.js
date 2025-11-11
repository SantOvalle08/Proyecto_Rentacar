import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * API handler para guardar imágenes subidas
 */
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

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    // Obtener la extensión del archivo
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Limpiar el nombre del archivo (quitar caracteres especiales, espacios, etc.)
    const fileName = file.name
      .split('.')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    
    // Generar un nombre único para el archivo
    const uniqueFileName = `${fileName}-${Date.now()}.${fileExtension}`;
    
    // La ruta donde se guardará la imagen
    const dirPath = path.join(process.cwd(), 'public', 'images', 'autos');
    const filePath = path.join(dirPath, uniqueFileName);
    
    // Asegurarse de que el directorio exista
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error('Error creando directorio:', error);
    }
    
    // Leer el archivo como un ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Escribir el archivo en disco
    await writeFile(filePath, buffer);
    
    // Devolver la ruta relativa (para guardar en la base de datos)
    const relativePath = `/images/autos/${uniqueFileName}`;
    
    return NextResponse.json({
      success: true,
      message: 'Archivo guardado correctamente',
      path: relativePath
    });
  } catch (error) {
    console.error('Error al guardar la imagen:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar la imagen', error: error.message },
      { status: 500 }
    );
  }
} 
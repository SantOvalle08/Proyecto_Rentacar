const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/images/autos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileFilter = (_req, file, cb) => {
  if (file && file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }

  return cb(new Error('El archivo debe ser una imagen'));
};

// Configure disk storage instead of memory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadSingle = upload.single('file');

const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporciono ningun archivo'
      });
    }

    // Return relative path for the uploaded file
    const relativePath = `/images/autos/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: 'Imagen subida correctamente',
      path: relativePath,
      url: relativePath,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      storage: 'disk'
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la imagen'
    });
  }
};

module.exports = {
  uploadSingle,
  uploadImage
};

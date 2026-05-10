const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'autos');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const originalName = path.basename(file.originalname || 'imagen', extension);
    const safeName = originalName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    cb(null, `${safeName || 'imagen'}-${Date.now()}${extension || '.jpg'}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (file && file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }

  return cb(new Error('El archivo debe ser una imagen'));
};

const upload = multer({
  storage,
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

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const relativePath = `/uploads/autos/${req.file.filename}`;
    const url = `${protocol}://${host}${relativePath}`;

    return res.status(201).json({
      success: true,
      message: 'Imagen subida correctamente',
      path: url,
      url,
      relativePath
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

const multer = require('multer');

const fileFilter = (_req, file, cb) => {
  if (file && file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }

  return cb(new Error('El archivo debe ser una imagen'));
};

const upload = multer({
  storage: multer.memoryStorage(),
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

    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    return res.status(201).json({
      success: true,
      message: 'Imagen subida correctamente',
      path: dataUrl,
      url: dataUrl,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      storage: 'memory'
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

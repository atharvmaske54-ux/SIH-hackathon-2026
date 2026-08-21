const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE_DIR = path.join(__dirname, '../../uploads');
const INCIDENTS_DIR = path.join(UPLOAD_BASE_DIR, 'incidents');
const SOS_DIR = path.join(UPLOAD_BASE_DIR, 'sos');

// Ensure directories exist
[UPLOAD_BASE_DIR, INCIDENTS_DIR, SOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes('sos')) {
      cb(null, SOS_DIR);
    } else {
      cb(null, INCIDENTS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/mp3', 'audio/aac', 'audio/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max limit
  fileFilter
});

module.exports = upload;

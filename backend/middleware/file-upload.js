const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
require('dotenv').config();

const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
  },
  forcePathStyle: true
});

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/heif': 'heif',
  'image/heic': 'heic',
  'image/heif-sequence': 'heif',
  'image/heic-sequence': 'heic'
};

const fileUpload = (options = {}) => {
  const { 
    fileType = 'image', 
    maxSize = 5000000,
    destination = 'uploads',
    multiple = false,
    maxCount = 5
  } = options;

  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error('Invalid mime type!');
    cb(error, isValid);
  };

  const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: maxSize } });

  const processImage = async (file, userId) => {
    const buffer = await sharp(file.buffer, { failOnError: false })
      .resize({ width: 1000, height: 1000, fit: 'inside' })
      .webp({ quality: 70 })
      .toBuffer();

    const fileName = `${userId}/${destination}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

    const uploadParams = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/webp',
      ACL: 'public-read'
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return {
      key: fileName,
      location: `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`
    };
  };

  return (req, res, next) => {
    const uploadMiddleware = multiple ? upload.array('images', maxCount) : upload.single('image');

    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      try {
        if (multiple && req.files) {
          const processedFiles = await Promise.all(
            req.files.map(file => processImage(file, req.userId))
          );
          
          req.files = req.files.map((file, index) => ({
            ...file,
            key: processedFiles[index].key,
            location: processedFiles[index].location
          }));
        } else if (!multiple && req.file) {
          const processed = await processImage(req.file, req.userId);
          req.file.key = processed.key;
          req.file.location = processed.location;
        }

        next();
      } catch (error) {
        console.error('Error processing upload:', error);
        next(error);
      }
    });
  };
};

module.exports = {
  fileUpload
};

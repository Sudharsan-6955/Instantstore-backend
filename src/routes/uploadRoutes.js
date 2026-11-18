const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// In-memory buffer storage for fast edge transit to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Configure Cloudinary from server environment
const getCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
};

// POST /api/upload/cloudinary
// Accepts multipart/form-data with field name 'image' or 'file'
router.post('/cloudinary', upload.single('image'), async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary credentials missing in server .env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)',
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please attach a file under key "image".',
      });
    }

    const cld = getCloudinary();

    // Stream upload directly to Cloudinary without saving to disk
    const stream = cld.uploader.upload_stream(
      {
        folder: 'instantstore',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          return res.status(500).json({
            success: false,
            message: error.message || 'Cloudinary upload failed',
          });
        }
        return res.status(200).json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    stream.end(file.buffer);
  } catch (err) {
    console.error('[Upload Endpoint Error]', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error during image upload',
    });
  }
});

module.exports = router;

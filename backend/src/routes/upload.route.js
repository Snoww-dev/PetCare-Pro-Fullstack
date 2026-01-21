const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Cấu hình Cloudinary (Lấy từ file .env của bạn)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// 2. Cấu hình nơi lưu trữ (Tự động tạo folder 'petcare-pro' trên Cloud)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'petcare-pro',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// 3. API Upload: Nhận file -> Lưu lên Cloud -> Trả về link ảnh
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Chưa chọn file ảnh!' });
    }

    // Trả về đường dẫn ảnh online (req.file.path)
    res.json({
      success: true,
      message: 'Upload thành công! 📸',
      imageUrl: req.file.path 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi upload: ' + error.message });
  }
});

module.exports = router;
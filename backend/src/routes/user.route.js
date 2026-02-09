const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');
const jwt = require('jsonwebtoken');

// 👇 1. KHAI BÁO THƯ VIỆN & CẤU HÌNH NGAY TẠI ĐÂY (Để tránh lỗi không tìm thấy file)
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary (Thông tin của bạn)
cloudinary.config({
  cloud_name: 'dn4dwjot',
  api_key: '621559651451135',
  api_secret: 'iHTnTpYrEBrx0OkzPKewyuY8EmQ'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'petcare_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const uploadCloud = multer({ storage });
// ---------------------------------------------------------

// API lấy thông tin: GET /api/users/me
router.get('/me', authMiddleware, userController.getMe);

// API cập nhật: PUT /api/users/me (Có upload ảnh)
router.put('/me', authMiddleware, uploadCloud.single('image'), async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { display_name, phone } = req.body;

        const currentUser = await User.findById(userId);
        if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

        // Cập nhật tên & sđt
        if (display_name) currentUser.display_name = display_name;
        if (phone) currentUser.phone = phone;

        // Cập nhật ảnh (Nếu có)
        if (req.file) {
            currentUser.img_url = req.file.path;
        }

        await currentUser.save();

        res.json({
            success: true,
            message: "Update successful",
            data: {
                _id: currentUser._id,
                name: currentUser.display_name,
                email: currentUser.email,
                avatar: currentUser.img_url,
                phone: currentUser.phone
            }
        });
    } catch (error) {
        console.error("Lỗi update:", error);
        res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }
});

module.exports = router;
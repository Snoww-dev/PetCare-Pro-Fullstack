const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');
const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

// 👇 1. KHAI BÁO THƯ VIỆN UPLOAD ẢNH TRỰC TIẾP TẠI ĐÂY
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 👇 2. CẤU HÌNH CLOUDINARY (Gộp vào đây cho chắc chắn)
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
        // Lấy ID user từ token
        const userId = req.user.id || req.user._id;
        const { display_name, phone } = req.body;

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "Không tìm thấy User!" });
        }

        // Cập nhật thông tin text
        if (display_name) currentUser.display_name = display_name;
        if (phone) currentUser.phone = phone;

        // Cập nhật ảnh (Nếu có gửi lên)
        if (req.file) {
            currentUser.img_url = req.file.path; // Link ảnh từ Cloudinary
        }

        await currentUser.save();

        res.json({
            success: true,
            message: "Cập nhật thành công! 🎉",
            data: {
                _id: currentUser._id,
                name: currentUser.display_name,
                email: currentUser.email,
                avatar: currentUser.img_url,
                phone: currentUser.phone
            }
        });

    } catch (error) {
        console.error("Lỗi update profile:", error);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

module.exports = router;
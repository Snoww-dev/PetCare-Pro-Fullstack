const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');
const User = require('../models/User.model'); // 👇 Import Model để thao tác Database
const uploadCloud = require('../config/cloudinary.config'); // 👇 Import cấu hình Cloudinary vừa tạo

// API lấy thông tin: GET /api/users/me (Giữ nguyên logic cũ của bạn)
router.get('/me', authMiddleware, userController.getMe);

// API cập nhật: PUT /api/users/me (👇 ĐÃ SỬA: Thêm uploadCloud.single('image'))
router.put('/me', authMiddleware, uploadCloud.single('image'), async (req, res) => {
    try {
        // 1. Lấy ID user từ token (authMiddleware đã giải mã xong)
        // (Kiểm tra cả .id và ._id để chắc chắn lấy đúng)
        const userId = req.user.id || req.user._id;

        const { display_name, phone } = req.body;

        // 2. Tìm User trong Database
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "Không tìm thấy User này!" });
        }

        // 3. Cập nhật thông tin văn bản (Tên, SĐT)
        if (display_name) currentUser.display_name = display_name;
        if (phone) currentUser.phone = phone;

        // 4. Cập nhật Ảnh (QUAN TRỌNG NHẤT)
        // Nếu Cloudinary nhận ảnh thành công, nó sẽ trả về thông tin trong req.file
        if (req.file) {
            currentUser.img_url = req.file.path; // Đây là link ảnh trên mây (Cloudinary)
        }

        // 5. Lưu vào Database
        await currentUser.save();

        // 6. Trả kết quả về cho App
        res.json({
            success: true,
            message: "Cập nhật thành công! 🎉",
            data: {
                _id: currentUser._id,
                name: currentUser.display_name,
                email: currentUser.email,
                avatar: currentUser.img_url, // Trả về link ảnh mới nhất
                phone: currentUser.phone
            }
        });

    } catch (error) {
        console.error("Lỗi update profile:", error);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

module.exports = router;
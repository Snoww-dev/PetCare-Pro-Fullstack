const express = require('express');
const router = express.Router();
const User = require('../models/User.model'); // Nhớ đảm bảo đúng đường dẫn model
const Pet = require('../models/Pet.model');
const bcrypt = require('bcryptjs'); // 👇 Dùng để mã hóa mật khẩu

// 1. API LẤY THỐNG KÊ (Giữ nguyên, nhưng bỏ trường password đi cho bảo mật)
router.get('/users-stats', async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'pets',
                    localField: '_id',
                    foreignField: 'owner',
                    as: 'pet_list'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    // password: 1,  <-- ĐÃ XÓA DÒNG NÀY ĐỂ BẢO MẬT
                    createdAt: 1,
                    petCount: { $size: "$pet_list" }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        const totalUsers = users.length;
        const totalPets = users.reduce((acc, user) => acc + user.petCount, 0);

        res.json({
            success: true,
            stats: { totalUsers, totalPets },
            data: users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 2. 👇 API MỚI: ADMIN TẠO USER
router.post('/create-user', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Kiểm tra xem email đã có chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email này đã tồn tại!" });
        }

        // Mã hóa mật khẩu (Bắt buộc)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.json({ success: true, message: "Tạo tài khoản thành công! 🎉" });

    } catch (error) {
        console.error("Lỗi tạo user:", error);
        res.status(500).json({ success: false, message: "Lỗi Server khi tạo User" });
    }
});

module.exports = router;
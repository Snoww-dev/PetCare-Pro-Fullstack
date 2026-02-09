const express = require('express');
const router = express.Router();
const User = require('../models/User.model'); 
const Pet = require('../models/Pet.model');
const bcrypt = require('bcryptjs'); 

// 1. API LẤY THỐNG KÊ (Đã thêm lấy ảnh đại diện)
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
                    // Map trường 'display_name' sang 'name' cho Frontend dễ dùng
                    name: "$display_name", 
                    email: 1,
                    role: 1, 
                    img_url: 1, // 👈 QUAN TRỌNG: Thêm dòng này để lấy link ảnh
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

// 2. API TẠO USER (Giữ nguyên)
router.post('/create-user', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email này đã tồn tại!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            display_name: name, 
            email,
            password: hashedPassword,
            role: 'user' // Mặc định tạo mới là user thường
        });

        await newUser.save();
        res.json({ success: true, message: "Tạo tài khoản thành công! 🎉" });

    } catch (error) {
        console.error("Lỗi tạo user:", error);
        if (error.code === 11000) {
             return res.status(400).json({ success: false, message: "Email này đã được sử dụng rồi!" });
        }
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

// 3. API CẬP NHẬT QUYỀN (Giữ nguyên)
router.put('/update-role', async (req, res) => {
    try {
        const { userId, newRole } = req.body; // newRole sẽ là 'admin' hoặc 'user'

        // Tìm user và cập nhật trường role
        await User.findByIdAndUpdate(userId, { role: newRole });

        res.json({ success: true, message: "Cập nhật quyền thành công!" });
    } catch (error) {
        console.error("Lỗi update role:", error);
        res.status(500).json({ success: false, message: "Lỗi Server khi cập nhật quyền" });
    }
});

module.exports = router;
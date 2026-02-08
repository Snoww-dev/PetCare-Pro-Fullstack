const express = require('express');
const router = express.Router();
const User = require('../models/User.model'); 
const Pet = require('../models/Pet.model');

// GET /api/admin/users-stats
router.get('/users-stats', async (req, res) => {
    try {
        // Sử dụng Aggregate để lấy User và đếm số Pet của họ
        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'pets',           // Tên collection trong MongoDB (thường là số nhiều của tên Model)
                    localField: '_id',      // ID của User
                    foreignField: 'owner',  // Trường trong Pet trỏ về User (kiểm tra lại model Pet của bạn là 'owner' hay 'userId')
                    as: 'pet_list'          // Tên mảng tạm chứa danh sách pet
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    createdAt: 1,
                    petCount: { $size: "$pet_list" } // Đếm số lượng phần tử trong mảng pet_list
                }
            },
            { $sort: { createdAt: -1 } } // Sắp xếp người mới nhất lên đầu
        ]);

        const totalUsers = users.length;
        const totalPets = users.reduce((acc, user) => acc + user.petCount, 0);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalPets
            },
            data: users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
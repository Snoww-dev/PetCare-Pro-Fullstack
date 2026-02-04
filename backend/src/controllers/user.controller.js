const User = require('../models/User.model');

// Lấy thông tin user hiện tại
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Không trả về password
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Cập nhật thông tin user
exports.updateMe = async (req, res) => {
    try {
        const { name } = req.body;
        let updateData = { name };

        // Nếu có upload ảnh avatar (xử lý sau nếu cần)
        // if (req.file) updateData.avatar = req.file.path;

        const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
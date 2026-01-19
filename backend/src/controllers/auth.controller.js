const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // <--- Cần cái này để tạo vé

// 1. Đăng Ký (Code cũ, giữ nguyên)
const register = async (req, res) => {
    try {
        const { display_name, email, password, phone } = req.body;
        const userExists = await User.findOne({ email });
        
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            display_name, email, password: hashedPassword, phone
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công!',
            data: { id: newUser._id, email: newUser.email, display_name: newUser.display_name }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

// 2. Đăng Nhập (MỚI THÊM)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // a. Tìm xem email có tồn tại không
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // b. So sánh mật khẩu (Mật khẩu nhập vào vs Mật khẩu đã mã hóa trong DB)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // c. Tạo vé vào cổng (Token) - Vé này có hạn 1 ngày
        // Lưu ý: Cần tạo 1 mã bí mật trong file .env, tạm thời mình dùng cứng là 'tuyetsecret'
        const token = jwt.sign(
            { userId: user._id }, // ⚠️ PHẢI LÀ userId (không được viết là id hay sub)
                process.env.JWT_SECRET || 'secret123',
                { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            token: token, // <--- Trả về cái vé này
            user: {
                id: user._id,
                display_name: user.display_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

// Xuất cả 2 hàm ra
module.exports = { register, login };
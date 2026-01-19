const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // 1. Lấy token từ header gửi lên
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập!' });
        }

        // 2. Giải mã token xem có đúng chìa khóa không
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        
        // 3. Lưu ID người dùng vào biến req để các hàm sau dùng
        req.userId = decoded.userId;
        
        next(); // Cho phép đi tiếp
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token không hợp lệ!' });
    }
};

module.exports = authMiddleware;
// 👇 QUAN TRỌNG: Kiểm tra kỹ tên file trong thư mục models là 'User.model.js' hay 'user.model.js'
// Nếu file của bạn viết thường hết, hãy sửa dòng dưới thành: require('../models/user.model');
const User = require('../models/User.model'); 

// 1. Lấy thông tin user hiện tại
exports.getMe = async (req, res) => {
    try {
        // 👇 Log ra Terminal của Render để xem Middleware gửi gì sang
        console.log("👉 [DEBUG] getMe được gọi. Dữ liệu từ Token:", req.user || req.userId);

        // 👇 Xử lý linh hoạt: Chấp nhận cả req.user.id HOẶC req.userId
        const userId = (req.user && req.user.id) || req.userId;

        if (!userId) {
            console.log("❌ [LỖI] Không tìm thấy User ID trong request (Lỗi Middleware)");
            return res.status(401).json({ success: false, message: 'Không tìm thấy thông tin xác thực' });
        }

        const user = await User.findById(userId).select('-password'); // Bỏ password ra

        if (!user) {
            console.log("❌ [LỖI] Có ID nhưng không tìm thấy User trong Database:", userId);
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        res.json({ success: true, data: user });

    } catch (error) {
        // 👇 In lỗi chi tiết ra để biết sai ở đâu (Kết nối DB, sai Model...)
        console.error("❌ [SERVER ERROR] Lỗi tại getMe:", error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};

// 2. Cập nhật thông tin user
exports.updateMe = async (req, res) => {
    try {
        const userId = (req.user && req.user.id) || req.userId;
        const { name } = req.body;
        
        let updateData = { name };

        // Nếu có upload ảnh (Nếu bạn chưa cài multer cho user thì dòng này sẽ được bỏ qua an toàn)
        if (req.file) {
            updateData.avatar = req.file.path;
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        
        res.json({ success: true, data: user });
    } catch (error) {
        console.error("❌ [SERVER ERROR] Lỗi tại updateMe:", error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};
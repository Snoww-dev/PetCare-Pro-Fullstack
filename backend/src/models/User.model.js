const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    display_name: {  // Tên hiển thị
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { // Mật khẩu đã mã hóa
        type: String,
        required: true,
        minlength: 6
    },
    phone: { // Số điện thoại (giữ lại để App Mobile dùng)
        type: String,
        default: ''
    },
    img_url: { // Avatar (giữ lại để App Mobile dùng)
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    
    // 👇 QUAN TRỌNG: Phần phân quyền
    role: { 
        type: String,
        enum: ['user', 'admin', 'staff'], // Hỗ trợ cả: Người dùng, Admin, Nhân viên
        default: 'user' // Mặc định tạo mới là User thường
    }
}, { timestamps: true }); // Tự động tạo createdAt và updatedAt

module.exports = mongoose.model('User', UserSchema);
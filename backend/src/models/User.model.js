const mongoose = require('mongoose');

// Dựa trên bảng "customers" trong bản vẽ của bạn
const UserSchema = new mongoose.Schema({
    display_name: {  // Thay cho username
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
    password: { // Trong DB của bạn là hash_password
        type: String,
        required: true,
        minlength: 6
    },
    phone: { // Thêm trường số điện thoại như thiết kế
        type: String,
        default: ''
    },
    img_url: { // Avatar người dùng
        type: String,
        default: 'https://via.placeholder.com/150' // Ảnh mặc định nếu họ chưa up
    },
    role: { // Gộp bảng "admin" vào đây luôn cho gọn
        type: String,
        enum: ['user', 'admin', 'staff'], 
        default: 'user'
    }
}, { timestamps: true }); // Tự động có created_at, updated_at

module.exports = mongoose.model('User', UserSchema);
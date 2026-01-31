const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true },
    species: { type: String, required: true },
    breed: { type: String },
    gender: { type: String, enum: ['male', 'female'], default: 'male' },
    weight: { type: Number, default: 0 },
    birthday: { type: Date },
    img_url: { type: String }, 
    note: { type: String },
    
    // 👇 ĐÃ SỬA LẠI TÊN BIẾN THÀNH 'medical_records' (cho khớp với Route)
    medical_records: [
        {
            date: { type: String }, // Đổi sang String để dễ lưu dạng YYYY-MM-DD từ App gửi lên
            type: { type: String, default: 'medical' }, // Bỏ Enum cứng nhắc để tránh lỗi, mặc định là medical
            title: { type: String, required: true },
            description: { type: String },
            doctor: { type: String },
            img_url: { type: String } // 👈 ĐÃ THÊM: Chỗ để lưu link ảnh X-quang/Đơn thuốc
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model('Pet', petSchema);
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

    // 👇 THÊM MỚI: Phân loại thú cưng
    // 'owned': Đang nuôi (Có đầy đủ thông tin y tế)
    // 'encountered': Gặp trên đường (Chỉ lưu ảnh làm kỷ niệm)
    category: { 
        type: String, 
        enum: ['owned', 'encountered'], 
        default: 'owned' 
    },

    // 👇 Mảng chứa bộ sưu tập ảnh (Growth Timeline)
    gallery: [
        {
            img_url: { type: String, required: true },
            date: { type: Date, default: Date.now },
            caption: { type: String } // Ví dụ: "Lần đầu đi tắm", "Sinh nhật 1 tuổi"
        }
    ],

    contact_info: { type: String, default: "Xin hãy gọi cho chủ nhân của tôi!" },
    
    // 👇 Hồ sơ y tế
    medical_records: [
        {
            date: { type: String }, 
            type: { type: String, default: 'medical' }, 
            title: { type: String, required: true },
            description: { type: String },
            doctor: { type: String },
            img_url: { type: String }, 
            next_appointment: { type: String } 
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model('Pet', petSchema);
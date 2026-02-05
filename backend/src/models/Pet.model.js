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

    // Phân loại thú cưng
    category: { 
        type: String, 
        enum: ['owned', 'encountered'], 
        default: 'owned' 
    },

    // Bộ sưu tập ảnh (Growth Timeline)
    gallery: [
        {
            img_url: { type: String, required: true },
            date: { type: Date, default: Date.now },
            caption: { type: String }
        }
    ],

    contact_info: { type: String, default: "Xin hãy gọi cho chủ nhân của tôi!" },
    
    // Hồ sơ y tế
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
    ],

    // 👇 MỚI: Kế hoạch ăn uống (Diet Plans)
    diet_plans: [
        {
            time: { type: String, required: true }, // VD: "07:00"
            title: { type: String, required: true }, // VD: "Bữa sáng"
            food: { type: String }, // VD: "Hạt Royal Canin"
            amount: { type: String }, // VD: "50g"
            note: { type: String }
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model('Pet', petSchema);
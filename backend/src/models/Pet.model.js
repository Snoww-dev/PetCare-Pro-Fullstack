const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true },
    species: { type: String, required: true }, // Chó, Mèo...
    breed: { type: String }, // Giống (Poodle, Corgi...)
    gender: { type: String, enum: ['male', 'female'], default: 'male' },
    weight: { type: Number, default: 0 },
    birthday: { type: Date },
    img_url: { type: String }, // Link ảnh
    note: { type: String },
    
    // 👇 THÊM PHẦN NÀY: Hồ sơ sức khỏe (Mảng chứa các mũi tiêm/khám bệnh)
    medicalRecords: [
        {
            date: { type: Date, default: Date.now }, // Ngày khám/tiêm
            type: { type: String, enum: ['vaccine', 'checkup', 'surgery'], default: 'vaccine' }, // Loại
            title: { type: String, required: true }, // Tên mũi tiêm (VD: Dại, 7 bệnh)
            description: { type: String }, // Ghi chú thêm
            doctor: { type: String } // Tên bác sĩ/Phòng khám
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model('Pet', petSchema);
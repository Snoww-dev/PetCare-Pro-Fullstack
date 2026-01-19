const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    species: { // Loài (Chó, Mèo...)
        type: String, 
        required: true 
    },
    breed: { // Giống (Poodle, Husky...)
        type: String 
    },
    gender: {
        type: String,
        enum: ['male', 'female'], // Chỉ được chọn Đực hoặc Cái
        default: 'male'
    },
    birthday: { // Ngày sinh
        type: Date 
    },
    weight: { // Cân nặng (kg)
        type: Number 
    },
    img_url: {
        type: String,
        default: ''
    },
    note: { // Ghi chú đặc biệt
        type: String 
    },
    owner: { // CHỦ SỞ HỮU (Liên kết với bảng User)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Pet', PetSchema);
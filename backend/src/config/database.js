const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB đã kết nối: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Lỗi: ${error.message}`);
        process.exit(1);
    }
};

// QUAN TRỌNG NHẤT LÀ DÒNG NÀY:
module.exports = connectDB;
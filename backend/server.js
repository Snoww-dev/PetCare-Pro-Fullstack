require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');

// --- CÁC ROUTE (ĐƯỜNG DẪN) ---
const authRoutes = require('./src/routes/auth.route');
const petRoutes = require('./src/routes/pet.route');
const uploadRoutes = require('./src/routes/upload.route'); // 👈 MỚI THÊM: Gọi file xử lý upload

// 1. Khởi tạo ứng dụng Express
const app = express();

// 2. Kết nối Database
connectDB();

// 3. Middlewares (Bộ lọc)
app.use(express.json());
app.use(cors());

// --- KÍCH HOẠT CÁC ROUTE ---
app.use('/api/auth', authRoutes);       // Các tính năng Đăng nhập/Đăng ký
app.use('/api/pets', petRoutes);        // Các tính năng Thú cưng
app.use('/api/upload', uploadRoutes);   // 👈 MỚI THÊM: Kích hoạt đường dẫn Upload ảnh

// 4. Route test (Kiểm tra server sống hay chết)
app.get('/', (req, res) => {
    res.send('API Pet Manager đang chạy ngon lành! 🚀');
});

// 5. Chạy Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});
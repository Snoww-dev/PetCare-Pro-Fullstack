require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');

// <--- 1. THÊM DÒNG NÀY: Gọi file route vừa tạo vào
const authRoutes = require('./src/routes/auth.route');
const petRoutes = require('./src/routes/pet.route'); // <--- 1. Gọi route Pet vào

// 1. Khởi tạo ứng dụng Express
const app = express();

// 2. Kết nối Database
connectDB();

// 3. Middlewares
app.use(express.json());
app.use(cors());

// <--- 2. THÊM DÒNG NÀY: Kích hoạt đường dẫn
// Nghĩa là: Ai muốn vào các tính năng auth thì phải bắt đầu bằng /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes); // <--- 2. Kích hoạt đường dẫn /api/pets

// 4. Route test
app.get('/', (req, res) => {
    res.send('API Pet Manager đang chạy ngon lành! 🚀');
});

// 5. Chạy Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});
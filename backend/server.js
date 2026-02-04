require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');

// 1. Import Model Pet
const Pet = require('./src/models/Pet.model.js'); 

// --- CÁC ROUTE (ĐƯỜNG DẪN) ---
const authRoutes = require('./src/routes/auth.route');
const petRoutes = require('./src/routes/pet.route');
const uploadRoutes = require('./src/routes/upload.route'); 
// 👇 ĐÃ SỬA: Import User Route (Thêm src/ vào đường dẫn và đưa lên đây)
const userRoutes = require('./src/routes/user.route');

// 2. Khởi tạo ứng dụng Express
const app = express();

// 3. Kết nối Database
connectDB();

// 4. Middlewares (Bộ lọc)
app.use(express.json());
app.use(cors());

// --- KÍCH HOẠT CÁC ROUTE API ---
app.use('/api/auth', authRoutes);       
app.use('/api/pets', petRoutes);        
app.use('/api/upload', uploadRoutes);   
// 👇 ĐÃ SỬA: Kích hoạt Route User tại đây
app.use('/api/users', userRoutes);

// 👇 === 5. ROUTE TÌM TRẺ LẠC ===
// Route công khai: Hiển thị thông tin Pet dưới dạng trang Web HTML
app.get('/find/:id', async (req, res) => {
  try {
    // Tìm thú cưng theo ID trên đường dẫn
    const pet = await Pet.findById(req.params.id);
    
    // Nếu không thấy thì báo lỗi 404
    if (!pet) {
      return res.status(404).send('<h1>😿 Không tìm thấy thông tin thú cưng này!</h1>');
    }

    // Trả về một trang HTML đẹp mắt
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tìm thấy ${pet.name}?</title>
        <style>
          body { font-family: sans-serif; background-color: #FFF0F3; text-align: center; padding: 20px; }
          .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
          img { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 5px solid #FF9A9E; margin-bottom: 20px; }
          h1 { color: #FF6B81; margin: 10px 0; }
          p { color: #555; font-size: 18px; line-height: 1.6; }
          .btn { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 20px; margin-top: 20px; animation: pulse 2s infinite; }
          @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        </style>
      </head>
      <body>
        <div class="card">
          <img src="${pet.img_url || 'https://cdn-icons-png.flaticon.com/512/616/616408.png'}" alt="Pet Image">
          <h1>🐶 Tôi là ${pet.name}</h1>
          <p>Tôi bị đi lạc, xin hãy giúp tôi về nhà!</p>
          <p>Giống: <strong>${pet.breed || 'Không rõ'}</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Vui lòng gọi cho chủ tôi:</p>
          <a href="tel:0909123456" class="btn">📞 GỌI CHỦ NHÂN</a>
        </div>
      </body>
      </html>
    `;
    
    res.send(htmlContent);

  } catch (error) {
    console.error(error); 
    res.status(500).send('Lỗi Server: ' + error.message);
  }
});

// 6. Route test (Kiểm tra server)
app.get('/', (req, res) => {
    res.send('API Pet Manager đang chạy ngon lành! 🚀');
});

// 7. Chạy Server (Luôn để cuối cùng)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});
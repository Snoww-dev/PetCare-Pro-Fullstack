const express = require('express');
const router = express.Router();

// 👇 Import "Bảo vệ" (Auth)
const authMiddleware = require('../middlewares/auth.middleware');
const petController = require('../controllers/pet.controller');

// 👇 Import "Vận chuyển" (Upload)
const uploadCloud = require('../middlewares/uploader'); 

// 👇 Import Model Pet
const Pet = require('../models/Pet.model'); 

// --- CÁC ROUTE CƠ BẢN ---
router.post('/', authMiddleware, petController.createPet); 
router.get('/', authMiddleware, petController.getPets);    
router.get('/:id', authMiddleware, petController.getPet);
router.delete('/:id', authMiddleware, petController.deletePet); 

// 👇 ĐÃ SỬA: Thêm uploadCloud.single('image') vào đây để nhận ảnh khi chỉnh sửa
router.put('/:id', authMiddleware, uploadCloud.single('image'), petController.updatePet); 

// --- ROUTE THÊM HỒ SƠ Y TẾ (CÓ ẢNH) ---
router.post('/:id/medical', authMiddleware, uploadCloud.single('image'), async (req, res) => {
  try {
    const { date, title, description, doctor, type } = req.body;
    
    // Lấy link ảnh nếu có
    const img_url = req.file ? req.file.path : '';

    const newRecord = {
      date,
      title: title || 'Khám bệnh',
      description,
      doctor,
      type: type || 'medical',
      img_url
    };

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $push: { medical_records: newRecord } },
      { new: true }
    );

    if (!pet) return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng' });

    res.json({ success: true, data: pet });

  } catch (error) {
    console.error("Lỗi thêm medical:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
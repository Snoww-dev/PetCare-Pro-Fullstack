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

// 👇 QUAN TRỌNG: ĐÃ SỬA - Thêm uploadCloud.single('image') để nhận ảnh và FormData khi tạo Pet
router.post('/', authMiddleware, uploadCloud.single('image'), petController.createPet); 

router.get('/', authMiddleware, petController.getPets);    
router.get('/:id', authMiddleware, petController.getPet);
router.delete('/:id', authMiddleware, petController.deletePet); 

// 👇 Route sửa thông tin Pet (Cũng cần uploadCloud để nhận ảnh mới nếu có)
router.put('/:id', authMiddleware, uploadCloud.single('image'), petController.updatePet); 

// --- ROUTE THÊM HỒ SƠ Y TẾ (CÓ ẢNH) ---
router.post('/:id/medical', authMiddleware, uploadCloud.single('image'), async (req, res) => {
  try {
    const { date, title, description, doctor, type, next_appointment } = req.body;
    
    // Lấy link ảnh nếu có
    const img_url = req.file ? req.file.path : '';

    const newRecord = {
      date,
      title: title || 'Khám bệnh',
      description,
      doctor,
      type: type || 'medical',
      img_url,
      next_appointment: next_appointment || null 
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

// --- ROUTE THÊM ẢNH VÀO BỘ SƯU TẬP (GALLERY) ---
router.post('/:id/gallery', authMiddleware, uploadCloud.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Chưa chọn ảnh' });

        const newImage = {
            img_url: req.file.path,
            date: req.body.date || new Date(), 
            caption: req.body.caption || ''
        };

        const pet = await Pet.findByIdAndUpdate(
            req.params.id,
            { $push: { gallery: newImage } }, 
            { new: true }
        );

        res.json({ success: true, data: pet });
    } catch (error) {
        console.error("Gallery upload error:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// API Sửa bệnh án (Có upload ảnh nếu cần)
router.put('/:petId/medical/:recordId', authMiddleware, uploadCloud.single('image'), petController.updateMedicalRecord);

// API Xóa bệnh án
router.delete('/:petId/medical/:recordId', authMiddleware, petController.deleteMedicalRecord);

module.exports = router;
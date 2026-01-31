const express = require('express');
const router = express.Router();

// 👇 Import các "người gác cổng" và Controller
const authMiddleware = require('../middlewares/auth.middleware');
const petController = require('../controllers/pet.controller');

// 👇 MỚI THÊM: Import bộ xử lý Upload ảnh và Model Pet
const uploadCloud = require('../middlewares/auth.middleware');
const Pet = require('../models/Pet.model'); // Đảm bảo tên file model khớp với project của bạn

// --- CÁC ROUTE CƠ BẢN (Dùng Controller) ---
// Thêm mới Pet (Nếu Pet có ảnh đại diện thì cần thêm uploadCloud vào đây, nhưng tạm thời giữ nguyên theo code cũ của bạn)
router.post('/', authMiddleware, petController.createPet); 

// Xem danh sách & Chi tiết
router.get('/', authMiddleware, petController.getPets);    
router.get('/:id', authMiddleware, petController.getPet);

// Xóa & Sửa
router.delete('/:id', authMiddleware, petController.deletePet); 
router.put('/:id', authMiddleware, petController.updatePet); 

// --- 👇 PHẦN QUAN TRỌNG NHẤT: ROUTE THÊM HỒ SƠ Y TẾ (CÓ ẢNH) ---
// Đã thay thế dòng cũ bằng logic xử lý ảnh trực tiếp tại đây
router.post('/:id/medical', authMiddleware, uploadCloud.single('image'), async (req, res) => {
  try {
    const { date, title, description, doctor, type } = req.body;
    
    // Nếu người dùng có gửi ảnh lên thì lấy link, không thì để rỗng
    const img_url = req.file ? req.file.path : '';

    const newRecord = {
      date,
      title: title || 'Khám bệnh',
      description,
      doctor,
      type: type || 'medical',
      img_url // Lưu link ảnh vào database
    };

    // Tìm Pet theo ID và đẩy (push) hồ sơ mới vào mảng medical_records
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $push: { medical_records: newRecord } },
      { new: true } // Trả về dữ liệu mới nhất sau khi update
    );

    if (!pet) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thú cưng' });
    }

    res.json({ success: true, data: pet });

  } catch (error) {
    console.error("Lỗi thêm medical:", error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lưu hồ sơ' });
  }
});

module.exports = router;
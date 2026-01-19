const express = require('express');
const router = express.Router();

// 👇 Dòng này quan trọng nè: Giới thiệu "người gác cổng" authMiddleware
const authMiddleware = require('../middlewares/auth.middleware');
const petController = require('../controllers/pet.controller');

// Các đường dẫn (API)
router.post('/', authMiddleware, petController.createPet); // Thêm mới
router.get('/', authMiddleware, petController.getPets);    // Xem danh sách
router.delete('/:id', authMiddleware, petController.deletePet); // Xóa (Mới thêm)
router.put('/:id', authMiddleware, petController.updatePet); // Sửa

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Định nghĩa đường dẫn: POST /api/auth/register
router.post('/register', authController.register);

// <--- THÊM DÒNG NÀY
router.post('/login', authController.login);

module.exports = router;
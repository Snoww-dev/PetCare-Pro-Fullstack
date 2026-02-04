const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

// API lấy thông tin: GET /api/users/me
router.get('/me', authMiddleware, userController.getMe);

// API cập nhật: PUT /api/users/me
router.put('/me', authMiddleware, userController.updateMe);

module.exports = router;
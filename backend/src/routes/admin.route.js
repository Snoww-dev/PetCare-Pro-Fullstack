import express from 'express';

import {
    getAllUsers,
    createUser,
    updateUser,
    setUserStatus,
    deleteUser,
} from '../controllers/admin.controller.js';
import { authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create-user', authorizeRole('admin'), createUser);
router.get('/all-users', authorizeRole('admin'), getAllUsers);
router.put('/user/:id', authorizeRole('admin'), updateUser);
router.patch('/user/:id/status', authorizeRole('admin'), setUserStatus);
router.delete('/user/:id', authorizeRole('admin'), deleteUser);

export default router;

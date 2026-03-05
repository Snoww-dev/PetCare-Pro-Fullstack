import { Router } from 'express';
import { authMe, changePassword, getStaffOptions } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', authMe);
router.get('/staff-options', getStaffOptions);
router.post('/change-password', changePassword);

export default router;

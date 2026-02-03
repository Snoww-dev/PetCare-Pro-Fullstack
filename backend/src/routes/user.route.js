import Router from 'express';
import { authMe } from '../controllers/user.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/me', protectedRoute, authMe);

export default router;
import { Router } from "express";
import { changePassword, login, logout, refreshToken } from "../controllers/auth.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post('/refresh', refreshToken);
router.post('/change-password', protectedRoute, changePassword);

export default router;
import { Router } from "express";
import { login, logout, refreshToken } from "../controllers/auth.controller.js";

const router = Router();

// User login
router.post("/signin", login);
// User logout
router.post("/signout", logout);
// Refresh access token
router.post('/refresh', refreshToken);

export default router;
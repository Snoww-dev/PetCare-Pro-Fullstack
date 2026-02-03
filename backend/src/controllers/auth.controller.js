import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = '15m'; // 15 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SALT_ROUNDS = 10;

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const passwordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!passwordCorrect) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
        const refresshToken = crypto.randomBytes(64).toString('hex'); // Example refresh token generation
        await Session.create({
            userId: user._id,
            refreshToken: refresshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        });
        res.cookie('refreshToken', refresshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_TTL
        });
        res.status(200).json({ message: `Sign-in successful. Hello ${user.full_name}`, accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            await Session.deleteOne({ refreshToken: token });
            res.clearCookie('refreshToken')
        }
        return res.sendStatus(204);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({ message: 'Refresh token missing.' });
        }
        const session = await Session.findOne({ refreshToken: token });
        if (!session) {
            return res.status(401).json({ message: 'Invalid or expired refresh token.' });
        }
        if (session.expiresAt < new Date()) {
            return res.status(403).json({ message: 'Refresh token expired.' });
        }
        const accessToken = jwt.sign({ userId: session.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
        return res.status(200).json({ accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'Old password, new password, and confirm password are required.' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match.' });
        }
        const user = await User.findById(req.user._id).select('+password_hash');
        const passwordCorrect = await bcrypt.compare(oldPassword, user.password_hash);
        if (!passwordCorrect) {
            return res.status(400).json({ message: 'Old password is incorrect.' });
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await User.findByIdAndUpdate(user._id, { password_hash: hashedNewPassword });
        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}
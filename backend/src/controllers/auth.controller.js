import User from '../models/users.model.js';
import Session from '../models/session.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        if (user.is_active === false) {
            return res.status(403).json({ message: 'Account is deactivated.' });
        }

        const passwordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!passwordCorrect) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const accessToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_TTL,
        });

        return res.status(200).json({
            message: `Login successful. Welcome ${user.full_name || user.username}`,
            accessToken,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

export const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            await Session.deleteOne({ refreshToken: token });
            res.clearCookie('refreshToken');
        }
        return res.sendStatus(204);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({ message: 'Refresh token does not exist.' });
        }

        const session = await Session.findOne({ refreshToken: token });
        if (!session) {
            return res.status(401).json({ message: 'Invalid or expired refresh token.' });
        }

        if (session.expiresAt < new Date()) {
            await Session.deleteOne({ _id: session._id });
            return res.status(403).json({ message: 'Refresh token has expired.' });
        }

        const user = await User.findById(session.userId).select('_id role is_active');
        if (!user) {
            await Session.deleteOne({ _id: session._id });
            return res.status(401).json({ message: 'User not found.' });
        }

        if (user.is_active === false) {
            await Session.deleteOne({ _id: session._id });
            return res.status(403).json({ message: 'Account is deactivated.' });
        }

        const accessToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        return res.status(200).json({ accessToken });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

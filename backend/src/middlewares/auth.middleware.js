import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectedRoute = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Access token is missing.' });
        }
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired access token.' });
            }
            const user = await User.findById(decoded.userId).select('-password_hash');
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}
import jwt from 'jsonwebtoken';
import User from '../models/users.model.js';

export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Access token is missing.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      return res.status(403).json({ message: 'Invalid or expired access token.' });
    }

    const user = await User.findById(decoded.userId).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized.' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden.' });
      }

      return next();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  };
};

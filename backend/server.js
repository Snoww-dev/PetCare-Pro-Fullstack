import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';

import { connectDB } from './src/configs/database.js';

import authRoutes from './src/routes/auth.route.js';
import userRoutes from './src/routes/user.route.js';
import petRoutes from './src/routes/pet.route.js';
import { protectedRoute } from './src/middlewares/auth.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(
    {
        origin: process.env.CLIENT_URL,
        credentials: true,
    }
));

app.use('/api/auth', authRoutes);
app.use(protectedRoute);
app.use('/api/user', userRoutes);
app.use('/api/pet', petRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
    connectDB();
});
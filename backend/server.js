import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';

import { connectDB } from './src/configs/database.js';
import { registerRoutes } from './src/routes/index.js';
import { errorHandler, notFoundHandler } from './src/middlewares/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

registerRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

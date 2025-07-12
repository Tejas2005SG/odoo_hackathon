import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectionDb } from './lib/db.js';
import authRoutes from './routes/auth.routes.js';
import askRoutes from './routes/ask.routes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Essential middleware - ADD THESE IF MISSING
app.use(cors({
  
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CRITICAL: JSON body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ask-question/',askRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectionDb();
});


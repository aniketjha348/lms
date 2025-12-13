import express from 'express';
import { login, getProfile, changePassword, verifyToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.get('/verify', authenticate, verifyToken);
router.put('/change-password', authenticate, changePassword);

export default router;

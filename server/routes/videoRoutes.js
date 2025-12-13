import express from 'express';
import multer from 'multer';
import {
  getVideosByCourse,
  getVideoById,
  uploadVideo,
  uploadNotes,
  createVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
  removeNotes,
} from '../controllers/videoController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max file size
  },
});

// Public routes
router.get('/course/:courseId', optionalAuth, getVideosByCourse);
router.get('/:id', optionalAuth, getVideoById);

// Protected routes (Admin only)
router.post('/', authenticate, createVideo);
router.post('/upload', authenticate, upload.single('video'), uploadVideo);
router.post('/:id/notes', authenticate, upload.single('notes'), uploadNotes);
router.put('/reorder', authenticate, reorderVideos);
router.put('/:id', authenticate, updateVideo);
router.delete('/:id/notes', authenticate, removeNotes);
router.delete('/:id', authenticate, deleteVideo);

export default router;

import express from 'express';
import multer from 'multer';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
  uploadThumbnail,
} from '../controllers/courseController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Multer config for thumbnail
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  },
});

// Public routes (with optional auth to check if admin)
router.get('/', optionalAuth, getAllCourses);
router.get('/:id', optionalAuth, getCourseById);

// Protected routes (Admin only)
router.post('/', authenticate, createCourse);
router.put('/reorder', authenticate, reorderCourses);
router.put('/:id', authenticate, updateCourse);
router.delete('/:id', authenticate, deleteCourse);

// Thumbnail upload
router.post('/:id/thumbnail', authenticate, upload.single('thumbnail'), uploadThumbnail);

export default router;


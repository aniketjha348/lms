import Course from '../models/Course.js';
import Video from '../models/Video.js';
import { uploadFileToS3, deleteFileFromS3 } from '../services/s3Service.js';

/**
 * @desc    Get all courses (public - published only, admin - all)
 * @route   GET /api/courses
 * @access  Public/Private
 */
export const getAllCourses = async (req, res) => {
  try {
    const isAdmin = !!req.admin;
    
    const query = isAdmin ? {} : { isPublished: true };
    
    const courses = await Course.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error('Get Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses.',
    });
  }
};

/**
 * @desc    Get single course by ID with videos
 * @route   GET /api/courses/:id
 * @access  Public
 */
export const getCourseById = async (req, res) => {
  try {
    const isAdmin = !!req.admin;
    const course = await Course.findById(req.params.id).lean();
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }
    
    // If not admin and course is not published, deny access
    if (!isAdmin && !course.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }
    
    // Get videos for this course
    const videoQuery = isAdmin 
      ? { course: course._id }
      : { course: course._id, isPublished: true };
    
    const videos = await Video.find(videoQuery)
      .sort({ order: 1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        ...course,
        videos,
      },
    });
  } catch (error) {
    console.error('Get Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course.',
    });
  }
};

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private (Admin)
 */
export const createCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnail, isPublished } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Course title is required.',
      });
    }
    
    // Get the highest order number
    const lastCourse = await Course.findOne().sort({ order: -1 });
    const order = lastCourse ? lastCourse.order + 1 : 0;
    
    const course = await Course.create({
      title,
      description,
      category,
      thumbnail,
      isPublished: isPublished || false,
      order,
    });
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: course,
    });
  } catch (error) {
    console.error('Create Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course.',
    });
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private (Admin)
 */
export const updateCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnail, isPublished, order } = req.body;
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }
    
    // Update fields
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (isPublished !== undefined) course.isPublished = isPublished;
    if (order !== undefined) course.order = order;
    
    await course.save();
    
    res.json({
      success: true,
      message: 'Course updated successfully.',
      data: course,
    });
  } catch (error) {
    console.error('Update Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course.',
    });
  }
};

/**
 * @desc    Delete course and its videos
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin)
 */
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }
    
    // Delete all videos in this course
    await Video.deleteMany({ course: course._id });
    
    // Delete the course
    await Course.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Course and all its videos deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course.',
    });
  }
};

/**
 * @desc    Reorder courses
 * @route   PUT /api/courses/reorder
 * @access  Private (Admin)
 */
export const reorderCourses = async (req, res) => {
  try {
    const { courseIds } = req.body;
    
    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of course IDs.',
      });
    }
    
    // Update order for each course
    const updatePromises = courseIds.map((id, index) =>
      Course.findByIdAndUpdate(id, { order: index })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Courses reordered successfully.',
    });
  } catch (error) {
    console.error('Reorder Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder courses.',
    });
  }
};

/**
 * @desc    Upload course thumbnail
 * @route   POST /api/courses/:id/thumbnail
 * @access  Private (Admin)
 */
export const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file.',
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Delete old thumbnail from S3 if exists
    if (course.thumbnail && course.thumbnail.includes('s3.')) {
      try {
        const oldKey = course.thumbnail.split('/').slice(-2).join('/');
        await deleteFileFromS3(oldKey);
      } catch (err) {
        console.log('Could not delete old thumbnail:', err.message);
      }
    }

    // Upload new thumbnail to S3
    const result = await uploadFileToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'thumbnails'
    );

    // Update course with new thumbnail URL
    course.thumbnail = result.url;
    await course.save();

    res.json({
      success: true,
      message: 'Thumbnail uploaded successfully.',
      data: {
        thumbnail: result.url,
        course,
      },
    });
  } catch (error) {
    console.error('Upload Thumbnail Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload thumbnail.',
    });
  }
};

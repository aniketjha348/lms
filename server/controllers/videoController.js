import Video from '../models/Video.js';
import Course from '../models/Course.js';
import { uploadFileToS3, deleteFileFromS3, getEmbedUrl, getPdfViewerUrl } from '../services/s3Service.js';

/**
 * @desc    Get all videos for a course
 * @route   GET /api/videos/course/:courseId
 * @access  Public
 */
export const getVideosByCourse = async (req, res) => {
  try {
    const isAdmin = !!req.admin;
    
    const query = isAdmin 
      ? { course: req.params.courseId }
      : { course: req.params.courseId, isPublished: true };
    
    const videos = await Video.find(query)
      .sort({ order: 1 })
      .lean();
    
    res.json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error('Get Videos Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos.',
    });
  }
};

/**
 * @desc    Get single video by ID
 * @route   GET /api/videos/:id
 * @access  Public
 */
export const getVideoById = async (req, res) => {
  try {
    const isAdmin = !!req.admin;
    
    const video = await Video.findById(req.params.id)
      .populate('course', 'title')
      .lean();
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.',
      });
    }
    
    // If not admin and video is not published, deny access
    if (!isAdmin && !video.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.',
      });
    }
    
    // Get next and previous videos
    const [prevVideo, nextVideo] = await Promise.all([
      Video.findOne({
        course: video.course._id,
        order: { $lt: video.order },
        ...(isAdmin ? {} : { isPublished: true }),
      }).sort({ order: -1 }).select('_id title order').lean(),
      
      Video.findOne({
        course: video.course._id,
        order: { $gt: video.order },
        ...(isAdmin ? {} : { isPublished: true }),
      }).sort({ order: 1 }).select('_id title order').lean(),
    ]);
    
    res.json({
      success: true,
      data: {
        ...video,
        prevVideo,
        nextVideo,
      },
    });
  } catch (error) {
    console.error('Get Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video.',
    });
  }
};

/**
 * @desc    Upload video to Google Drive and create video record
 * @route   POST /api/videos/upload
 * @access  Private (Admin)
 */
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file.',
      });
    }
    
    const { courseId, title, description } = req.body;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required.',
      });
    }
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }
    
    // Upload to S3
    const s3Result = await uploadFileToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    
    // Get the next order number
    const lastVideo = await Video.findOne({ course: courseId }).sort({ order: -1 });
    const order = lastVideo ? lastVideo.order + 1 : 0;
    
    // Create video record
    const video = await Video.create({
      title: title || req.file.originalname,
      description,
      course: courseId,
      order,
      videoFileId: s3Result.fileKey,
      videoUrl: s3Result.url,
    });
    
    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully.',
      data: video,
    });
  } catch (error) {
    console.error('Upload Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video.',
    });
  }
};

/**
 * @desc    Upload PDF notes for a video
 * @route   POST /api/videos/:id/notes
 * @access  Private (Admin)
 */
export const uploadNotes = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file.',
      });
    }
    
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.',
      });
    }
    
    // Delete existing notes if any
    if (video.notesFileId) {
      try {
        await deleteFileFromS3(video.notesFileId);
      } catch (err) {
        console.log('Failed to delete old notes:', err.message);
      }
    }
    
    // Upload to S3
    const s3Result = await uploadFileToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    
    // Update video with notes info
    video.notesFileId = s3Result.fileKey;
    video.notesUrl = s3Result.url;
    video.notesTitle = req.body.notesTitle || req.file.originalname;
    
    await video.save();
    
    res.json({
      success: true,
      message: 'Notes uploaded successfully.',
      data: video,
    });
  } catch (error) {
    console.error('Upload Notes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload notes.',
    });
  }
};

/**
 * @desc    Create video with existing Drive file ID (if already uploaded)
 * @route   POST /api/videos
 * @access  Private (Admin)
 */
export const createVideo = async (req, res) => {
  try {
    const { courseId, title, description, videoFileId, notesFileId, notesTitle } = req.body;
    
    if (!courseId || !title || !videoFileId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, and video file ID are required.',
      });
    }
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }
    
    // Get the next order number
    const lastVideo = await Video.findOne({ course: courseId }).sort({ order: -1 });
    const order = lastVideo ? lastVideo.order + 1 : 0;
    
    // Create video record
    const video = await Video.create({
      title,
      description,
      course: courseId,
      order,
      videoFileId,
      videoUrl: getEmbedUrl(videoFileId),
      notesFileId,
      notesUrl: notesFileId ? getPdfViewerUrl(notesFileId) : undefined,
      notesTitle,
    });
    
    res.status(201).json({
      success: true,
      message: 'Video created successfully.',
      data: video,
    });
  } catch (error) {
    console.error('Create Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video.',
    });
  }
};

/**
 * @desc    Update video details
 * @route   PUT /api/videos/:id
 * @access  Private (Admin)
 */
export const updateVideo = async (req, res) => {
  try {
    const { title, description, order, isPublished, notesTitle } = req.body;
    
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.',
      });
    }
    
    // Update fields
    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (order !== undefined) video.order = order;
    if (isPublished !== undefined) video.isPublished = isPublished;
    if (notesTitle !== undefined) video.notesTitle = notesTitle;
    
    await video.save();
    
    res.json({
      success: true,
      message: 'Video updated successfully.',
      data: video,
    });
  } catch (error) {
    console.error('Update Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video.',
    });
  }
};

/**
 * @desc    Delete video
 * @route   DELETE /api/videos/:id
 * @access  Private (Admin)
 */
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.',
      });
    }
    
    // Delete video from S3
    if (video.videoFileId) {
      try {
        await deleteFileFromS3(video.videoFileId);
      } catch (err) {
        console.log('Failed to delete video from S3:', err.message);
      }
    }
    
    // Delete notes from S3
    if (video.notesFileId) {
      try {
        await deleteFileFromS3(video.notesFileId);
      } catch (err) {
        console.log('Failed to delete notes from S3:', err.message);
      }
    }
    
    // Delete video record
    await Video.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Video deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video.',
    });
  }
};

/**
 * @desc    Reorder videos within a course
 * @route   PUT /api/videos/reorder
 * @access  Private (Admin)
 */
export const reorderVideos = async (req, res) => {
  try {
    const { videoIds } = req.body;
    
    if (!videoIds || !Array.isArray(videoIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of video IDs.',
      });
    }
    
    // Update order for each video
    const updatePromises = videoIds.map((id, index) =>
      Video.findByIdAndUpdate(id, { order: index })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Videos reordered successfully.',
    });
  } catch (error) {
    console.error('Reorder Videos Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder videos.',
    });
  }
};

/**
 * @desc    Remove notes from a video
 * @route   DELETE /api/videos/:id/notes
 * @access  Private (Admin)
 */
export const removeNotes = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.',
      });
    }
    
    // Delete notes from Google Drive
    if (video.notesFileId) {
      try {
        await deleteFileFromDrive(video.notesFileId);
      } catch (err) {
        console.log('Failed to delete notes from Drive:', err.message);
      }
    }
    
    // Clear notes fields
    video.notesFileId = undefined;
    video.notesUrl = undefined;
    video.notesTitle = undefined;
    
    await video.save();
    
    res.json({
      success: true,
      message: 'Notes removed successfully.',
      data: video,
    });
  } catch (error) {
    console.error('Remove Notes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove notes.',
    });
  }
};

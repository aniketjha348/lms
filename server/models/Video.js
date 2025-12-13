import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required'],
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  
  // Google Drive Video
  videoFileId: {
    type: String,
    required: [true, 'Video file ID is required'],
  },
  videoUrl: {
    type: String, // Shareable/embed URL
  },
  videoDuration: {
    type: String,
  },
  
  // PDF Notes (also on Google Drive)
  notesFileId: {
    type: String,
  },
  notesUrl: {
    type: String,
  },
  notesTitle: {
    type: String,
  },
  
  thumbnail: {
    type: String,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
videoSchema.index({ course: 1, order: 1 });
videoSchema.index({ isPublished: 1 });

// After save, update course video count
videoSchema.post('save', async function () {
  const Video = this.constructor;
  const Course = mongoose.model('Course');
  
  const count = await Video.countDocuments({ course: this.course });
  await Course.findByIdAndUpdate(this.course, { totalVideos: count });
});

// After delete, update course video count
videoSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Video = mongoose.model('Video');
    const Course = mongoose.model('Course');
    
    const count = await Video.countDocuments({ course: doc.course });
    await Course.findByIdAndUpdate(doc.course, { totalVideos: count });
  }
});

const Video = mongoose.model('Video', videoSchema);

export default Video;

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiUpload,
  FiX,
  FiFileText,
  FiPlay,
  FiSave,
  FiCheck
} from 'react-icons/fi';
import videoService from '../../services/videoService';
import courseService from '../../services/courseService';
import { useUploadQueue } from '../../context/UploadQueueContext';
import styles from './VideoManagement.module.css';

const VideoManagement = () => {
  const [searchParams] = useSearchParams();
  const selectedCourseId = searchParams.get('course');
  
  // Upload queue hook
  const { addToQueue, registerRefreshCallback, getQueueStats } = useUploadQueue();
  
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(selectedCourseId || '');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // For multi-file selection
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const videoFileRef = useRef(null);
  const notesFileRef = useRef(null);
  
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    videoFile: null,
  });
  
  const [notesForm, setNotesForm] = useState({
    notesFile: null,
    notesTitle: '',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (currentCourse) {
      fetchVideos(currentCourse);
    } else {
      setVideos([]);
    }
  }, [currentCourse]);
  
  // Register callback to refresh video list when upload completes
  const handleUploadComplete = useCallback((newVideo) => {
    if (newVideo && newVideo.course === currentCourse) {
      setVideos(prev => [...prev, newVideo]);
    }
  }, [currentCourse]);
  
  useEffect(() => {
    registerRefreshCallback(handleUploadComplete);
  }, [registerRefreshCallback, handleUploadComplete]);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses();
      if (response.success) {
        setCourses(response.data);
        if (selectedCourseId) {
          setCurrentCourse(selectedCourseId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (courseId) => {
    setLoading(true);
    try {
      const response = await videoService.getVideosByCourse(courseId);
      if (response.success) {
        setVideos(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding files to upload queue
  const handleAddToQueue = (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !currentCourse) return;

    // Get titles from file names (remove extension)
    const titles = selectedFiles.map(file => file.name.replace(/\.[^/.]+$/, ''));
    
    // Add all files to queue
    const count = addToQueue(selectedFiles, currentCourse, titles);
    
    // Close modal and reset
    setShowUploadModal(false);
    setSelectedFiles([]);
    if (videoFileRef.current) videoFileRef.current.value = '';
    
    // Show confirmation
    console.log(`Added ${count} videos to upload queue`);
  };
  
  // Handle file selection (multiple)
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };
  
  // Remove a file from selection
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNotesUpload = async (e) => {
    e.preventDefault();
    if (!notesForm.notesFile || !editingVideo) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('notes', notesForm.notesFile);
      formData.append('notesTitle', notesForm.notesTitle || notesForm.notesFile.name);

      const response = await videoService.uploadNotes(editingVideo._id, formData, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success) {
        setVideos(videos.map(v => 
          v._id === editingVideo._id ? response.data : v
        ));
        setShowNotesModal(false);
        setNotesForm({ notesFile: null, notesTitle: '' });
        setEditingVideo(null);
        if (notesFileRef.current) notesFileRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload notes:', error);
      alert('Failed to upload notes. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await videoService.deleteVideo(videoId);
      if (response.success) {
        setVideos(videos.filter(v => v._id !== videoId));
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video');
    }
  };

  const handleRemoveNotes = async (videoId) => {
    if (!confirm('Are you sure you want to remove notes from this video?')) return;

    try {
      const response = await videoService.removeNotes(videoId);
      if (response.success) {
        setVideos(videos.map(v => 
          v._id === videoId ? response.data : v
        ));
      }
    } catch (error) {
      console.error('Failed to remove notes:', error);
    }
  };

  const openNotesModal = (video) => {
    setEditingVideo(video);
    setNotesForm({ notesFile: null, notesTitle: video.notesTitle || '' });
    setShowNotesModal(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Video Management</h1>
          <p className={styles.subtitle}>Upload and manage course videos</p>
        </div>
      </div>

      {/* Course Selector */}
      <div className={styles.courseSelector}>
        <label>Select Course:</label>
        <select 
          value={currentCourse} 
          onChange={(e) => setCurrentCourse(e.target.value)}
        >
          <option value="">-- Select a course --</option>
          {courses.map(course => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
        
        {currentCourse && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowUploadModal(true)}
          >
            <FiUpload size={18} />
            Upload Video
          </button>
        )}
      </div>

      {!currentCourse ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎬</div>
          <h3>Select a Course</h3>
          <p>Choose a course to manage its videos</p>
        </div>
      ) : loading ? (
        <div className={styles.loader}>
          <div className="spinner"></div>
        </div>
      ) : videos.length > 0 ? (
        <div className={styles.videoList}>
          {videos.map((video, index) => (
            <motion.div
              key={video._id}
              className={styles.videoCard}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={styles.videoOrder}>{video.order + 1}</div>
              
              <div className={styles.videoInfo}>
                <h4 className={styles.videoTitle}>{video.title}</h4>
                {video.description && (
                  <p className={styles.videoDesc}>{video.description}</p>
                )}
                <div className={styles.videoMeta}>
                  {video.notesFileId ? (
                    <span className={styles.hasNotes}>
                      <FiCheck size={12} />
                      Notes attached
                    </span>
                  ) : (
                    <span className={styles.noNotes}>No notes</span>
                  )}
                </div>
              </div>
              
              <div className={styles.videoActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => openNotesModal(video)}
                  title={video.notesFileId ? 'Update Notes' : 'Add Notes'}
                >
                  <FiFileText size={16} />
                </button>
                {video.notesFileId && (
                  <button
                    className={`${styles.actionBtn} ${styles.warning}`}
                    onClick={() => handleRemoveNotes(video._id)}
                    title="Remove Notes"
                  >
                    <FiX size={16} />
                  </button>
                )}
                <button
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={() => handleDeleteVideo(video._id)}
                  title="Delete Video"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎬</div>
          <h3>No Videos Yet</h3>
          <p>Upload your first video to this course</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowUploadModal(true)}
          >
            <FiUpload size={18} />
            Upload Video
          </button>
        </div>
      )}

      {/* Video Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Upload Videos</h2>
                <button onClick={() => setShowUploadModal(false)}>
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddToQueue} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Select Video Files *</label>
                  <div className={styles.fileInput}>
                    <input
                      type="file"
                      ref={videoFileRef}
                      accept="video/*"
                      multiple
                      onChange={handleFileSelect}
                    />
                    <div className={styles.fileInputLabel}>
                      <FiUpload size={24} />
                      <span>
                        {selectedFiles.length > 0 
                          ? `${selectedFiles.length} file(s) selected` 
                          : 'Click to select video files (multiple allowed)'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className={styles.fileList}>
                    <label>Selected Videos ({selectedFiles.length})</label>
                    <div className={styles.fileListItems}>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className={styles.fileListItem}>
                          <span className={styles.fileOrder}>{index + 1}</span>
                          <span className={styles.fileName} title={file.name}>
                            {file.name.replace(/\.[^/.]+$/, '')}
                          </span>
                          <span className={styles.fileSize}>
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                          <button
                            type="button"
                            className={styles.removeFileBtn}
                            onClick={() => removeSelectedFile(index)}
                            title="Remove"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className={styles.fileListHint}>
                      Videos will upload in this order (drag to reorder coming soon)
                    </p>
                  </div>
                )}
                
                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFiles([]);
                      if (videoFileRef.current) videoFileRef.current.value = '';
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={selectedFiles.length === 0}
                  >
                    <FiUpload size={16} />
                    Add {selectedFiles.length > 0 ? `${selectedFiles.length} Video${selectedFiles.length > 1 ? 's' : ''}` : ''} to Queue
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Upload Modal */}
      <AnimatePresence>
        {showNotesModal && editingVideo && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !uploading && setShowNotesModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>
                  {editingVideo.notesFileId ? 'Update Notes' : 'Add Notes'}
                </h2>
                {!uploading && (
                  <button onClick={() => setShowNotesModal(false)}>
                    <FiX size={20} />
                  </button>
                )}
              </div>
              
              <div className={styles.modalInfo}>
                <strong>Video:</strong> {editingVideo.title}
              </div>
              
              <form onSubmit={handleNotesUpload} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>PDF Notes File *</label>
                  <div className={styles.fileInput}>
                    <input
                      type="file"
                      ref={notesFileRef}
                      accept=".pdf"
                      onChange={(e) => setNotesForm({ 
                        ...notesForm, 
                        notesFile: e.target.files[0] 
                      })}
                      required
                    />
                    <div className={styles.fileInputLabel}>
                      <FiFileText size={24} />
                      <span>
                        {notesForm.notesFile 
                          ? notesForm.notesFile.name 
                          : 'Click to select PDF file'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Notes Title</label>
                  <input
                    type="text"
                    value={notesForm.notesTitle}
                    onChange={(e) => setNotesForm({ ...notesForm, notesTitle: e.target.value })}
                    placeholder="Enter notes title (or use filename)"
                  />
                </div>
                
                {uploading && (
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${uploadProgress}%` }}
                    />
                    <span>{uploadProgress}%</span>
                  </div>
                )}
                
                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowNotesModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={uploading || !notesForm.notesFile}
                  >
                    {uploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <FiUpload size={16} />
                        Upload Notes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoManagement;

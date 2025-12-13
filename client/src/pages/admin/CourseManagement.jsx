import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiEyeOff,
  FiX,
  FiVideo,
  FiSave,
  FiUpload,
  FiImage
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import styles from './CourseManagement.module.css';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    thumbnail: '',
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses();
      if (response.success) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      thumbnail: '',
      isPublished: false,
    });
    setThumbnailFile(null);
    setThumbnailPreview('');
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      category: course.category || '',
      thumbnail: course.thumbnail || '',
      isPublished: course.isPublished,
    });
    setThumbnailFile(null);
    setThumbnailPreview(course.thumbnail || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      let courseId;
      let updatedCourse;
      
      if (editingCourse) {
        const response = await courseService.updateCourse(editingCourse._id, formData);
        if (response.success) {
          courseId = editingCourse._id;
          updatedCourse = response.data;
        }
      } else {
        const response = await courseService.createCourse(formData);
        if (response.success) {
          courseId = response.data._id;
          updatedCourse = response.data;
        }
      }

      // Upload thumbnail if file selected
      if (thumbnailFile && courseId) {
        setUploadingThumbnail(true);
        try {
          const thumbResponse = await courseService.uploadThumbnail(courseId, thumbnailFile);
          if (thumbResponse.success) {
            updatedCourse = thumbResponse.data.course;
          }
        } catch (thumbError) {
          console.error('Thumbnail upload failed:', thumbError);
        }
        setUploadingThumbnail(false);
      }

      // Update courses list
      if (updatedCourse) {
        if (editingCourse) {
          setCourses(courses.map(c => c._id === courseId ? updatedCourse : c));
        } else {
          setCourses([...courses, updatedCourse]);
        }
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save course:', error);
      alert('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course? All videos will also be deleted.')) {
      return;
    }

    try {
      const response = await courseService.deleteCourse(courseId);
      if (response.success) {
        setCourses(courses.filter(c => c._id !== courseId));
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course');
    }
  };

  const togglePublish = async (course) => {
    try {
      const response = await courseService.updateCourse(course._id, {
        isPublished: !course.isPublished,
      });
      if (response.success) {
        setCourses(courses.map(c => 
          c._id === course._id ? response.data : c
        ));
      }
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Course Management</h1>
          <p className={styles.subtitle}>Create and manage your courses</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FiPlus size={18} />
          New Course
        </button>
      </div>

      {loading ? (
        <div className={styles.loader}>
          <div className="spinner"></div>
        </div>
      ) : courses.length > 0 ? (
        <div className={styles.courseGrid}>
          {courses.map((course, index) => (
            <motion.div
              key={course._id}
              className={styles.courseCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardThumbnail}>
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className={styles.placeholderThumb}>📚</div>
                  )}
                </div>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  {course.category && (
                    <span className={styles.category}>{course.category}</span>
                  )}
                  <span className={`${styles.status} ${course.isPublished ? styles.published : styles.draft}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                
                <h3 className={styles.cardTitle}>{course.title}</h3>
                
                {course.description && (
                  <p className={styles.cardDescription}>{course.description}</p>
                )}
                
                <div className={styles.cardStats}>
                  <span>
                    <FiVideo size={14} />
                    {course.totalVideos || 0} videos
                  </span>
                </div>
              </div>
              
              <div className={styles.cardActions}>
                <Link 
                  to={`/admin/videos?course=${course._id}`} 
                  className={styles.actionBtn}
                  title="Manage Videos"
                >
                  <FiVideo size={16} />
                </Link>
                <button
                  className={styles.actionBtn}
                  onClick={() => togglePublish(course)}
                  title={course.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {course.isPublished ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => openEditModal(course)}
                  title="Edit"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={() => handleDelete(course._id)}
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📚</div>
          <h3>No Courses Yet</h3>
          <p>Create your first course to get started</p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <FiPlus size={18} />
            Create Course
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                <button onClick={() => setShowModal(false)}>
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Course Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter course title"
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter course description"
                    rows={3}
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Programming"
                    />
                  </div>
                </div>
                
                {/* Thumbnail Upload */}
                <div className={styles.formGroup}>
                  <label>Course Thumbnail</label>
                  <div 
                    className={styles.thumbnailUpload}
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    {thumbnailPreview ? (
                      <div className={styles.thumbnailPreviewContainer}>
                        <img src={thumbnailPreview} alt="Preview" className={styles.thumbnailPreviewImg} />
                        <div className={styles.thumbnailOverlay}>
                          <FiUpload size={20} />
                          <span>Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>
                        <FiImage size={32} />
                        <span>Click to upload thumbnail</span>
                        <span className={styles.thumbnailHint}>PNG, JPG up to 5MB</span>
                      </div>
                    )}
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {uploadingThumbnail && (
                    <div className={styles.uploadProgress}>
                      <div className={styles.spinner}></div>
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    <span>Publish course immediately</span>
                  </label>
                </div>
                
                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <div className={styles.spinner}></div>
                    ) : (
                      <>
                        <FiSave size={16} />
                        {editingCourse ? 'Update' : 'Create'}
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

export default CourseManagement;

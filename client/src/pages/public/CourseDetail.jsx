import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiPlay, FiFileText } from 'react-icons/fi';
import VideoCard from '../../components/video/VideoCard';
import courseService from '../../services/courseService';
import styles from './CourseDetail.module.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await courseService.getCourseById(courseId);
      if (response.success) {
        setCourse(response.data);
      } else {
        setError('Course not found');
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={styles.error}>
        <h2>Course Not Found</h2>
        <p>{error || 'The course you are looking for does not exist.'}</p>
        <Link to="/courses" className="btn btn-primary">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <Link to="/courses" className={styles.backLink}>
          <FiArrowLeft size={18} />
          Back to Courses
        </Link>

        {/* Course Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerContent}>
            {course.category && (
              <span className={styles.category}>{course.category}</span>
            )}
            <h1 className={styles.title}>{course.title}</h1>
            {course.description && (
              <p className={styles.description}>{course.description}</p>
            )}
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <FiPlay size={16} />
                {course.videos?.length || 0} Videos
              </span>
              <span className={styles.metaItem}>
                <FiFileText size={16} />
                Notes Included
              </span>
            </div>

            {course.videos?.length > 0 && (
              <Link
                to={`/courses/${courseId}/video/${course.videos[0]._id}`}
                className="btn btn-primary"
              >
                <FiPlay size={18} />
                Start Learning
              </Link>
            )}
          </div>

          {course.thumbnail && (
            <div className={styles.thumbnail}>
              <img src={course.thumbnail} alt={course.title} />
            </div>
          )}
        </motion.div>

        {/* Videos List */}
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>
            Course Content ({course.videos?.length || 0} videos)
          </h2>

          {course.videos?.length > 0 ? (
            <div className={styles.videoList}>
              {course.videos.map((video, index) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  courseId={courseId}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <FiPlay size={32} />
              <p>No videos available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

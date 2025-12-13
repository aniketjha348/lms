import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlay, FiClock } from 'react-icons/fi';
import styles from './CourseCard.module.css';

const CourseCard = ({ course, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/courses/${course._id}`} className={styles.card}>
        <div className={styles.thumbnail}>
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} />
          ) : (
            <div className={styles.placeholderThumb}>
              <FiPlay size={40} />
            </div>
          )}
          <div className={styles.overlay}>
            <div className={styles.playBtn}>
              <FiPlay size={24} />
            </div>
          </div>
        </div>
        
        <div className={styles.content}>
          {course.category && (
            <span className={styles.category}>{course.category}</span>
          )}
          <h3 className={styles.title}>{course.title}</h3>
          {course.description && (
            <p className={styles.description}>{course.description}</p>
          )}
          <div className={styles.meta}>
            <span className={styles.videoCount}>
              <FiPlay size={14} />
              {course.totalVideos || 0} Videos
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CourseCard;

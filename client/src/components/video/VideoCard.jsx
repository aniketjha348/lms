import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlay, FiFileText, FiCheck } from 'react-icons/fi';
import styles from './VideoCard.module.css';

const VideoCard = ({ video, courseId, isActive = false, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        to={`/courses/${courseId}/video/${video._id}`} 
        className={`${styles.card} ${isActive ? styles.active : ''}`}
      >
        <div className={styles.orderNumber}>
          {isActive ? <FiPlay size={14} /> : video.order + 1}
        </div>
        
        <div className={styles.content}>
          <h4 className={styles.title}>{video.title}</h4>
          {video.description && (
            <p className={styles.description}>{video.description}</p>
          )}
          <div className={styles.meta}>
            {video.notesFileId && (
              <span className={styles.hasNotes}>
                <FiFileText size={12} />
                Notes
              </span>
            )}
            {video.videoDuration && (
              <span className={styles.duration}>{video.videoDuration}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VideoCard;

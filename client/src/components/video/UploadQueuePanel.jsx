import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, 
  FiCheck, 
  FiX, 
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
  FiLoader
} from 'react-icons/fi';
import { useUploadQueue } from '../../context/UploadQueueContext';
import styles from './UploadQueuePanel.module.css';

const UploadQueuePanel = () => {
  const { 
    queue, 
    isMinimized, 
    setIsMinimized, 
    removeFromQueue, 
    clearCompleted,
    getQueueStats 
  } = useUploadQueue();

  const stats = getQueueStats();

  // Don't show panel if queue is empty
  if (queue.length === 0) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiUpload className={styles.pendingIcon} />;
      case 'uploading':
        return <FiLoader className={styles.uploadingIcon} />;
      case 'processing':
        return <FiLoader className={styles.processingIcon} />;
      case 'completed':
        return <FiCheck className={styles.completedIcon} />;
      case 'error':
        return <FiAlertCircle className={styles.errorIcon} />;
      default:
        return null;
    }
  };

  const getStatusText = (item) => {
    switch (item.status) {
      case 'pending':
        return 'Waiting...';
      case 'uploading':
        return `Uploading ${item.progress}%`;
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Done';
      case 'error':
        return item.error || 'Failed';
      default:
        return '';
    }
  };

  const getProgressWidth = (item) => {
    if (item.status === 'completed') return 100;
    if (item.status === 'processing') return 100;
    if (item.status === 'uploading') return item.progress;
    return 0;
  };

  return (
    <motion.div 
      className={styles.panel}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
    >
      {/* Header */}
      <div 
        className={styles.header}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className={styles.headerLeft}>
          <FiUpload size={18} />
          <span className={styles.headerTitle}>
            Upload Queue
            {stats.active > 0 && (
              <span className={styles.activeCount}>
                {stats.active} active
              </span>
            )}
          </span>
        </div>
        <div className={styles.headerRight}>
          {stats.completed > 0 && (
            <button 
              className={styles.clearBtn}
              onClick={(e) => {
                e.stopPropagation();
                clearCompleted();
              }}
              title="Clear completed"
            >
              <FiTrash2 size={14} />
            </button>
          )}
          {isMinimized ? (
            <FiChevronUp size={18} />
          ) : (
            <FiChevronDown size={18} />
          )}
        </div>
      </div>

      {/* Queue List */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className={styles.queueList}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {queue.map((item) => (
              <motion.div
                key={item.id}
                className={`${styles.queueItem} ${styles[item.status]}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className={styles.itemIcon}>
                  {getStatusIcon(item.status)}
                </div>
                
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle} title={item.title}>
                    {item.title}
                  </div>
                  <div className={styles.itemStatus}>
                    {getStatusText(item)}
                  </div>
                  
                  {/* Progress Bar */}
                  {(item.status === 'uploading' || item.status === 'processing') && (
                    <div className={styles.progressBar}>
                      <div 
                        className={`${styles.progressFill} ${item.status === 'processing' ? styles.processing : ''}`}
                        style={{ width: `${getProgressWidth(item)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove button for completed/error */}
                {(item.status === 'completed' || item.status === 'error') && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromQueue(item.id)}
                    title="Remove"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Progress Indicator when minimized */}
      {isMinimized && stats.active > 0 && (
        <div className={styles.miniProgress}>
          <div className={styles.miniProgressBar}>
            <div 
              className={styles.miniProgressFill}
              style={{ 
                width: `${queue.find(i => i.status === 'uploading')?.progress || 0}%` 
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UploadQueuePanel;

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiChevronLeft, 
  FiChevronRight, 
  FiFileText,
  FiList,
  FiX
} from 'react-icons/fi';
import VideoPlayer from '../../components/video/VideoPlayer';
import PDFViewer from '../../components/pdf/PDFViewer';
import videoService from '../../services/videoService';
import courseService from '../../services/courseService';
import styles from './WatchVideo.module.css';

const WatchVideo = () => {
  const { courseId, videoId } = useParams();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotes, setShowNotes] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);

  useEffect(() => {
    fetchData();
  }, [videoId, courseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [videoRes, courseRes] = await Promise.all([
        videoService.getVideoById(videoId),
        courseService.getCourseById(courseId),
      ]);

      if (videoRes.success) {
        setVideo(videoRes.data);
      } else {
        setError('Video not found');
      }

      if (courseRes.success) {
        setCourse(courseRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevVideo = () => {
    if (video?.prevVideo) {
      navigate(`/courses/${courseId}/video/${video.prevVideo._id}`);
    }
  };

  const handleNextVideo = () => {
    if (video?.nextVideo) {
      navigate(`/courses/${courseId}/video/${video.nextVideo._id}`);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className={styles.error}>
        <h2>Video Not Found</h2>
        <p>{error || 'The video you are looking for does not exist.'}</p>
        <Link to={`/courses/${courseId}`} className="btn btn-primary">
          Back to Course
        </Link>
      </div>
    );
  }

  const hasNotes = video.notesFileId && video.notesUrl;

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Link to={`/courses/${courseId}`} className={styles.backLink}>
          <FiArrowLeft size={18} />
          <span>{course?.title || 'Back to Course'}</span>
        </Link>
        
        <div className={styles.topActions}>
          {hasNotes && (
            <button
              className={`${styles.toggleBtn} ${showNotes ? styles.active : ''}`}
              onClick={() => setShowNotes(!showNotes)}
            >
              <FiFileText size={18} />
              <span>Notes</span>
            </button>
          )}
          <button
            className={`${styles.toggleBtn} ${showPlaylist ? styles.active : ''}`}
            onClick={() => setShowPlaylist(!showPlaylist)}
          >
            <FiList size={18} />
            <span>Playlist</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${styles.content} ${hasNotes && showNotes ? styles.withNotes : ''}`}>
        {/* Video Section */}
        <div className={styles.videoSection}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={videoId}
          >
            <VideoPlayer 
              videoUrl={video.videoUrl} 
              title={video.title} 
            />
          </motion.div>

          {/* Video Info */}
          <div className={styles.videoInfo}>
            <div className={styles.videoHeader}>
              <span className={styles.videoNumber}>
                Video {video.order + 1}
              </span>
              <h1 className={styles.videoTitle}>{video.title}</h1>
            </div>
            
            {video.description && (
              <p className={styles.videoDescription}>{video.description}</p>
            )}

            {/* Navigation */}
            <div className={styles.navigation}>
              <button
                className={styles.navBtn}
                onClick={handlePrevVideo}
                disabled={!video.prevVideo}
              >
                <FiChevronLeft size={20} />
                <div className={styles.navBtnText}>
                  <span>Previous</span>
                  {video.prevVideo && (
                    <span className={styles.navBtnTitle}>
                      {video.prevVideo.title}
                    </span>
                  )}
                </div>
              </button>

              <button
                className={styles.navBtn}
                onClick={handleNextVideo}
                disabled={!video.nextVideo}
              >
                <div className={styles.navBtnText}>
                  <span>Next</span>
                  {video.nextVideo && (
                    <span className={styles.navBtnTitle}>
                      {video.nextVideo.title}
                    </span>
                  )}
                </div>
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Notes Panel */}
        {hasNotes && showNotes && (
          <motion.div
            className={styles.notesPanel}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <PDFViewer
              pdfUrl={video.notesUrl}
              title={video.notesTitle || 'Notes'}
              onClose={() => setShowNotes(false)}
            />
          </motion.div>
        )}
      </div>

      {/* Playlist Sidebar */}
      {showPlaylist && (
        <motion.div
          className={styles.playlistOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowPlaylist(false)}
        >
          <motion.div
            className={styles.playlistPanel}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.playlistHeader}>
              <h3>Course Content</h3>
              <button onClick={() => setShowPlaylist(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.playlistContent}>
              {course?.videos?.map((v, index) => (
                <Link
                  key={v._id}
                  to={`/courses/${courseId}/video/${v._id}`}
                  className={`${styles.playlistItem} ${
                    v._id === videoId ? styles.active : ''
                  }`}
                  onClick={() => setShowPlaylist(false)}
                >
                  <span className={styles.playlistNumber}>{index + 1}</span>
                  <div className={styles.playlistItemContent}>
                    <span className={styles.playlistTitle}>{v.title}</span>
                    {v.notesFileId && (
                      <span className={styles.playlistNotes}>
                        <FiFileText size={12} /> Notes
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default WatchVideo;

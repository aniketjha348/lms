import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiPlay, FiBook } from 'react-icons/fi';
import CourseCard from '../../components/course/CourseCard';
import courseService from '../../services/courseService';
import styles from './Home.module.css';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses();
      if (response.success) {
        setCourses(response.data.slice(0, 6)); // Show only first 6 on home
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.heroTag}>🎓 Start Learning Today</span>
            <h1 className={styles.heroTitle}>
              Master New Skills with
              <span className="text-gradient"> Expert-Led Courses</span>
            </h1>
            <p className={styles.heroText}>
              Access high-quality video courses with comprehensive notes. 
              Learn at your own pace with our structured curriculum.
            </p>
            <div className={styles.heroActions}>
              <Link to="/courses" className="btn btn-primary">
                <FiPlay size={18} />
                Browse Courses
              </Link>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroStats}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.stat}>
              <span className={styles.statNumber}>{courses.length}+</span>
              <span className={styles.statLabel}>Courses</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>100+</span>
              <span className={styles.statLabel}>Videos</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>PDF</span>
              <span className={styles.statLabel}>Notes Included</span>
            </div>
          </motion.div>
        </div>

        <div className={styles.heroVisual}>
          <motion.div
            className={styles.heroCard}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className={styles.heroCardIcon}>🎬</div>
            <span>Video Lessons</span>
          </motion.div>
          <motion.div
            className={`${styles.heroCard} ${styles.heroCardSecondary}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className={styles.heroCardIcon}>📄</div>
            <span>PDF Notes</span>
          </motion.div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Featured Courses</h2>
            <p className={styles.sectionText}>
              Start your learning journey with our popular courses
            </p>
          </div>
          <Link to="/courses" className={styles.viewAllLink}>
            View All
            <FiArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className={styles.loader}>
            <div className="spinner"></div>
          </div>
        ) : courses.length > 0 ? (
          <div className={styles.coursesGrid}>
            {courses.map((course, index) => (
              <CourseCard key={course._id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <FiBook size={48} />
            <h3>No Courses Yet</h3>
            <p>Check back soon for new courses!</p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why Learn With Us?</h2>
        <div className={styles.featuresGrid}>
          <motion.div 
            className={styles.featureCard}
            whileHover={{ y: -5 }}
          >
            <div className={styles.featureIcon}>🎬</div>
            <h3>Video Lessons</h3>
            <p>High-quality video content hosted on AWS S3 for smooth streaming</p>
          </motion.div>
          <motion.div 
            className={styles.featureCard}
            whileHover={{ y: -5 }}
          >
            <div className={styles.featureIcon}>📄</div>
            <h3>PDF Notes</h3>
            <p>Comprehensive notes alongside each video for better understanding</p>
          </motion.div>
          <motion.div 
            className={styles.featureCard}
            whileHover={{ y: -5 }}
          >
            <div className={styles.featureIcon}>📱</div>
            <h3>Learn Anywhere</h3>
            <p>Access courses from any device - desktop, tablet, or mobile</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

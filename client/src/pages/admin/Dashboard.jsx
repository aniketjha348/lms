import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiVideo, FiEye, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalVideos: 0,
    publishedCourses: 0,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await courseService.getAllCourses();
      if (response.success) {
        const courses = response.data;
        const totalVideos = courses.reduce((acc, c) => acc + (c.totalVideos || 0), 0);
        const publishedCourses = courses.filter(c => c.isPublished).length;
        
        setStats({
          totalCourses: courses.length,
          totalVideos,
          publishedCourses,
        });
        
        setRecentCourses(courses.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Courses', value: stats.totalCourses, icon: FiBook, color: '#6366f1' },
    { label: 'Total Videos', value: stats.totalVideos, icon: FiVideo, color: '#8b5cf6' },
    { label: 'Published', value: stats.publishedCourses, icon: FiEye, color: '#22c55e' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back! Here's an overview of your LMS.</p>
        </div>
        <Link to="/admin/courses" className="btn btn-primary">
          <FiPlus size={18} />
          New Course
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className={styles.statIcon}
                style={{ background: `${stat.color}20`, color: stat.color }}
              >
                <Icon size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>
                  {loading ? '-' : stat.value}
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link to="/admin/courses" className={styles.actionCard}>
            <FiBook size={24} />
            <span>Manage Courses</span>
          </Link>
          <Link to="/admin/videos" className={styles.actionCard}>
            <FiVideo size={24} />
            <span>Manage Videos</span>
          </Link>
          <Link to="/" target="_blank" className={styles.actionCard}>
            <FiEye size={24} />
            <span>View Site</span>
          </Link>
        </div>
      </div>

      {/* Recent Courses */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Courses</h2>
        {loading ? (
          <div className={styles.loader}>
            <div className="spinner"></div>
          </div>
        ) : recentCourses.length > 0 ? (
          <div className={styles.courseList}>
            {recentCourses.map((course) => (
              <div key={course._id} className={styles.courseItem}>
                <div className={styles.courseInfo}>
                  <h4>{course.title}</h4>
                  <span className={styles.courseMeta}>
                    {course.totalVideos || 0} videos
                  </span>
                </div>
                <span className={`${styles.badge} ${course.isPublished ? styles.published : styles.draft}`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No courses yet. Create your first course!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

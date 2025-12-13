import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiBook } from 'react-icons/fi';
import CourseCard from '../../components/course/CourseCard';
import courseService from '../../services/courseService';
import styles from './Courses.module.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchTerm, selectedCategory, courses]);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses();
      if (response.success) {
        setCourses(response.data);
        setFilteredCourses(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (course) => course.category === selectedCategory
      );
    }

    setFilteredCourses(filtered);
  };

  // Get unique categories
  const categories = ['all', ...new Set(courses.map((c) => c.category).filter(Boolean))];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className={styles.title}>All Courses</h1>
          <p className={styles.subtitle}>
            Explore our collection of video courses with detailed notes
          </p>
        </motion.div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <FiSearch size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {categories.length > 1 && (
            <div className={styles.categories}>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`${styles.categoryBtn} ${
                    selectedCategory === category ? styles.active : ''
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className={styles.loader}>
            <div className="spinner"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className={styles.grid}>
            {filteredCourses.map((course, index) => (
              <CourseCard key={course._id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <FiBook size={48} />
            <h3>No Courses Found</h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Check back soon for new courses!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;

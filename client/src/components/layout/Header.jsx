import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBook, FiHome } from 'react-icons/fi';
import styles from './Header.module.css';

const Header = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home', icon: FiHome },
    { path: '/courses', label: 'Courses', icon: FiBook },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <motion.div 
            className={styles.logoIcon}
            whileHover={{ rotate: 10 }}
          >
            📚
          </motion.div>
          <span className={styles.logoText}>
            LMS<span className={styles.logoDot}>.</span>
          </span>
        </Link>

        <nav className={styles.nav}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
                {isActive && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="activeIndicator"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;

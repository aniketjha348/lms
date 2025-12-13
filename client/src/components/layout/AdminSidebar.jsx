import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiBook, 
  FiVideo, 
  FiSettings, 
  FiLogOut,
  FiChevronLeft 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminSidebar.module.css';

const AdminSidebar = ({ collapsed, onToggle }) => {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: FiHome, end: true },
    { path: '/admin/courses', label: 'Courses', icon: FiBook },
    { path: '/admin/videos', label: 'Videos', icon: FiVideo },
    { path: '/admin/settings', label: 'Settings', icon: FiSettings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📚</span>
          {!collapsed && <span className={styles.logoText}>LMS Admin</span>}
        </div>
        <button className={styles.toggleBtn} onClick={onToggle}>
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronLeft size={20} />
          </motion.div>
        </button>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => 
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={20} className={styles.navIcon} />
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {!collapsed && admin && (
          <div className={styles.adminInfo}>
            <div className={styles.avatar}>
              {admin.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>{admin.username}</span>
              <span className={styles.adminRole}>Administrator</span>
            </div>
          </div>
        )}
        
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <FiLogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

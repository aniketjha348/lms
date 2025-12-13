import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiSave, FiAlertCircle, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import styles from './Settings.module.css';

const Settings = () => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account settings</p>
      </div>

      <motion.div
        className={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.sectionHeader}>
          <FiLock size={20} />
          <h2>Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className={styles.form}>
          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.type === 'error' ? (
                <FiAlertCircle size={18} />
              ) : (
                <FiCheck size={18} />
              )}
              {message.text}
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ 
                ...passwordForm, 
                currentPassword: e.target.value 
              })}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ 
                ...passwordForm, 
                newPassword: e.target.value 
              })}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ 
                ...passwordForm, 
                confirmPassword: e.target.value 
              })}
              placeholder="Confirm new password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (
              <>
                <FiSave size={16} />
                Update Password
              </>
            )}
          </button>
        </form>
      </motion.div>

      <motion.div
        className={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className={styles.sectionHeader}>
          <span>ℹ️</span>
          <h2>About</h2>
        </div>
        
        <div className={styles.aboutContent}>
          <p><strong>LMS - Learning Management System</strong></p>
          <p>Version 1.0.0</p>
          <p className={styles.muted}>
            Built with React, Node.js, MongoDB, and AWS S3
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;

import { Outlet } from 'react-router-dom';
import Header from './Header';
import styles from './PublicLayout.module.css';

const PublicLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2024 LMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

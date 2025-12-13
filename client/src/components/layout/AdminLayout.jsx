import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { UploadQueueProvider } from '../../context/UploadQueueContext';
import UploadQueuePanel from '../video/UploadQueuePanel';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <UploadQueueProvider>
      <div className={styles.layout}>
        <AdminSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        <main 
          className={styles.main}
          style={{ 
            marginLeft: sidebarCollapsed ? '70px' : 'var(--sidebar-width)' 
          }}
        >
          <div className={styles.content}>
            <Outlet />
          </div>
        </main>
        
        {/* Global Upload Queue Panel */}
        <UploadQueuePanel />
      </div>
    </UploadQueueProvider>
  );
};

export default AdminLayout;


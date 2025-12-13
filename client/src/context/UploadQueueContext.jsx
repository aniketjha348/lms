import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import videoService from '../services/videoService';

const UploadQueueContext = createContext(null);

export const useUploadQueue = () => {
  const context = useContext(UploadQueueContext);
  if (!context) {
    throw new Error('useUploadQueue must be used within UploadQueueProvider');
  }
  return context;
};

// Generate unique ID
const generateId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const UploadQueueProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const processingRef = useRef(false);
  const refreshCallbackRef = useRef(null);

  // Register a callback to be called when an upload completes
  const registerRefreshCallback = useCallback((callback) => {
    refreshCallbackRef.current = callback;
  }, []);

  // Add files to upload queue
  const addToQueue = useCallback((files, courseId, defaultTitles = []) => {
    const newItems = files.map((file, index) => ({
      id: generateId(),
      file,
      courseId,
      title: defaultTitles[index] || file.name.replace(/\.[^/.]+$/, ''),
      description: '',
      status: 'pending', // pending, uploading, processing, completed, error
      progress: 0,
      error: null,
      createdAt: new Date(),
    }));

    setQueue(prev => [...prev, ...newItems]);
    return newItems.length;
  });

  // Remove item from queue
  const removeFromQueue = useCallback((id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear all completed/error items
  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(item => 
      item.status !== 'completed' && item.status !== 'error'
    ));
  }, []);

  // Update item in queue
  const updateQueueItem = useCallback((id, updates) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Process next item in queue
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;

    const pendingItem = queue.find(item => item.status === 'pending');
    if (!pendingItem) {
      setIsProcessing(false);
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    // Update status to uploading
    updateQueueItem(pendingItem.id, { status: 'uploading', progress: 0 });

    try {
      const formData = new FormData();
      formData.append('video', pendingItem.file);
      formData.append('courseId', pendingItem.courseId);
      formData.append('title', pendingItem.title);
      formData.append('description', pendingItem.description);

      const response = await videoService.uploadVideo(formData, (progress) => {
        if (progress < 100) {
          updateQueueItem(pendingItem.id, { progress });
        } else {
          // When progress hits 100, file is on server, now processing on Drive
          updateQueueItem(pendingItem.id, { 
            status: 'processing', 
            progress: 100 
          });
        }
      });

      if (response.success) {
        updateQueueItem(pendingItem.id, { 
          status: 'completed', 
          progress: 100 
        });
        
        // Call refresh callback to update video list
        if (refreshCallbackRef.current) {
          refreshCallbackRef.current(response.data);
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      updateQueueItem(pendingItem.id, { 
        status: 'error', 
        error: error.response?.data?.message || error.message || 'Upload failed'
      });
    } finally {
      processingRef.current = false;
    }
  }, [queue, updateQueueItem]);

  // Process queue when items are added
  useEffect(() => {
    const hasPending = queue.some(item => item.status === 'pending');
    if (hasPending && !processingRef.current) {
      processQueue();
    }
  }, [queue, processQueue]);

  // Get queue stats
  const getQueueStats = useCallback(() => {
    const pending = queue.filter(item => item.status === 'pending').length;
    const uploading = queue.filter(item => item.status === 'uploading').length;
    const processing = queue.filter(item => item.status === 'processing').length;
    const completed = queue.filter(item => item.status === 'completed').length;
    const errors = queue.filter(item => item.status === 'error').length;
    const active = uploading + processing;
    
    return { pending, uploading, processing, completed, errors, active, total: queue.length };
  }, [queue]);

  const value = {
    queue,
    isProcessing,
    isMinimized,
    setIsMinimized,
    addToQueue,
    removeFromQueue,
    clearCompleted,
    updateQueueItem,
    getQueueStats,
    registerRefreshCallback,
  };

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
    </UploadQueueContext.Provider>
  );
};

export default UploadQueueContext;

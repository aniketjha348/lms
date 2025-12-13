import api from './api';

export const videoService = {
  // Get videos for a course
  getVideosByCourse: async (courseId) => {
    const response = await api.get(`/videos/course/${courseId}`);
    return response.data;
  },

  // Get single video with navigation
  getVideoById: async (id) => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  // Upload video (admin)
  uploadVideo: async (formData, onProgress) => {
    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Upload notes for a video (admin)
  uploadNotes: async (videoId, formData, onProgress) => {
    const response = await api.post(`/videos/${videoId}/notes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Create video with existing file ID (admin)
  createVideo: async (videoData) => {
    const response = await api.post('/videos', videoData);
    return response.data;
  },

  // Update video (admin)
  updateVideo: async (id, videoData) => {
    const response = await api.put(`/videos/${id}`, videoData);
    return response.data;
  },

  // Delete video (admin)
  deleteVideo: async (id) => {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  },

  // Remove notes from video (admin)
  removeNotes: async (id) => {
    const response = await api.delete(`/videos/${id}/notes`);
    return response.data;
  },

  // Reorder videos (admin)
  reorderVideos: async (videoIds) => {
    const response = await api.put('/videos/reorder', { videoIds });
    return response.data;
  },
};

export default videoService;

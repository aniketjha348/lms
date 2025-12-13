import api from './api';

export const courseService = {
  // Get all courses (public)
  getAllCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
  },

  // Get single course with videos
  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  // Create course (admin)
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  // Update course (admin)
  updateCourse: async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },

  // Delete course (admin)
  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  // Reorder courses (admin)
  reorderCourses: async (courseIds) => {
    const response = await api.put('/courses/reorder', { courseIds });
    return response.data;
  },

  // Upload thumbnail (admin)
  uploadThumbnail: async (courseId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    
    const response = await api.post(`/courses/${courseId}/thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },
};

export default courseService;


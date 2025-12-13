import 'dotenv/config';

import app from './app.js';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';

const PORT = process.env.PORT || 5000;

// Seed default admin if not exists
const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne();
    
    if (!adminExists) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      
      await Admin.create({
        username,
        password,
        email: 'admin@lms.com',
      });
      
      console.log(`✅ Default admin created: ${username}`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Seed default admin
    await seedAdmin();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

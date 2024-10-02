const { app } = require('./app');
const connectDB = require('./db/Database');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Connect to the database
connectDB();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dt6skdss9" , 
  api_key: process.env.CLOUD_API_KEY || "657694224342241", 
  api_secret: process.env.CLOUD_SECRET || "ZXobMFGvsFgRUAFexe-E4tSWHXc",
});

// Test Cloudinary configuration
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('Cloudinary configuration error:', error);
  } else {
    console.log('Cloudinary configuration successful:', result);
  }
});

// Create and start the server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});


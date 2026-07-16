
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
// // backend/config/cloudinary.js
// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // Storage configuration for different media types
// const imageStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'Realtime-hub/images',
//     format: async (req, file) => 'jpg',
//     public_id: (req, file) => `image_${Date.now()}_${file.originalname}`,
//     resource_type: 'image'
//   }
// });

// const videoStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'Realtime-hub/videos',
//     public_id: (req, file) => `video_${Date.now()}_${file.originalname}`,
//     resource_type: 'video'
//   }
// });

// const fileStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'Realtime-hub/files',
//     public_id: (req, file) => `file_${Date.now()}_${file.originalname}`,
//     resource_type: 'raw'
//   }
// });

// module.exports = {
//   cloudinary,
//   imageStorage,
//   videoStorage,
//   fileStorage
// };
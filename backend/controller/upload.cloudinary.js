const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (
  buffer,
  folder = "Realtime-hub/images"
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      )
      .end(buffer);
  });
};

module.exports = uploadToCloudinary;
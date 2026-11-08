const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "evpets0v",
  api_key: process.env.CLOUDINARY_API_KEY || "379824565482325",
  api_secret: process.env.CLOUDINARY_API_SECRET || "wIUJ1s19UrQn-Fyau8EgQ-6ZKUI",
  secure: true,
});

/**
 * Upload Base64 or image URI to Cloudinary
 * @param {string} fileUri - Base64 Data URI
 * @param {string} folder - Target Cloudinary folder
 */
const uploadToCloudinary = async (fileUri, folder = "fg_sm_fitness_members") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileUri,
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit", quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url || result.url,
            public_id: result.public_id,
          });
        }
      }
    );
  });
};

module.exports = { cloudinary, uploadToCloudinary };


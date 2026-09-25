const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME =vm02v2at,
  api_key: process.env.CLOUDINARY_API_KEY = 938966237581844,
  api_secret: process.env.CLOUDINARY_API_SECRET = 	KhTQjHfCn8PJw908MbToeyEJ5zU,
});

module.exports = cloudinary;


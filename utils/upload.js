require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is configured
const isCloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

// Configure Cloudinary
if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('Cloudinary configured');
}

// Cloudinary storage for multer
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const folder = `prawnique/${req.params.type || 'general'}`;
        return {
            folder: folder,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [
                { width: 1920, height: 1920, crop: 'limit', quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        };
    }
});

// Local storage fallback
const createLocalDirs = () => {
    const uploadDirs = ['slider', 'products', 'team', 'news', 'gallery', 'general'];
    const baseDir = path.join(process.cwd(), 'uploads');
    uploadDirs.forEach(dir => {
        const dirPath = path.join(baseDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
};

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        createLocalDirs();
        const uploadType = req.params.type || 'general';
        cb(null, path.join(process.cwd(), 'uploads', uploadType));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed!'));
};

// Create upload middleware
const upload = multer({
    storage: isCloudinaryConfigured ? cloudinaryStorage : localStorage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB max (reduced for better performance)
        files: 1
    },
    fileFilter
});

// Get image URL after upload
const getImageUrl = (req) => {
    if (!req.file) return null;

    if (isCloudinaryConfigured) {
        // Cloudinary returns the URL directly
        return req.file.path;
    } else {
        // Local storage - return relative path
        const uploadType = req.params.type || 'general';
        return `/uploads/${uploadType}/${req.file.filename}`;
    }
};

// Delete image from Cloudinary
const deleteImage = async (imageUrl) => {
    if (!isCloudinaryConfigured || !imageUrl) return;

    try {
        // Extract public_id from Cloudinary URL
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `prawnique/${folder}/${filename.split('.')[0]}`;

        await cloudinary.uploader.destroy(publicId);
        console.log('Deleted image from Cloudinary:', publicId);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
};

module.exports = {
    upload,
    getImageUrl,
    deleteImage,
    cloudinary,
    isCloudinaryConfigured
};

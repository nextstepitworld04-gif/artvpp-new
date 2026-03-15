import { v2 as cloudinary } from "cloudinary";

/**
 * Upload images to Cloudinary
 * @param {File[]} files - Array of File objects to upload
 * @param {string} folder - Cloudinary folder name (e.g., 'profiles', 'artworks', 'products', 'services', 'workshops')
 * @returns {Promise<Array<{url: string, publicId: string}>>} Array of uploaded image objects
 */
export const uploadImagesToCloudinary = async (files, folder = 'frontend/images') => {
    const results = [];

    // Configure Cloudinary (you'll need to set these environment variables)
    cloudinary.config({
        cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
        api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET
    });

    for (const file of files) {
        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Only image files are allowed');
            }

            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(file, {
                folder: `artvpp/${folder}`,
                allowed_formats: ["jpg", "jpeg", "png", "webp"],
                transformation: [
                    { width: 1200, crop: "limit", quality: 85 }
                ],
                public_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`
            });

            results.push({
                url: result.secure_url,
                publicId: result.public_id
            });

        } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            results.push({
                error: error.message,
                fileName: file.name
            });
        }
    }

    return results;
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<Object>} Deletion result
 */
export const deleteImageFromCloudinary = async (publicId) => {
    try {
        cloudinary.config({
            cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
            api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
            api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET
        });

        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
};

/**
 * Get optimized image URL
 * @param {string} publicId - Cloudinary public_id
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
    const defaultOptions = {
        fetch_format: "auto",
        quality: "auto"
    };

    return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

// Export for use in components
export default {
    uploadImagesToCloudinary,
    deleteImageFromCloudinary,
    getOptimizedImageUrl
};
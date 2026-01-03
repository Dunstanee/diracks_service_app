/**
 * Global upload configuration constants
 * These can be adjusted globally for the entire application
 */

export const uploadConfig = {
  /**
   * Maximum file size in bytes
   * Default: 2MB (2 * 1024 * 1024)
   */
  maxFileSize: 2 * 1024 * 1024, // 2MB

  /**
   * Maximum image size in bytes
   * Default: 2MB
   */
  maxImageSize: 2 * 1024 * 1024, // 2MB

  /**
   * Maximum video size in bytes
   * Default: 10MB
   */
  maxVideoSize: 10 * 1024 * 1024, // 10MB

  /**
   * Maximum number of images allowed for multiple uploads
   * Default: 5
   */
  maxImages: 5,

  /**
   * Allowed image file types
   */
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],

  /**
   * Allowed video file types
   */
  allowedVideoTypes: ['video/mp4', 'video/mov', 'video/avi'],

  /**
   * Image quality for compression (0.0 to 1.0)
   * Default: 0.8 (80% quality)
   */
  imageQuality: 0.8,
};

/**
 * Helper function to format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};


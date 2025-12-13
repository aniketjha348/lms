import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize S3 Client
const getS3Client = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    throw new Error('AWS S3 credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_REGION in .env');
  }
  
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

/**
 * Generate a unique filename
 */
const generateFileName = (originalName, folder = 'videos') => {
  const ext = originalName.split('.').pop();
  const uniqueId = crypto.randomBytes(16).toString('hex');
  return `${folder}/${uniqueId}.${ext}`;
};

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} mimeType - MIME type
 * @param {string} folder - Folder in S3 bucket (default: 'videos')
 * @returns {Object} - { fileKey, url }
 */
export const uploadFileToS3 = async (fileBuffer, fileName, mimeType, folder = 'videos') => {
  try {
    const s3 = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET;
    const fileKey = generateFileName(fileName, folder);
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    
    await s3.send(command);
    
    // Generate public URL
    const region = process.env.AWS_REGION || 'ap-south-1';
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
    
    return {
      fileKey,
      url,
      embedUrl: url, // For video player
      downloadUrl: url,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} fileKey - S3 file key
 */
export const deleteFileFromS3 = async (fileKey) => {
  try {
    const s3 = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET;
    
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });
    
    await s3.send(command);
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};

/**
 * Get signed URL for private file access
 * @param {string} fileKey - S3 file key
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 */
export const getSignedFileUrl = async (fileKey, expiresIn = 3600) => {
  try {
    const s3 = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET;
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });
    
    const signedUrl = await getSignedUrl(s3, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('S3 Signed URL Error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Get embed URL for videos
 */
export const getEmbedUrl = (fileKey) => {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'ap-south-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
};

/**
 * Get URL for PDFs
 */
export const getPdfViewerUrl = (fileKey) => {
  return getEmbedUrl(fileKey);
};

export default {
  uploadFileToS3,
  deleteFileFromS3,
  getSignedFileUrl,
  getEmbedUrl,
  getPdfViewerUrl,
};

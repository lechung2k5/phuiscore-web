const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  // SDK tự động lấy credentials từ environment variables:
  // AWS_ACCESS_KEY_ID và AWS_SECRET_ACCESS_KEY
});

/**
 * Upload file lên S3 từ Base64
 * @param {string} base64 - Dữ liệu base64
 * @param {string} filename - Tên file gốc
 * @param {string} folder - Thư mục trên S3 (ví dụ: 'logos', 'avatars')
 * @returns {Promise<string>} - URL của file sau khi upload
 */
const uploadBase64ToS3 = async (base64, filename, folder = "uploads") => {
  try {
    // 1. Chuẩn hóa dữ liệu base64 (loại bỏ prefix data:image/png;base64, nếu có)
    const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 2. Tạo tên file duy nhất để tránh ghi đè
    const ext = path.extname(filename) || ".png";
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const key = `${folder}/${safeName}`;

    // 3. Upload lên S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: getMimeType(ext), // Tự động xác định Content-Type
      // ACL: 'public-read', // Tùy thuộc vào cấu hình bucket
    });

    await s3Client.send(command);

    // 4. Trả về URL public của file
    // Đối với S3 chuẩn: https://{bucket}.s3.{region}.amazonaws.com/{key}
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-southeast-1"}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("[S3 Upload Error]", error.message);
    throw new Error(`Lỗi upload S3: ${error.message}`);
  }
};

/**
 * Phụ trợ lấy MimeType dựa trên extension
 */
function getMimeType(ext) {
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
  };
  return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
}

module.exports = { uploadBase64ToS3 };

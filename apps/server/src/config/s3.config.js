const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIA...",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "..."
    }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "phuiscore-media-storage";

module.exports = { s3Client, BUCKET_NAME };

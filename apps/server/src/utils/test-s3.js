require('dotenv').config({ path: '../../.env' });
const { uploadBase64ToS3 } = require('./s3.utils');

const testUpload = async () => {
  console.log('--- Testing S3 Upload ---');
  console.log('Bucket:', process.env.S3_BUCKET_NAME);
  console.log('Region:', process.env.AWS_REGION);

  // A tiny 1x1 transparent PNG pixel in base64
  const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const filename = 'test-pixel.png';

  try {
    const url = await uploadBase64ToS3(base64, filename, 'test-folder');
    console.log('✅ Upload successful!');
    console.log('URL:', url);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
};

testUpload();

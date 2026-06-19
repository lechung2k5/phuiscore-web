const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Đảm bảo thư mục upload tồn tại
const uploadDirSponsor = path.join(process.cwd(), 'uploads/nha_tai_tro');
const uploadDirMedia = path.join(process.cwd(), 'uploads/logo_dai');
if (!fs.existsSync(uploadDirSponsor)) fs.mkdirSync(uploadDirSponsor, { recursive: true });
if (!fs.existsSync(uploadDirMedia)) fs.mkdirSync(uploadDirMedia, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Xác định thư mục dựa trên fieldname
    if (file.fieldname === 'logo_media') {
      cb(null, uploadDirMedia);
    } else {
      cb(null, uploadDirSponsor);
    }
  },
  filename: function (req, file, cb) {
    const prefix = file.fieldname === 'logo_media' ? 'media-' : 'sponsor-';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên file hình ảnh!'));
    }
  }
});

router.post('/sponsor', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Không có file nào được tải lên.' });
    const fileUrl = `/uploads/nha_tai_tro/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Lỗi upload file:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải file lên server' });
  }
});

router.post('/media', upload.single('logo_media'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Không có file nào được tải lên.' });
    const fileUrl = `/uploads/logo_dai/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Lỗi upload file:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải file lên server' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Các APIs cần accessToken (đã login)
router.use(verifyToken);

// Lấy danh sách thông báo của user hiện tại
router.get('/', notificationController.getNotifications);

// Đánh dấu 1 thông báo là đã đọc
router.patch('/:id/read', notificationController.markAsRead);

// Tạo thông báo (nội bộ/webhook - tạm giữ Auth để test, thực tế có thể tách riêng middleware internal)
router.post('/internal', notificationController.createInternalNotification);

module.exports = router;

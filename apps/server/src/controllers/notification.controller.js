const NotificationRepo = require('../repositories/notification.repo.js');

const NotificationController = {
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.username; // `authMiddleware` gắn `user.username`
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;

            const notifications = await NotificationRepo.getNotificationsByUser(userId, limit);
            const unreadCount = await NotificationRepo.getUnreadCount(userId);

            return res.status(200).json({
                success: true,
                data: notifications,
                unreadCount
            });
        } catch (error) {
            console.error("Lỗi getNotifications:", error);
            return res.status(500).json({ success: false, message: "Lỗi Server" });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const userId = req.user.username;
            const notificationId = req.params.id;

            await NotificationRepo.markAsRead(userId, notificationId);

            return res.status(200).json({ success: true, message: "Đã đánh dấu là đã đọc" });
        } catch (error) {
            console.error("Lỗi markAsRead:", error);
            return res.status(500).json({ success: false, message: "Lỗi Server" });
        }
    },

    // Dành cho hệ thống gọi nội bộ hoặc webhook để tạo thông báo mới
    createInternalNotification: async (req, res) => {
        try {
            const { userId, title, message, type, link } = req.body;
             // Trong thực tế cần verify API key nội bộ
            if (!userId || !title || !message) {
                return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
            }

            const notif = await NotificationRepo.createNotification({ userId, title, message, type, link });
            return res.status(201).json({ success: true, data: notif });
        } catch (error) {
             console.error("Lỗi createNotification:", error);
             return res.status(500).json({ success: false, message: "Lỗi Server" });
        }
    }
};

module.exports = NotificationController;

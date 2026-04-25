// services/cron.service.js
const cron = require('node-cron');
const { crawlByDate } = require('../utils/crawler');
const { syncExternalNews } = require('./newsFetcher.service');
const { invalidateCache } = require('../middlewares/cacheMiddleware');

let isCrawling = false; // Mutex lock chống chồng chéo

const setupCron = () => {
    // 1. Cào dữ liệu mỗi 20 giây cho ngày hôm nay (Dành cho trận đang LIVE)
    //    ⚡ Tăng tốc từ 60s -> 20s để có dữ liệu "Real-time" nhất cho người dùng
    cron.schedule('*/20 * * * * *', async () => {
        if (isCrawling) return;

        const today = new Date().toISOString().split('T')[0];
        isCrawling = true;
        try {
            await crawlByDate(today);
        } catch (error) {
            console.error(`[Cron Job] ❌ Lỗi cập nhật Real-time:`, error.message);
        } finally {
            isCrawling = false;
        }
    });

    // 2. Cào dữ liệu ngày mai mỗi 30 phút
    cron.schedule('0 */30 * * * *', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        console.log(`[Cron Job] 📅 Đang cập nhật lịch thi đấu ngày mai: ${dateStr}`);
        try {
            await crawlByDate(dateStr);
        } catch (error) {
            console.error(`[Cron Job] ❌ Lỗi cào ngày mai:`, error.message);
        }
    });

    // 3. Đồng bộ tin tức từ ghienbongda.vn mỗi 30 phút
    cron.schedule('0,30 * * * *', async () => {
        try {
            const result = await syncExternalNews();
            if (result.success && (result.synced > 0 || result.updated > 0)) {
                console.log(`[Cron Job] 🧹 Phát hiện bài mới, đang xóa cache /api/news...`);
                invalidateCache('/api/news');
            }
        } catch (error) {
            console.error(`[Cron Job] ❌ Lỗi đồng bộ tin tức:`, error.message);
        }
    });
};

module.exports = setupCron;
const { Queue } = require('bullmq');
const connection = require('../config/redis.config');

// Khởi tạo Queue cho Crawler
const crawlerQueue = new Queue('crawler-tasks', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Thử lại tối đa 3 lần nếu lỗi
    backoff: {
      type: 'exponential',
      delay: 5000, // Chờ 5s rồi thử lại
    },
    removeOnComplete: true, // Xóa job khi xong để tiết kiệm RAM Redis
    removeOnFail: false,    // Giữ lại job lỗi để Admin kiểm tra
  }
});

/**
 * Thêm một task cào dữ liệu mới
 * @param {string} type - Loại task ('MATCH_DETAIL', 'LEAGUE_TABLE', 'DAILY_SCHEDULE')
 * @param {object} data - Dữ liệu cần thiết (id, date, etc.)
 */
const addCrawlerJob = async (type, data) => {
  try {
    const job = await crawlerQueue.add(`${type}_${Date.now()}`, { type, ...data });
    console.log(`[Queue] 📥 Đã thêm task: ${type} (JobID: ${job.id})`);
    return job;
  } catch (err) {
    console.error('[Queue] ❌ Lỗi thêm task:', err.message);
  }
};

module.exports = { crawlerQueue, addCrawlerJob };

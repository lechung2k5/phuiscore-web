const { Worker } = require('bullmq');
const connection = require('../config/redis.config');
const { crawlByDate, fetchDetailedData } = require('../utils/crawler');
const MatchRepo = require('../repositories/match.repo');

/**
 * Worker xử lý các task cào dữ liệu từ Queue
 */
const crawlerWorker = new Worker('crawler-tasks', async (job) => {
  const { type, date, matchId, match } = job.data;
  console.log(`[Worker] 🛠️ Đang xử lý task: ${type} (JobID: ${job.id})`);

  try {
    switch (type) {
      case 'DAILY_SCHEDULE':
        // Cào lịch thi đấu cho một ngày cụ thể
        await crawlByDate(date);
        break;

      case 'MATCH_DETAIL':
        // Cào chi tiết một trận đấu (Stats, Incidents, Lineups)
        if (!matchId || !match) throw new Error('Thiếu MatchID hoặc dữ liệu trận đấu');
        const detailedData = await fetchDetailedData(match);
        // Cập nhật lại vào DB
        await MatchRepo.updateMatchLive(date, matchId, detailedData);
        break;

      default:
        console.warn(`[Worker] ⚠️ Loại task không xác định: ${type}`);
    }
  } catch (err) {
    console.error(`[Worker] ❌ Lỗi khi xử lý Job ${job.id}:`, err.message);
    throw err; // Ném lỗi để BullMQ thực hiện retry
  }
}, { connection });

crawlerWorker.on('completed', (job) => {
  console.log(`[Worker] ✅ Hoàn tất Job: ${job.id}`);
});

crawlerWorker.on('failed', (job, err) => {
  console.error(`[Worker] ❌ Thất bại Job: ${job.id}. Lỗi: ${err.message}`);
});

module.exports = crawlerWorker;

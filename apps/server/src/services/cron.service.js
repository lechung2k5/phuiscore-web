const cron = require('node-cron');
const { crawlByDate } = require('../utils/crawler');
const { syncExternalNews } = require('./newsFetcher.service');
const { invalidateCache } = require('../middlewares/cacheMiddleware');

const ENABLE_LIVE_CRAWL = process.env.ENABLE_LIVE_CRAWL === 'true';
const ENABLE_NEWS_SYNC = process.env.ENABLE_NEWS_SYNC === 'true';

let isCrawling = false;

const getVietnamDate = (offsetDays = 0) => {
    const date = new Date(Date.now() + 7 * 60 * 60 * 1000);
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
};

const setupCron = () => {
    if (ENABLE_LIVE_CRAWL) {
        cron.schedule('0 * * * * *', async () => {
            if (isCrawling) return;

            isCrawling = true;
            try {
                await crawlByDate(getVietnamDate());
            } catch (error) {
                console.error('[Cron Job] Real-time crawl failed:', error.message);
            } finally {
                isCrawling = false;
            }
        });
    } else {
        console.log('[Cron Job] Live crawl disabled.');
    }

    cron.schedule('0 */30 * * * *', async () => {
        const dateStr = getVietnamDate(1);
        console.log(`[Cron Job] Updating schedule for tomorrow: ${dateStr}`);
        try {
            await crawlByDate(dateStr);
        } catch (error) {
            console.error('[Cron Job] Tomorrow schedule crawl failed:', error.message);
        }
    });

    if (ENABLE_NEWS_SYNC) {
        cron.schedule('0,30 * * * *', async () => {
            try {
                const result = await syncExternalNews();
                if (result.success && (result.synced > 0 || result.updated > 0)) {
                    invalidateCache('/api/news');
                }
            } catch (error) {
                console.error('[Cron Job] News sync failed:', error.message);
            }
        });
    } else {
        console.log('[Cron Job] News sync disabled.');
    }
};

module.exports = setupCron;

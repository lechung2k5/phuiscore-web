const { gotScraping } = require('got-scraping');

/**
 * HttpClient dùng chung cho toàn bộ Server.
 * Được cấu hình với got-scraping để giả lập trình duyệt và vượt 403/WAF.
 */
const client = gotScraping.extend({
    retry: {
        limit: 2,
        methods: ['GET'],
        statusCodes: [403, 408, 413, 429, 500, 502, 503, 504],
        backoffLimit: 10000
    },
    timeout: {
        request: 15000
    },
    headerGeneratorOptions: {
        browsers: [
            { name: 'chrome', minVersion: 120 },
            { name: 'firefox', minVersion: 120 }
        ],
        devices: ['desktop'],
        locales: ['vi-VN', 'en-US']
    }
});

const getHeaders = () => ({
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'referer': 'https://www.sofascore.com/',
    'origin': 'https://www.sofascore.com',
    'Cookie': process.env.SOFASCORE_COOKIE || '',
    'x-requested-with': 'XMLHttpRequest',
    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin'
});

module.exports = { client, getHeaders };

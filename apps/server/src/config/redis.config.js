const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
  enableOfflineQueue: false,  // THÊM: Tắt queue offline để tránh treo server khi Redis lỗi
  connectTimeout: 5000,       // THÊM: Giới hạn thời gian chờ kết nối là 5s
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

const connection = new Redis(redisConfig);

connection.on('error', (err) => {
  console.error('[Redis] ❌ Connection Error:', err.message);
});

connection.on('connect', () => {
  console.log('[Redis] ⚡ Connected to Redis Cloud successfully!');
});

module.exports = connection;

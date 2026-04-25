const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/news.controller');
const { cacheResponse } = require('../middlewares/cacheMiddleware');

// Lấy danh sách tin tức (Cache 5 phút)
router.get('/', cacheResponse(300), NewsController.getList);

// API Manual sync (Không cache)
router.post('/sync', NewsController.triggerSync);

// Lấy chi tiết tin tức theo slug (Cache 30 phút, vì nội dung ít thay đổi)
router.get('/:slug', cacheResponse(1800), NewsController.getBySlug);

module.exports = router;

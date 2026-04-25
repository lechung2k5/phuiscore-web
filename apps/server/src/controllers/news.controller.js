const NewsRepo = require('../repositories/news.repo');
const { syncExternalNews } = require('../services/newsFetcher.service');
const { invalidateCache } = require('../middlewares/cacheMiddleware');

const NewsController = {
  /**
   * Lấy danh sách tin tức
   * Query: ?page=1&limit=10
   */
  getList: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await NewsRepo.getList({ page, limit });
      
      return res.json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      console.error('[NewsController] getList Error:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi lấy tin tức' });
    }
  },

  /**
   * Lấy chi tiết tin tức theo slug
   */
  getBySlug: async (req, res) => {
    try {
      const { slug } = req.params;
      const news = await NewsRepo.getBySlug(slug);
      
      if (!news) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      // Lấy 4 bài liên quan
      const related = await NewsRepo.getRelated(slug, 4);

      return res.json({
        success: true,
        data: news,
        related: related
      });
    } catch (error) {
      console.error('[NewsController] getBySlug Error:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết tin tức' });
    }
  },

  /**
   * API Manual sync báo chí (chỉ dùng cho Admin hoặc debug)
   */
  triggerSync: async (req, res) => {
    try {
      const result = await syncExternalNews();
      
      if (result.success) {
        // Clear cache list
        invalidateCache('/api/news');
      }
      
      return res.json(result);
    } catch (error) {
      console.error('[NewsController] triggerSync Error:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi đồng bộ tin tức' });
    }
  }
};

module.exports = NewsController;

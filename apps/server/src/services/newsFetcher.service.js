const axios = require('axios');
const NewsRepo = require('../repositories/news.repo');

const WP_API_URL = 'https://ghienbongda.vn/wp-json/wp/v2/posts';

// Clean basic script tags to prevent XSS (if any slip through)
const sanitizeHtml = (html) => {
    if (!html) return '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
};

const extractThumbnail = (post) => {
    // 1. Try _embedded wp:featuredmedia
    try {
        if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'].length > 0) {
            const media = post._embedded['wp:featuredmedia'][0];
            if (media.source_url) return media.source_url;
        }
    } catch(e) {}

    // 2. Try parsing first <img> from content.rendered
    try {
        const content = post.content?.rendered || '';
        const match = content.match(/<img[^>]+src="([^">]+)"/);
        if (match && match[1]) return match[1];
    } catch(e) {}

    return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'; // fallback
};

const extractSummary = (excerpt, content) => {
    let text = '';
    if (excerpt && excerpt.rendered) {
        text = excerpt.rendered;
    } else if (content && content.rendered) {
        text = content.rendered.substring(0, 300);
    }
    // Remove HTML tags
    text = text.replace(/<[^>]*>?/gm, '').trim();
    if (text.length > 200) text = text.substring(0, 197) + '...';
    return text;
};

const syncExternalNews = async () => {
    console.log('[NewsSync] 🔄 Bắt đầu đồng bộ tin tức mới nhất từ ghienbongda.vn...');
    try {
        // Thêm orderby=date&order=desc để luôn lấy bài mới nhất
        const response = await axios.get(`${WP_API_URL}?_embed&per_page=50&orderby=date&order=desc`, {
            timeout: 20000,
            headers: { 'User-Agent': 'PhuiScore-Bot/1.0' }
        });

        const posts = response.data;
        if (!Array.isArray(posts)) {
            console.error('[NewsSync] ❌ API trả về không phải array');
            return { success: false, synced: 0 };
        }

        let synced = 0;
        let updated = 0;
        let errors = 0;

        for (const post of posts) {
            try {
                const idStr = `wp_${post.id}`;
                
                // Chuẩn hóa dữ liệu
                const newsItem = {
                    id: idStr, // Primary key
                    source_id: post.id,
                    title: post.title?.rendered?.replace(/&#8211;/g, '-')
                                                .replace(/&#8220;/g, '"')
                                                .replace(/&#8221;/g, '"')
                                                .replace(/&#8217;/g, "'") || '',
                    slug: post.slug,
                    summary: extractSummary(post.excerpt, post.content),
                    content: sanitizeHtml(post.content?.rendered),
                    thumbnail: extractThumbnail(post),
                    author: post._embedded?.author?.[0]?.name || 'Ghiền Bóng Đá',
                    published_at: post.date, // ISO 8601
                    source_url: post.link,
                    createdAt: Date.now()
                };

                const existing = await NewsRepo.getBySlug(newsItem.slug);
                if (existing) {
                    newsItem.createdAt = existing.createdAt; // keep original
                    await NewsRepo.upsert(newsItem);
                    updated++;
                } else {
                    await NewsRepo.upsert(newsItem);
                    synced++;
                    console.log(`[NewsSync] 🆕 Bài mới: ${newsItem.title}`);
                }
            } catch (err) {
                console.error(`[NewsSync] ❌ Lỗi lưu bài ${post.id}:`, err.message);
                errors++;
            }
        }

        console.log(`[NewsSync] ✅ Xong. Mới: ${synced}, Cập nhật: ${updated}, Lỗi: ${errors}`);
        return { success: true, synced, updated, errors };

    } catch (error) {
        console.error('[NewsSync] ❌ Lỗi fetch WP API:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { syncExternalNews };

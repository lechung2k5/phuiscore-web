const S3_BUCKET = 'phuiscore-media-storage';
const S3_REGION = 'ap-southeast-1';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

/**
 * Chuyển đổi đường dẫn ảnh thành URL hoàn chỉnh
 * Ưu tiên lấy từ SofaScore API nếu có ID, nếu không lấy từ S3/Local
 */
export const getImageUrl = (path: string | null | undefined, type: 'logo' | 'banner' | 'avatar' = 'logo', id?: string | number) => {
    // Nếu có ID và là dạng số (SofaScore ID), ưu tiên lấy từ SofaScore API
    if (id && !isNaN(Number(id))) {
        if (type === 'logo') return `https://api.sofascore.app/api/v1/team/${id}/image`;
        if (type === 'avatar') return `https://api.sofascore.app/api/v1/player/${id}/image`;
    }

    if (!path) {
        if (type === 'logo') return 'https://api.dicebear.com/7.x/identicon/svg?seed=team';
        if (type === 'avatar') return 'https://api.dicebear.com/7.x/avataaars/svg?seed=player';
        return 'https://placehold.co/600x400?text=No+Image';
    }

    // Nếu đã là URL hoàn chỉnh (bao gồm cả SofaScore URL đã lưu)
    if (path.startsWith('http')) {
        return path;
    }

    // Nếu là path từ S3
    if (!path.startsWith('/') && !path.startsWith('http')) {
        return `${S3_BASE_URL}/${path}`;
    }

    // Nếu là local path
    if (path.startsWith('/uploads')) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${API_BASE}${path}`;
    }

    return path;
};

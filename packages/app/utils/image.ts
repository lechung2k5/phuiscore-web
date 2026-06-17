const S3_BUCKET = 'phuiscore-media-storage';
const S3_REGION = 'ap-southeast-1';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

const WORLD_CUP_LOGO = 'https://brandlogos.net/wp-content/uploads/2026/06/fifa-world-cup-2026-black-logo.png';

export const COUNTRY_MAP: any = {
  'Qatar': 'qa', 'Switzerland': 'ch', 'Brazil': 'br', 'Morocco': 'ma',
  'Haiti': 'ht', 'Scotland': 'gb-sct', 'Australia': 'au', 'Türkiye': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', 'Argentina': 'ar', 'France': 'fr',
  'England': 'gb-eng', 'Spain': 'es', 'Portugal': 'pt', 'Netherlands': 'nl',
  'Italy': 'it', 'Croatia': 'hr', 'Uruguay': 'uy', 'Belgium': 'be',
  'Colombia': 'co', 'Senegal': 'sn', 'USA': 'us', 'Mexico': 'mx', 'Japan': 'jp',
  'Korea Republic': 'kr', 'Saudi Arabia': 'sa', 'Iran': 'ir', 'Canada': 'ca',
  'Ecuador': 'ec', 'Chile': 'cl', 'Peru': 'pe', 'Wales': 'gb-wls', 'Poland': 'pl',
  'Serbia': 'rs', 'Denmark': 'dk', 'Tunisia': 'tn', 'Cameroon': 'cm', 'Ghana': 'gh',
  'Uzbekistan': 'uz', 'Austria': 'at', 'Jordan': 'jo', 'Algeria': 'dz', 'Norway': 'no', 'Iraq': 'iq'
};

/**
 * Chuyển đổi đường dẫn ảnh thành URL hoàn chỉnh
 * Ưu tiên lấy từ SofaScore API nếu có ID, nếu không lấy từ S3/Local
 */
export const getImageUrl = (path: string | null | undefined, type: 'logo' | 'banner' | 'avatar' | 'tournament' = 'logo', id?: string | number, name?: string) => {
    let finalUrl = path || '';

    // Nếu có ID và là dạng số (SofaScore ID), ưu tiên tạo URL từ SofaScore API
    if (id && !isNaN(Number(id))) {
        if (type === 'logo') finalUrl = `https://api.sofascore.app/api/v1/team/${id}/image`;
        if (type === 'avatar') finalUrl = `https://api.sofascore.app/api/v1/player/${id}/image`;
        if (type === 'tournament') finalUrl = `https://api.sofascore.app/api/v1/unique-tournament/${id}/image`;
    }

    if (!finalUrl) {
        if (type === 'logo') return 'https://api.dicebear.com/7.x/identicon/svg?seed=team';
        if (type === 'avatar') return 'https://api.dicebear.com/7.x/avataaars/svg?seed=player';
        return 'https://placehold.co/600x400?text=No+Image';
    }

    // Nếu path từ SofaScore, áp dụng fallback (vì SofaScore chặn browser request)
    if (finalUrl.includes('api.sofascore.app') || finalUrl.includes('sofascore.com')) {
        if (type === 'tournament' && (name?.toLowerCase().includes('world cup') || finalUrl.includes('/16/'))) {
            return WORLD_CUP_LOGO;
        }
        
        if (type === 'logo' && name) {
            const countryCode = COUNTRY_MAP[name];
            if (countryCode) {
                return `https://flagcdn.com/w80/${countryCode}.png`;
            }
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`;
        }
        
        // Trả về UI Avatar mặc định nếu bị SofaScore chặn mà không có fallback cờ
        if (type === 'logo') return `https://ui-avatars.com/api/?name=${name ? encodeURIComponent(name) : 'T'}&background=random&color=fff&bold=true`;
    }

    // Nếu đã là URL hoàn chỉnh
    if (finalUrl.startsWith('http')) {
        return finalUrl;
    }

    // Nếu là path từ S3
    if (!finalUrl.startsWith('/') && !finalUrl.startsWith('http')) {
        return `${S3_BASE_URL}/${finalUrl}`;
    }

    // Nếu là local path
    if (finalUrl.startsWith('/uploads')) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${API_BASE}${finalUrl}`;
    }

    return finalUrl;
};



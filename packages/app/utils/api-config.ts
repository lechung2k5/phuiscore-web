export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// Nếu URL đã có /api ở cuối thì giữ nguyên, nếu chưa có thì thêm vào
export const API_BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;


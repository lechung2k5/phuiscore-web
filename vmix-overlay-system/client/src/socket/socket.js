import { io } from 'socket.io-client';

// Kết nối tới Backend. Trong thực tế URL sẽ đọc từ env
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const socket = io(SERVER_URL, {
  autoConnect: false // Sẽ connect thủ công khi vào trang
});

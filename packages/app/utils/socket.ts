import { io } from 'socket.io-client';

// Lấy API URL từ env hoặc mặc định là localhost:5000
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
    : 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
    autoConnect: false, // Kết nối khi cần
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
});

// Helper để join/leave room (nếu sau này cần tối ưu theo trận đấu cụ thể)
export const joinMatchRoom = (matchId: string) => {
    socket.emit('joinMatch', matchId);
};

export const leaveMatchRoom = (matchId: string) => {
    socket.emit('leaveMatch', matchId);
};

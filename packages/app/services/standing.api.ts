import axios from 'axios';

// Đây là địa chỉ Backend của ông chạy ở apps/server
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'); 

export const standingApi = {
  fetchLeagueStandings: async (tournamentId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/standings/${tournamentId}`);
      return response.data; 
    } catch (error) {
      console.error("❌ [Frontend API Error]:", error);
      throw error;
    }
  }
};
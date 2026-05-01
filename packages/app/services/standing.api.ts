import axios from 'axios';
import { API_BASE } from '../utils/api-config';

const API_BASE_URL = API_BASE;

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
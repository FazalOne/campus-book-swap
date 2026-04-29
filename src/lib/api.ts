
import { User } from '../types';

// Dynamic API URL for Local Network Support.
// If the user visits 'http://localhost:5173', hostname is 'localhost'.
// If the user visits 'http://192.168.1.5:5173', hostname is '192.168.1.5'.
// We assume the backend is running on the SAME machine (IP) but on port 3001.
const hostname = window.location.hostname || 'localhost';
const API_URL = (import.meta.env.VITE_API_URL || `http://${hostname}:3001/api`).replace(/\/$/, '');

const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr) as User;
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    } catch {
      localStorage.removeItem('user');
    }
  }
  return headers;
};

const throwForAuth = async (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  throw new Error(await response.text());
};

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    try {
      // Added Headers to Disable Cache
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
            ...getHeaders(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        },
      });
      if (!response.ok) {
          await throwForAuth(response);
      }
      return response.json();
    } catch (error: any) {
      console.error("API GET Error:", error);
      if (error.message === 'Failed to fetch') {
         throw new Error(`Cannot connect to server at ${API_URL}. Is the backend running?`);
      }
      throw error;
    }
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) await throwForAuth(response);
      return response.json();
    } catch (error: any) {
      console.error("API POST Error:", error);
      if (error.message === 'Failed to fetch') {
        throw new Error(`Cannot connect to server at ${API_URL}. Is the backend running?`);
      }
      throw error;
    }
  },

  put: async <T>(endpoint: string, body: any): Promise<T> => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) await throwForAuth(response);
      return response.json();
    } catch (error: any) {
      console.error("API PUT Error:", error);
      if (error.message === 'Failed to fetch') {
        throw new Error(`Cannot connect to server at ${API_URL}. Is the backend running?`);
      }
      throw error;
    }
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!response.ok) await throwForAuth(response);
      return response.json();
    } catch (error: any) {
      console.error("API DELETE Error:", error);
      if (error.message === 'Failed to fetch') {
        throw new Error(`Cannot connect to server at ${API_URL}. Is the backend running?`);
      }
      throw error;
    }
  },
};

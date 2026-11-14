import axios from 'axios';
import staticData from '../data/staticData.json';

export const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('swiftmart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Resilient fallback interceptor for static hosting (e.g. GitHub Pages)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url || '';
    
    // Provide offline/static data fallbacks when backend is not running or on GitHub Pages
    if (url.includes('/categories')) {
      return Promise.resolve({ data: staticData.categories, status: 200, statusText: 'OK', headers: {}, config: error.config });
    }
    
    if (url.includes('/products/featured')) {
      const featured = (staticData.products as any[]).slice(0, 12);
      return Promise.resolve({ data: featured, status: 200, statusText: 'OK', headers: {}, config: error.config });
    }
    
    if (url.includes('/products')) {
      let filtered = [...(staticData.products as any[])];
      const categoryMatch = url.match(/category_id=(\d+)/);
      if (categoryMatch) {
        const catId = Number(categoryMatch[1]);
        filtered = filtered.filter(p => p.category_id === catId);
      }
      const qMatch = url.match(/q=([^&]+)/);
      if (qMatch) {
        const q = decodeURIComponent(qMatch[1]).toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)));
      }
      return Promise.resolve({ data: filtered, status: 200, statusText: 'OK', headers: {}, config: error.config });
    }

    if (url.includes('/store/map')) {
      return Promise.resolve({ data: staticData.store_map, status: 200, statusText: 'OK', headers: {}, config: error.config });
    }

    // AI Assistant request error fallback
    if (url.includes('/ai/chat')) {
      return Promise.resolve({
        data: {
          reply: "⚠️ The AI backend server is currently unreachable. Please make sure the FastAPI server is running on http://localhost:8000.",
          conversation_id: 1,
          suggested_products: [],
          products_data: [],
          route_summary: null,
          route_generated: false,
          action: null,
          quick_suggestions: [
            "🥗 Dinner ingredients under ₹400",
            "📍 Where is the Amul butter?",
            "🗺️ Plan shortest route for my cart"
          ]
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      });
    }

    if (error.response?.status === 401) {
      const token = localStorage.getItem('swiftmart_token');
      if (token) {
        localStorage.removeItem('swiftmart_token');
      }
    }
    return Promise.reject(error);
  }
);

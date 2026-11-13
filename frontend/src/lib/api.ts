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
  (error) => {
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

    // AI Assistant static/offline intelligent fallback for GitHub Pages
    if (url.includes('/ai/chat')) {
      try {
        const body = JSON.parse(error.config?.data || '{}');
        const userMsg = (body.message || '').toLowerCase();
        const allProducts = staticData.products as any[];
        
        let reply = "I am your SwiftMart AI Shopper! I can help you find products, calculate dinner ingredient kits under budget, locate physical shelves, or plan in-store shopping routes.";
        let matched = [] as any[];
        let action = null;
        let routeGenerated = false;
        let routeSummary = null;

        if (userMsg.includes('butter') || userMsg.includes('amul')) {
          matched = allProducts.filter(p => p.name.toLowerCase().includes('butter') || p.name.toLowerCase().includes('amul')).slice(0, 3);
          reply = "Found Amul Dairy essentials! Amul Butter and Milk are located in **Aisle 2 (Dairy Section)** on **Shelf 14**.";
        } else if (userMsg.includes('dinner') || userMsg.includes('meal') || userMsg.includes('recipe') || userMsg.includes('cook')) {
          matched = allProducts.filter(p => 
            p.name.toLowerCase().includes('paneer') || 
            p.name.toLowerCase().includes('tomato') || 
            p.name.toLowerCase().includes('onion') || 
            p.name.toLowerCase().includes('masala')
          ).slice(0, 4);
          const totalCost = matched.reduce((sum, item) => sum + item.price, 0);
          reply = `Here is a complete delicious dinner meal bundle (Paneer Butter Masala kit) for only **₹${totalCost}** (well under your ₹400 budget!):\n\n` +
                  matched.map(m => `• **${m.name}** — ₹${m.price}`).join('\n') + 
                  `\n\nClick **"Add All to Cart"** below to shop this kit!`;
        } else if (userMsg.includes('route') || userMsg.includes('path') || userMsg.includes('map') || userMsg.includes('walk')) {
          routeGenerated = true;
          action = 'show_route';
          routeSummary = {
            total_distance: "65 m",
            estimated_minutes: "2 mins",
            item_count: 4,
            first_stop: "Dairy Aisle - Milk Rack",
            instructions: [
              "🚶 Start at the store entrance",
              "➡️ Stop 1: Pick up Fresh Milk at Dairy Rack",
              "➡️ Stop 2: Collect Vegetables at Produce Section",
              "🧾 Proceed to Checkout Counter 1"
            ]
          };
          reply = "I've calculated the shortest in-store route between product shelves for your items! Total walking distance is just 65 meters. Click **'View Optimized Route on Map'** to open the interactive floorplan.";
        } else if (userMsg.includes('snack') || userMsg.includes('kids')) {
          matched = allProducts.filter(p => p.category_id === 3 || p.name.toLowerCase().includes('biscuit') || p.name.toLowerCase().includes('chip')).slice(0, 3);
          reply = "Here are healthy, popular snacks for kids and tea-time crunching!";
        } else {
          // General product search
          matched = allProducts.filter(p => {
            const words = userMsg.split(' ').filter((w: string) => w.length > 2);
            return words.some((w: string) => p.name.toLowerCase().includes(w));
          }).slice(0, 3);
          if (matched.length > 0) {
            reply = `Found ${matched.length} matching item(s) in the store catalogue for you:`;
          }
        }

        return Promise.resolve({
          data: {
            reply,
            conversation_id: body.conversation_id || 1,
            suggested_products: matched.map(m => m.id),
            products_data: matched,
            route_summary: routeSummary,
            route_generated: routeGenerated,
            action,
            quick_suggestions: [
              "🥗 Dinner ingredients under ₹400",
              "📍 Where is the Amul butter?",
              "🗺️ Plan shortest route for my cart",
              "🍿 Healthy snacks for kids"
            ]
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config
        });
      } catch (e) {
        // Fallback generic
      }
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

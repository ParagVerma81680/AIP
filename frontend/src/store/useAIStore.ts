import { create } from 'zustand';
import { api } from '../lib/api';
import type { AIChatResponse, ChatMessageItem, AIProductInfo } from '../types';
import { useCartStore } from './useCartStore';
import toast from 'react-hot-toast';

interface AIState {
  isOpen: boolean;
  isLoading: boolean;
  messages: ChatMessageItem[];
  conversationId: number | null;
  activeSuggestions: string[];

  openChat: (initialPrompt?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  addAllToCart: (products: AIProductInfo[]) => Promise<void>;
}

const INITIAL_WELCOME: ChatMessageItem = {
  id: 'welcome-1',
  role: 'assistant',
  content: `👋 **Hi! I'm your SwiftMart AI Shopping Assistant.**\n\nI can help you find products, plan dinner ingredient lists under budget, locate physical shelves in our store, or calculate the shortest aisle walking route!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  quickSuggestions: [
    '🥗 Dinner ingredients under ₹400',
    '📍 Where is the Amul butter?',
    '🗺️ Plan shortest route for my cart',
    '🍿 Healthy snacks for kids',
  ],
};

export const useAIStore = create<AIState>((set, get) => ({
  isOpen: false,
  isLoading: false,
  messages: [INITIAL_WELCOME],
  conversationId: null,
  activeSuggestions: [
    '🥗 Dinner ingredients under ₹400',
    '📍 Where is the Amul butter?',
    '🗺️ Plan shortest route for my cart',
    '🍿 Healthy snacks for kids',
  ],

  openChat: (initialPrompt?: string) => {
    set({ isOpen: true });
    if (initialPrompt) {
      get().sendMessage(initialPrompt);
    }
  },

  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),

  clearChat: () => {
    set({
      messages: [INITIAL_WELCOME],
      conversationId: null,
      activeSuggestions: INITIAL_WELCOME.quickSuggestions || [],
    });
    toast.success('Chat history cleared');
  },

  addAllToCart: async (products: AIProductInfo[]) => {
    if (!products || products.length === 0) return;
    const cartStore = useCartStore.getState();
    let addedCount = 0;

    for (const p of products) {
      await cartStore.addItem({
        id: p.id,
        name: p.name,
        brand: p.brand || null,
        price: p.price,
        original_price: p.original_price || null,
        discount_pct: p.discount_pct || 0,
        stock: 100,
        is_available: p.is_available ?? true,
        image_url: p.image_url || null,
        quantity_label: p.quantity_label || '1 unit',
        shelf_id: null,
        shelf_x: p.shelf_x || null,
        shelf_y: p.shelf_y || null,
      });
      addedCount++;
    }

    toast.success(`Added ${addedCount} items to your cart! 🛒`);
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || get().isLoading) return;

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      const cartItems = useCartStore.getState().items;
      const cartProductIds = cartItems.map((i) => i.product_id);

      const res = await api.post<AIChatResponse>('/ai/chat', {
        message: trimmed,
        conversation_id: get().conversationId,
        cart_product_ids: cartProductIds,
      });

      const data = res.data;

      const botMessage: ChatMessageItem = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        products: data.products_data,
        routeSummary: data.route_summary,
        routeGenerated: data.route_generated,
        action: data.action,
        quickSuggestions: data.quick_suggestions,
      };

      set((state) => ({
        messages: [...state.messages, botMessage],
        conversationId: data.conversation_id,
        activeSuggestions: data.quick_suggestions && data.quick_suggestions.length > 0
          ? data.quick_suggestions
          : state.activeSuggestions,
        isLoading: false,
      }));
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail || 'Unable to connect to AI assistant. Please try again.';

      const fallbackBotMessage: ChatMessageItem = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({
        messages: [...state.messages, fallbackBotMessage],
        isLoading: false,
      }));
    }
  },
}));

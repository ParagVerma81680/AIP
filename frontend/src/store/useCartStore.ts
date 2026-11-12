import { create } from 'zustand';
import { api } from '../lib/api';
import type { CartItem, Product } from '../types';

const DELIVERY_FREE_THRESHOLD = 500;
const DELIVERY_FEE = 40;
const LOCAL_STORAGE_KEY = 'swiftmart_guest_cart';

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  isLoading: boolean;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Actions
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;

  // Calculations
  getItemQuantity: (productId: number) => number;
  getSubtotal: () => number;
  getDeliveryCharge: () => number;
  getTotal: () => number;
  getTotalItemsCount: () => number;
  getFreeDeliveryRemaining: () => number;
}

const loadLocalCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: loadLocalCart(),
  isCartOpen: false,
  isLoading: false,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  getItemQuantity: (productId: number) => {
    const item = get().items.find((i) => i.product_id === productId);
    return item ? item.quantity : 0;
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  getDeliveryCharge: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0 || subtotal >= DELIVERY_FREE_THRESHOLD) return 0;
    return DELIVERY_FEE;
  },

  getTotal: () => {
    return get().getSubtotal() + get().getDeliveryCharge();
  },

  getTotalItemsCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getFreeDeliveryRemaining: () => {
    const subtotal = get().getSubtotal();
    return Math.max(0, DELIVERY_FREE_THRESHOLD - subtotal);
  },

  fetchCart: async () => {
    const token = localStorage.getItem('swiftmart_token');
    if (!token) {
      set({ items: loadLocalCart() });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await api.get('/cart');
      const items: CartItem[] = (res.data.items || []).map((it: any) => ({
        id: it.id,
        product_id: it.product_id,
        quantity: it.quantity,
        product: it.product,
      }));
      set({ items, isLoading: false });
      saveLocalCart(items);
    } catch {
      set({ items: loadLocalCart(), isLoading: false });
    }
  },

  addItem: async (product: Product, quantity = 1) => {
    const currentItems = [...get().items];
    const existingIndex = currentItems.findIndex((i) => i.product_id === product.id);

    if (existingIndex > -1) {
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantity: currentItems[existingIndex].quantity + quantity,
      };
    } else {
      currentItems.push({
        product_id: product.id,
        quantity,
        product,
      });
    }

    set({ items: currentItems });
    saveLocalCart(currentItems);

    const token = localStorage.getItem('swiftmart_token');
    if (token) {
      try {
        await api.post('/cart/items', {
          product_id: product.id,
          quantity,
        });
      } catch {
        // Fallback local
      }
    }
  },

  removeItem: async (productId: number) => {
    const currentItems = [...get().items];
    const existingIndex = currentItems.findIndex((i) => i.product_id === productId);

    if (existingIndex > -1) {
      const currentItem = currentItems[existingIndex];
      const token = localStorage.getItem('swiftmart_token');

      if (currentItem.quantity > 1) {
        currentItems[existingIndex] = {
          ...currentItem,
          quantity: currentItem.quantity - 1,
        };
        set({ items: currentItems });
        saveLocalCart(currentItems);

        if (token && currentItem.id) {
          try {
            await api.put(`/cart/items/${currentItem.id}`, {
              quantity: currentItem.quantity - 1,
            });
          } catch {
            // ignore
          }
        }
      } else {
        const itemToDelete = currentItems[existingIndex];
        currentItems.splice(existingIndex, 1);
        set({ items: currentItems });
        saveLocalCart(currentItems);

        if (token && itemToDelete.id) {
          try {
            await api.delete(`/cart/items/${itemToDelete.id}`);
          } catch {
            // ignore
          }
        }
      }
    }
  },

  updateQuantity: async (productId: number, quantity: number) => {
    const currentItems = [...get().items];
    const existingIndex = currentItems.findIndex((i) => i.product_id === productId);

    if (existingIndex > -1) {
      const item = currentItems[existingIndex];
      const token = localStorage.getItem('swiftmart_token');

      if (quantity <= 0) {
        currentItems.splice(existingIndex, 1);
        set({ items: currentItems });
        saveLocalCart(currentItems);
        if (token && item.id) {
          try {
            await api.delete(`/cart/items/${item.id}`);
          } catch {
            // ignore
          }
        }
      } else {
        currentItems[existingIndex] = { ...item, quantity };
        set({ items: currentItems });
        saveLocalCart(currentItems);
        if (token && item.id) {
          try {
            await api.put(`/cart/items/${item.id}`, { quantity });
          } catch {
            // ignore
          }
        }
      }
    }
  },

  clearCart: async () => {
    set({ items: [] });
    saveLocalCart([]);
    const token = localStorage.getItem('swiftmart_token');
    if (token) {
      try {
        await api.delete('/cart');
      } catch {
        // ignore
      }
    }
  },
}));

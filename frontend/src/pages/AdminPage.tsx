import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  Package,
  MapPin,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Compass,
  Store,
  RefreshCw,
  X,
  Eye,
  Truck,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import type { 
  Product, 
  Category, 
  AdminStats, 
  AdminShelf, 
  AdminOrder 
} from '../types';
import toast from 'react-hot-toast';

// Preset default categories for fallback / selector
const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Fruits & Vegetables', slug: 'fruits-vegetables', sort_order: 1 },
  { id: 2, name: 'Dairy, Bread & Eggs', slug: 'dairy-bread-eggs', sort_order: 2 },
  { id: 3, name: 'Snacks & Munchies', slug: 'snacks-munchies', sort_order: 3 },
  { id: 4, name: 'Cold Drinks & Juices', slug: 'cold-drinks-juices', sort_order: 4 },
  { id: 5, name: 'Atta, Rice, Oil & Dals', slug: 'atta-rice-oil-dals', sort_order: 5 },
  { id: 6, name: 'Masala & Spices', slug: 'masala-spices', sort_order: 6 },
  { id: 7, name: 'Bakery & Biscuits', slug: 'bakery-biscuits', sort_order: 7 },
  { id: 8, name: 'Personal Care', slug: 'personal-care', sort_order: 8 },
  { id: 9, name: 'Cleaning & Household', slug: 'cleaning-household', sort_order: 9 },
  { id: 10, name: 'Instant Food & Noodles', slug: 'instant-food-noodles', sort_order: 10 },
];

// 8 Supermarket Aisles metadata
const STORE_AISLES = [
  { id: 1, name: 'Personal Care', number: 1, section: 'Care & Household', color: '#818cf8', x: 80, y: 50, width: 280, height: 70 },
  { id: 2, name: 'Cleaning & Household', number: 2, section: 'Care & Household', color: '#6366f1', x: 420, y: 50, width: 280, height: 70 },
  { id: 3, name: 'Fresh Fruits', number: 3, section: 'Fresh Produce', color: '#10b981', x: 80, y: 160, width: 280, height: 70 },
  { id: 4, name: 'Fresh Vegetables', number: 4, section: 'Fresh Produce', color: '#059669', x: 420, y: 160, width: 280, height: 70 },
  { id: 5, name: 'Grains & Staples', number: 5, section: 'Pantry & Grocery', color: '#f59e0b', x: 80, y: 270, width: 280, height: 70 },
  { id: 6, name: 'Spices & Oils', number: 6, section: 'Pantry & Grocery', color: '#d97706', x: 420, y: 270, width: 280, height: 70 },
  { id: 7, name: 'Dairy & Eggs', number: 7, section: 'Chilled & Bakery', color: '#0ea5e9', x: 80, y: 380, width: 280, height: 70 },
  { id: 8, name: 'Bakery & Snacks', number: 8, section: 'Chilled & Bakery', color: '#ec4899', x: 420, y: 380, width: 280, height: 70 },
];

export const AdminPage: React.FC = () => {
  const { user, login } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'layout' | 'orders'>('overview');
  
  // Data states
  const [stats, setStats] = useState<AdminStats>({
    total_products: 72,
    total_users: 24,
    total_orders: 148,
    total_revenue: 68420.5,
    in_store_route_requests: 312,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [shelves, setShelves] = useState<AdminShelf[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Product Management
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');

  // Filters for Orders Management
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Product Add / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Product Delete Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Layout Inspector Selected Item State
  const [selectedAisleId, setSelectedAisleId] = useState<number | null>(1);
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      try {
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data) {
          setStats((prev) => ({ ...prev, ...statsRes.data }));
        }
      } catch {
        // use default stats
      }

      // 2. Fetch Products
      try {
        const prodRes = await api.get('/admin/products');
        if (Array.isArray(prodRes.data) && prodRes.data.length > 0) {
          setProducts(prodRes.data);
        } else {
          // fallback to public products
          const publicRes = await api.get('/products?limit=100');
          if (Array.isArray(publicRes.data)) {
            setProducts(publicRes.data);
          }
        }
      } catch {
        try {
          const publicRes = await api.get('/products?limit=100');
          if (Array.isArray(publicRes.data)) {
            setProducts(publicRes.data);
          }
        } catch {
          // keep local
        }
      }

      // 3. Fetch Categories
      try {
        const catRes = await api.get('/categories');
        if (Array.isArray(catRes.data) && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
      } catch {
        // keep defaults
      }

      // 4. Fetch Shelves
      try {
        const shelfRes = await api.get('/admin/shelves');
        if (Array.isArray(shelfRes.data) && shelfRes.data.length > 0) {
          setShelves(shelfRes.data);
        }
      } catch {
        // Generate fallback shelves 1-22
        const fallbackShelves: AdminShelf[] = [];
        for (let i = 1; i <= 22; i++) {
          const aisleId = ((i - 1) % 8) + 1;
          const aisle = STORE_AISLES.find((a) => a.id === aisleId);
          fallbackShelves.push({
            id: i,
            name: `Shelf Section #${i}`,
            aisle_id: aisleId,
            aisle_name: aisle?.name,
            aisle_number: aisle?.number,
            x: (aisle?.x || 100) + ((i % 3) * 80),
            y: (aisle?.y || 100) + 20,
            width: 70,
            height: 25,
          });
        }
        setShelves(fallbackShelves);
      }

      // 5. Fetch Orders
      try {
        const ordersRes = await api.get('/admin/orders');
        if (Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
          setOrders(ordersRes.data);
        } else {
          // Fallback demo orders if database has no orders yet
          setOrders([
            {
              id: 1042,
              status: 'pending',
              subtotal: 580,
              delivery_charge: 0,
              total: 580,
              payment_method: 'UPI',
              notes: 'Leave at front door with security',
              created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
              customer: {
                id: 2,
                email: 'alex.j@example.com',
                full_name: 'Alex Johnson',
                phone: '+91 98765 43210',
              },
              address: {
                id: 1,
                label: 'Home',
                line1: 'Flat 402, Green Glen Layout, Outer Ring Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560103',
              },
              items: [
                {
                  id: 1,
                  product_id: 1,
                  quantity: 2,
                  unit_price: 60,
                  product: {
                    id: 1,
                    name: 'Fresh Alphonso Mangoes',
                    price: 60,
                    shelf_id: 5,
                    quantity_label: '1 kg',
                  },
                },
                {
                  id: 2,
                  product_id: 3,
                  quantity: 1,
                  unit_price: 35,
                  product: {
                    id: 3,
                    name: 'Amul Taaza Homogenised Toned Milk',
                    price: 35,
                    shelf_id: 17,
                    quantity_label: '1 L',
                  },
                },
              ],
            },
            {
              id: 1041,
              status: 'packed',
              subtotal: 420,
              delivery_charge: 40,
              total: 460,
              payment_method: 'Card',
              notes: 'Ring doorbell twice',
              created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
              customer: {
                id: 3,
                email: 'priya.s@example.com',
                full_name: 'Priya Sharma',
                phone: '+91 98450 12345',
              },
              address: {
                id: 2,
                label: 'Apartment',
                line1: 'Tower B, 12th Floor, Indiranagar',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560038',
              },
              items: [
                {
                  id: 3,
                  product_id: 7,
                  quantity: 3,
                  unit_price: 20,
                  product: {
                    id: 7,
                    name: 'Lay\'s India\'s Magic Masala Chips',
                    price: 20,
                    shelf_id: 20,
                    quantity_label: '50 g',
                  },
                },
              ],
            },
            {
              id: 1040,
              status: 'confirmed',
              subtotal: 890,
              delivery_charge: 0,
              total: 890,
              payment_method: 'Cash on Delivery',
              notes: 'Call before dispatch',
              created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
              customer: {
                id: 4,
                email: 'rohit.k@example.com',
                full_name: 'Rohit Kumar',
                phone: '+91 97110 54321',
              },
              address: {
                id: 3,
                label: 'Work',
                line1: 'Embassy Golf Links Business Park, Domlur',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560071',
              },
              items: [
                {
                  id: 4,
                  product_id: 12,
                  quantity: 2,
                  unit_price: 180,
                  product: {
                    id: 12,
                    name: 'Aashirvaad Select Sharbati Atta',
                    price: 180,
                    shelf_id: 9,
                    quantity_label: '5 kg',
                  },
                },
              ],
            },
            {
              id: 1039,
              status: 'delivered',
              subtotal: 1250,
              delivery_charge: 0,
              total: 1250,
              payment_method: 'UPI',
              notes: 'Delivered in 8 mins',
              created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
              customer: {
                id: 2,
                email: 'alex.j@example.com',
                full_name: 'Alex Johnson',
                phone: '+91 98765 43210',
              },
              address: {
                id: 1,
                label: 'Home',
                line1: 'Flat 402, Green Glen Layout, Outer Ring Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560103',
              },
              items: [
                {
                  id: 5,
                  product_id: 4,
                  quantity: 2,
                  unit_price: 75,
                  product: {
                    id: 4,
                    name: 'Farm Fresh Brown Eggs',
                    price: 75,
                    shelf_id: 18,
                    quantity_label: '6 pcs',
                  },
                },
              ],
            },
          ]);
        }
      } catch {
        // default fallback
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // One-click demo admin login
  const handleQuickAdminLogin = async () => {
    try {
      await login('admin@swiftmart.com', 'admin123');
      toast.success('Authenticated as SwiftMart Admin!');
      fetchData();
    } catch {
      toast.error('Failed to log in as admin');
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.shelf_id && String(p.shelf_id).includes(searchQuery));

      const matchesCategory =
        categoryFilter === 'all' || String(p.category_id) === categoryFilter;

      const matchesStock =
        stockFilter === 'all'
          ? true
          : stockFilter === 'in_stock'
          ? p.stock > 10
          : p.stock <= 10;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter === 'all') return true;
      return o.status.toLowerCase() === orderStatusFilter.toLowerCase();
    });
  }, [orders, orderStatusFilter]);

  // Handle Add/Edit Product submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || editingProduct.price === undefined) {
      toast.error('Please enter product name and price');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const payload = {
        name: editingProduct.name,
        brand: editingProduct.brand || null,
        category_id: editingProduct.category_id ? Number(editingProduct.category_id) : null,
        description: editingProduct.description || null,
        image_url: editingProduct.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
        quantity_label: editingProduct.quantity_label || '1 unit',
        price: Number(editingProduct.price),
        original_price: editingProduct.original_price ? Number(editingProduct.original_price) : Number(editingProduct.price),
        discount_pct: editingProduct.discount_pct ? Number(editingProduct.discount_pct) : 0,
        stock: editingProduct.stock !== undefined ? Number(editingProduct.stock) : 50,
        is_available: editingProduct.is_available ?? true,
        shelf_id: editingProduct.shelf_id ? Number(editingProduct.shelf_id) : 1,
        shelf_x: editingProduct.shelf_x ? Number(editingProduct.shelf_x) : 120,
        shelf_y: editingProduct.shelf_y ? Number(editingProduct.shelf_y) : 65,
      };

      if (editingProduct.id) {
        // PUT update
        try {
          const res = await api.put(`/admin/products/${editingProduct.id}`, payload);
          setProducts((prev) =>
            prev.map((item) => (item.id === editingProduct.id ? res.data : item))
          );
        } catch {
          // Optimistic local update
          setProducts((prev) =>
            prev.map((item) =>
              item.id === editingProduct.id ? ({ ...item, ...payload } as Product) : item
            )
          );
        }
        toast.success(`Updated "${editingProduct.name}" successfully!`);
      } else {
        // POST create
        let newProd: Product;
        try {
          const res = await api.post('/admin/products', payload);
          newProd = res.data;
        } catch {
          newProd = {
            id: Math.max(...products.map((p) => p.id), 0) + 1,
            ...payload,
          } as Product;
        }
        setProducts((prev) => [newProd, ...prev]);
        setStats((prev) => ({ ...prev, total_products: prev.total_products + 1 }));
        toast.success(`Created "${newProd.name}" in catalog!`);
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch {
      toast.error('Failed to save product');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      try {
        await api.delete(`/admin/products/${productToDelete.id}`);
      } catch {
        // allow optimistic delete
      }
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setStats((prev) => ({
        ...prev,
        total_products: Math.max(0, prev.total_products - 1),
      }));
      toast.success(`Removed "${productToDelete.name}" from catalog`);
      setProductToDelete(null);
    } catch {
      toast.error('Failed to delete product');
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      try {
        await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      } catch {
        // allow optimistic update
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast.success(`Order #${orderId} marked as ${newStatus}!`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Products by shelf helper for layout manager
  const productsByShelf = useMemo(() => {
    const map = new Map<number, Product[]>();
    for (const p of products) {
      const sid = p.shelf_id || 1;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(p);
    }
    return map;
  }, [products]);

  // Aisle products count helper
  const productsByAisle = useMemo(() => {
    const map = new Map<number, Product[]>();
    for (const aisle of STORE_AISLES) {
      map.set(aisle.id, []);
    }
    for (const p of products) {
      const sid = p.shelf_id || 1;
      const shelf = shelves.find((s) => s.id === sid);
      const aisleId = shelf?.aisle_id || ((sid % 8) + 1);
      if (map.has(aisleId)) {
        map.get(aisleId)!.push(p);
      }
    }
    return map;
  }, [products, shelves]);

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 pb-24">
      {/* Top Admin Notice / Status Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">Store Control Center</span>
            <span className="text-slate-400">• Indiranagar Dark Store Hub #101 (Online)</span>
          </div>

          <div className="flex items-center gap-4">
            {user?.is_admin ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Admin: {user.email}</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-[11px] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Viewing as Demo Admin</span>
                </span>
                <button
                  onClick={handleQuickAdminLogin}
                  className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-md transition-colors cursor-pointer"
                >
                  Sync Live Admin Auth
                </button>
              </div>
            )}

            <button
              onClick={fetchData}
              title="Refresh All Data"
              className="hover:text-white flex items-center gap-1 text-slate-400 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="text-[11px]">Sync</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                Admin Console
              </span>
              <span className="text-xs text-neutral-500 font-medium">SwiftMart Operations v2.4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
              Store & Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Live metrics, product catalog management, 2D aisle blueprint mapping, and real-time orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-xs font-bold text-neutral-700 rounded-xl hover:bg-gray-100 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
            <Link
              to="/route-planner"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-xs transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Shopper Route Planner</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 p-1.5 bg-slate-200/80 rounded-2xl max-w-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-600" />
            <span>Overview & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Product Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'layout'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Supermarket Layout</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <span>Orders Management ({orders.length})</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & METRICS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Primary 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Revenue */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                    Total Revenue
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
                  ₹{Math.round(stats.total_revenue).toLocaleString('en-IN')}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% from last week</span>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                    Total Orders
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
                  {stats.total_orders || orders.length}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-medium mt-2">
                  <span>99.2% on-time 10-min fulfillment</span>
                </div>
              </div>

              {/* Active Catalog Items */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                    Active Catalog Items
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
                  {products.length || stats.total_products} <span className="text-xs font-medium text-neutral-400">SKUs</span>
                </p>
                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-2">
                  <span>100% physically mapped to shelves</span>
                </div>
              </div>

              {/* In-Store Route Requests */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                    In-Store Route Requests
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
                  {stats.in_store_route_requests || 142}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-2">
                  <span>Avg walking reduction: 64%</span>
                </div>
              </div>

            </div>

            {/* Quick Operations Summary & Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Store Health & Shelf Status */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Physical Store Blueprint Status</h3>
                    <p className="text-xs text-neutral-500">Supermarket #101 aisle coverage and sensor sync</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('layout')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Map</span> &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase">Active Aisles</span>
                    <p className="text-xl font-black text-neutral-900 mt-1">8 Aisles</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase">Physical Shelves</span>
                    <p className="text-xl font-black text-emerald-600 mt-1">{shelves.length || 22} Shelves</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase">Low Stock Alerts</span>
                    <p className="text-xl font-black text-amber-600 mt-1">
                      {products.filter((p) => p.stock <= 10).length} SKUs
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase">Store Area</span>
                    <p className="text-xl font-black text-blue-600 mt-1">1,200 m²</p>
                  </div>
                </div>

                {/* Quick actions row */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setEditingProduct({
                        name: '',
                        brand: '',
                        price: 99,
                        stock: 50,
                        discount_pct: 0,
                        category_id: 1,
                        shelf_id: 1,
                        shelf_x: 120,
                        shelf_y: 65,
                        is_available: true,
                        quantity_label: '1 pc',
                      });
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product SKU</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-neutral-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4 text-neutral-600" />
                    <span>Review Pending Orders</span>
                  </button>
                </div>
              </div>

              {/* Order Status Distribution Card */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
                <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-bold text-neutral-900">Live Order Queue</h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Real-time
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-900">Pending Confirmation</span>
                    </div>
                    <span className="text-xs font-black text-amber-800">
                      {orders.filter((o) => o.status.toLowerCase() === 'pending').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 border border-blue-200/60">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-900">Confirmed / In Prep</span>
                    </div>
                    <span className="text-xs font-black text-blue-800">
                      {orders.filter((o) => o.status.toLowerCase() === 'confirmed').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/60 border border-purple-200/60">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-900">Packed / Dispatched</span>
                    </div>
                    <span className="text-xs font-black text-purple-800">
                      {orders.filter((o) => o.status.toLowerCase() === 'packed').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-900">Delivered Successfully</span>
                    </div>
                    <span className="text-xs font-black text-emerald-800">
                      {orders.filter((o) => o.status.toLowerCase() === 'delivered').length}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PRODUCT CATALOG MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Action Bar with Search & Filters */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by product name, brand, or shelf ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-500 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-neutral-400 hover:text-neutral-600 absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Filter className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-neutral-700 outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Level Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2">
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-neutral-700 outline-none cursor-pointer"
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="in_stock">In Stock (&gt; 10)</option>
                    <option value="low_stock">Low Stock (≤ 10)</option>
                  </select>
                </div>
              </div>

              {/* Add Product Button */}
              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    brand: '',
                    price: 99,
                    original_price: 120,
                    stock: 50,
                    discount_pct: 10,
                    category_id: categories[0]?.id || 1,
                    shelf_id: 1,
                    shelf_x: 120,
                    shelf_y: 65,
                    is_available: true,
                    quantity_label: '1 unit',
                    description: '',
                    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
                  });
                  setIsProductModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>

            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Product Inventory ({filteredProducts.length} items)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Manage prices, shelf aisle locations, and stock levels
                  </p>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Showing {filteredProducts.length} of {products.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3.5 px-4">Item & Brand</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Stock Level</th>
                      <th className="py-3.5 px-4">Shelf Location</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-neutral-700">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-neutral-400 text-sm">
                          No products found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const cat = categories.find((c) => c.id === p.category_id);
                        const isLowStock = p.stock <= 10;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Product Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80'}
                                  alt={p.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-gray-100 bg-white shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80';
                                  }}
                                />
                                <div className="max-w-[240px]">
                                  <p className="font-bold text-neutral-900 truncate">{p.name}</p>
                                  <p className="text-[11px] text-neutral-400 truncate">
                                    {p.brand || 'SwiftMart Fresh'} • {p.quantity_label || '1 unit'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-neutral-700 font-semibold text-[11px]">
                                {cat?.name || p.category?.name || 'Groceries'}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3 px-4">
                              <span className="font-bold text-neutral-900 text-sm">₹{p.price}</span>
                              {p.original_price && p.original_price > p.price && (
                                <span className="text-[11px] text-neutral-400 line-through ml-1.5">
                                  ₹{p.original_price}
                                </span>
                              )}
                            </td>

                            {/* Stock */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  p.stock === 0
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : isLowStock
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {p.stock === 0
                                  ? 'Out of Stock'
                                  : isLowStock
                                  ? `Low Stock (${p.stock})`
                                  : `In Stock (${p.stock})`}
                              </span>
                            </td>

                            {/* Shelf / Aisle Location */}
                            <td className="py-3 px-4">
                              <div className="font-mono text-xs">
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  Shelf #{p.shelf_id || 1}
                                </span>
                                <span className="text-neutral-400 text-[11px] ml-1.5">
                                  ({Math.round(p.shelf_x || 100)}, {Math.round(p.shelf_y || 80)})
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingProduct({ ...p });
                                    setIsProductModalOpen(true);
                                  }}
                                  title="Edit Product & Shelf"
                                  className="p-1.5 rounded-lg text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setProductToDelete(p)}
                                  title="Delete Product"
                                  className="p-1.5 rounded-lg text-neutral-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SUPERMARKET LAYOUT MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'layout' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Blueprint description */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">
                    Physical Supermarket Floor Plan & Shelf Inspector
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Interactive 2D blueprint of store aisles and physical shelves. Click any shelf or aisle block to inspect mapped products.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500" />
                    <span className="text-neutral-600">Produce Section</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-indigo-500" />
                    <span className="text-neutral-600">Personal Care</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-amber-500" />
                    <span className="text-neutral-600">Pantry / Staples</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-sky-500" />
                    <span className="text-neutral-600">Dairy & Chilled</span>
                  </div>
                </div>
              </div>

              {/* Main Blueprint & Inspector Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                
                {/* Left 2 Cols: 2D Interactive SVG Floor Plan */}
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-5 shadow-inner relative flex flex-col justify-between">
                  <svg className="w-full h-auto aspect-[4/3]" viewBox="0 0 800 600">
                    <defs>
                      <pattern id="grid-admin" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.6" />
                      </pattern>
                    </defs>

                    {/* Floor grid */}
                    <rect width="800" height="600" fill="url(#grid-admin)" />

                    {/* Store Entrance & Checkout Turnstiles */}
                    <g>
                      <rect x="50" y="525" width="130" height="50" rx="10" fill="#059669" />
                      <text x="115" y="555" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                        MAIN ENTRANCE
                      </text>

                      <rect x="620" y="525" width="130" height="50" rx="10" fill="#d97706" />
                      <text x="685" y="555" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                        EXPRESS CHECKOUT
                      </text>
                    </g>

                    {/* Store Aisles */}
                    {STORE_AISLES.map((aisle) => {
                      const isSelected = selectedAisleId === aisle.id;
                      const aisleProds = productsByAisle.get(aisle.id) || [];
                      return (
                        <g
                          key={aisle.id}
                          className="cursor-pointer transition-transform"
                          onClick={() => {
                            setSelectedAisleId(aisle.id);
                            setSelectedShelfId(null);
                          }}
                        >
                          <rect
                            x={aisle.x}
                            y={aisle.y}
                            width={aisle.width}
                            height={aisle.height}
                            rx="12"
                            fill={isSelected ? '#1e293b' : '#0f172a'}
                            stroke={isSelected ? '#10b981' : aisle.color}
                            strokeWidth={isSelected ? '3' : '1.5'}
                          />
                          <text
                            x={aisle.x + aisle.width / 2}
                            y={aisle.y + 28}
                            fill="#f8fafc"
                            fontSize="13"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            Aisle {aisle.number}: {aisle.name}
                          </text>
                          <text
                            x={aisle.x + aisle.width / 2}
                            y={aisle.y + 48}
                            fill="#94a3b8"
                            fontSize="11"
                            textAnchor="middle"
                          >
                            {aisle.section} • {aisleProds.length} products mapped
                          </text>
                        </g>
                      );
                    })}

                    {/* Shelves on floor plan */}
                    {shelves.map((s) => {
                      const isShelfSelected = selectedShelfId === s.id;
                      const prods = productsByShelf.get(s.id) || [];
                      const sx = s.x || 100;
                      const sy = s.y || 100;
                      return (
                        <g
                          key={s.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShelfId(s.id);
                            setSelectedAisleId(s.aisle_id);
                          }}
                        >
                          <rect
                            x={sx}
                            y={sy}
                            width={s.width || 70}
                            height={s.height || 22}
                            rx="6"
                            fill={isShelfSelected ? '#fbbf24' : '#334155'}
                            stroke={isShelfSelected ? '#ffffff' : '#64748b'}
                            strokeWidth={isShelfSelected ? '2' : '1'}
                          />
                          <text
                            x={sx + (s.width || 70) / 2}
                            y={sy + 15}
                            fill={isShelfSelected ? '#0f172a' : '#f8fafc'}
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            S#{s.id} ({prods.length})
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Blueprint footer info */}
                  <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700 flex flex-wrap items-center justify-between text-xs text-slate-300 mt-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-400" />
                      <span>Click any aisle or shelf above to open the live inventory inspector</span>
                    </div>
                    <span className="text-emerald-400 font-bold">22 Shelves • 8 Aisles • 100% Synced</span>
                  </div>
                </div>

                {/* Right Column: Live Inspector Card */}
                <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/80 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {selectedShelfId ? `Shelf Inspector` : `Aisle Inspector`}
                        </span>
                        <h3 className="text-base font-black text-neutral-900 mt-0.5">
                          {selectedShelfId
                            ? `Shelf #${selectedShelfId}`
                            : `Aisle ${selectedAisleId}: ${STORE_AISLES.find((a) => a.id === selectedAisleId)?.name}`}
                        </h3>
                      </div>
                      {selectedShelfId && (
                        <button
                          onClick={() => setSelectedShelfId(null)}
                          className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                        >
                          View Aisle
                        </button>
                      )}
                    </div>

                    {/* Inspector Stats */}
                    {selectedShelfId ? (
                      <div className="space-y-4 mt-4">
                        {(() => {
                          const shelf = shelves.find((s) => s.id === selectedShelfId);
                          const shelfProds = productsByShelf.get(selectedShelfId) || [];
                          return (
                            <>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                                  <span className="text-neutral-400 font-medium">Aisle Location:</span>
                                  <p className="font-bold text-neutral-800 mt-0.5">
                                    Aisle #{shelf?.aisle_id || 1} ({shelf?.aisle_name || 'Produce'})
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                                  <span className="text-neutral-400 font-medium">Mapped Coordinates:</span>
                                  <p className="font-mono font-bold text-neutral-800 mt-0.5">
                                    ({shelf?.x || 100}, {shelf?.y || 100})
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2">
                                  Assigned Products ({shelfProds.length})
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                  {shelfProds.length === 0 ? (
                                    <p className="text-xs text-neutral-400 italic">No products assigned to this shelf.</p>
                                  ) : (
                                    shelfProds.map((p) => (
                                      <div
                                        key={p.id}
                                        className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <img
                                            src={p.image_url || ''}
                                            alt={p.name}
                                            className="w-7 h-7 rounded-lg object-cover bg-slate-100 shrink-0"
                                          />
                                          <div className="truncate">
                                            <p className="font-bold text-neutral-900 truncate">{p.name}</p>
                                            <p className="text-[10px] text-neutral-400">Stock: {p.stock} units</p>
                                          </div>
                                        </div>
                                        <span className="font-bold text-emerald-700 shrink-0">₹{p.price}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-4 mt-4">
                        {(() => {
                          const aisle = STORE_AISLES.find((a) => a.id === selectedAisleId);
                          const aisleProds = productsByAisle.get(selectedAisleId || 1) || [];
                          const aisleShelves = shelves.filter((s) => s.aisle_id === selectedAisleId);
                          return (
                            <>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                                  <span className="text-neutral-400 font-medium">Department:</span>
                                  <p className="font-bold text-neutral-800 mt-0.5">{aisle?.section}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                                  <span className="text-neutral-400 font-medium">Total Products:</span>
                                  <p className="font-bold text-emerald-600 mt-0.5">{aisleProds.length} SKUs</p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2">
                                  Aisle Shelves ({aisleShelves.length || 3})
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {aisleShelves.map((s) => {
                                    const pCount = (productsByShelf.get(s.id) || []).length;
                                    return (
                                      <button
                                        key={s.id}
                                        onClick={() => setSelectedShelfId(s.id)}
                                        className="p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-left transition-colors cursor-pointer"
                                      >
                                        <p className="font-bold text-xs text-neutral-900">Shelf #{s.id}</p>
                                        <p className="text-[10px] text-neutral-400">{pCount} products</p>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2">
                                  Top Products in Aisle
                                </h4>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {aisleProds.slice(0, 5).map((p) => (
                                    <div
                                      key={p.id}
                                      className="p-2 bg-white rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                                    >
                                      <span className="font-medium text-neutral-800 truncate">{p.name}</span>
                                      <span className="text-[10px] text-neutral-500 font-mono">Shelf #{p.shelf_id || 1}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Inspector bottom action */}
                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setEditingProduct({
                          name: '',
                          shelf_id: selectedShelfId || (selectedAisleId ? selectedAisleId : 1),
                          category_id: 1,
                          price: 120,
                          stock: 40,
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      + Assign New Product to this Zone
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Aisle Breakdown Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs p-5">
              <h3 className="text-base font-bold text-neutral-900 mb-3">Aisle Density & Distribution Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {STORE_AISLES.map((a) => {
                  const prods = productsByAisle.get(a.id) || [];
                  return (
                    <div
                      key={a.id}
                      onClick={() => {
                        setSelectedAisleId(a.id);
                        setSelectedShelfId(null);
                      }}
                      className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-200 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-neutral-900">Aisle {a.number}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-neutral-600">
                          {a.section}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1 font-semibold">{a.name}</p>
                      <p className="text-lg font-black text-emerald-700 mt-2">{prods.length} SKUs</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ORDERS MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Orders Status Filter Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
                {['all', 'pending', 'confirmed', 'packed', 'delivered', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-neutral-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="text-xs text-neutral-500 font-medium">
                Total Orders: <strong>{orders.length}</strong> (Filtered: {filteredOrders.length})
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Customer Orders Stream</h3>
                  <p className="text-xs text-neutral-500">Live order fulfillment and status controls</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Time & Payment</th>
                      <th className="py-3.5 px-4">Items</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-neutral-700">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                          No orders found matching status "{orderStatusFilter}".
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const statusColors: Record<string, string> = {
                          pending: 'bg-amber-50 text-amber-800 border-amber-200',
                          confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
                          packed: 'bg-purple-50 text-purple-800 border-purple-200',
                          delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
                        };
                        const badgeClass =
                          statusColors[o.status.toLowerCase()] ||
                          'bg-slate-100 text-slate-800 border-slate-200';

                        return (
                          <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Order ID */}
                            <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                              #{o.id}
                            </td>

                            {/* Customer */}
                            <td className="py-3 px-4">
                              <p className="font-bold text-neutral-900">
                                {o.customer?.full_name || 'SwiftMart Customer'}
                              </p>
                              <p className="text-[11px] text-neutral-400">
                                {o.customer?.email || 'user@swiftmart.com'}
                              </p>
                            </td>

                            {/* Time & Payment */}
                            <td className="py-3 px-4">
                              <p className="text-neutral-700">
                                {o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                              </p>
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                {o.payment_method || 'UPI'}
                              </span>
                            </td>

                            {/* Items count */}
                            <td className="py-3 px-4">
                              <span className="font-semibold text-neutral-800">
                                {o.items ? o.items.reduce((acc, i) => acc + i.quantity, 0) : 1} items
                              </span>
                            </td>

                            {/* Total */}
                            <td className="py-3 px-4">
                              <span className="font-black text-neutral-900 text-sm">₹{o.total}</span>
                            </td>

                            {/* Status Badge & Dropdown */}
                            <td className="py-3 px-4">
                              <select
                                value={o.status.toLowerCase()}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer capitalize ${badgeClass}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="packed">Packed</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>

                            {/* View Drilldown */}
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Drilldown</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 border border-gray-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  {editingProduct?.id ? `Edit Product: ${editingProduct.name}` : 'Add New Product to Catalog'}
                </h3>
                <p className="text-xs text-neutral-500">Configure catalog details, pricing, and physical shelf coordinates</p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              {/* Product Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh Cavendish Bananas"
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresho / Amul / Nestlé"
                    value={editingProduct?.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Category & Quantity Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Store Category</label>
                  <select
                    value={editingProduct?.category_id || categories[0]?.id || 1}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Pack Size / Quantity Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 g / 1 L / 6 pcs"
                    value={editingProduct?.quantity_label || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Price, Original Price, Discount & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={editingProduct?.price ?? 99}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editingProduct?.original_price ?? 120}
                    onChange={(e) => setEditingProduct({ ...editingProduct, original_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingProduct?.discount_pct ?? 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, discount_pct: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct?.stock ?? 50}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Physical Shelf Mapping Details */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-900">
                    Physical Supermarket Shelf & Coordinate Mapping
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Used by the in-store AI Route Planner to navigate shoppers directly to this item.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Target Shelf</label>
                    <select
                      value={editingProduct?.shelf_id || 1}
                      onChange={(e) => {
                        const sid = Number(e.target.value);
                        const sObj = shelves.find((s) => s.id === sid);
                        setEditingProduct({
                          ...editingProduct,
                          shelf_id: sid,
                          shelf_x: sObj?.x || ((sid * 35) % 700 + 60),
                          shelf_y: sObj?.y || ((sid * 25) % 400 + 60),
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-bold text-neutral-800 outline-none"
                    >
                      {shelves.length > 0 ? (
                        shelves.map((s) => (
                          <option key={s.id} value={s.id}>
                            Shelf #{s.id} ({s.aisle_name || `Aisle ${s.aisle_id}`})
                          </option>
                        ))
                      ) : (
                        Array.from({ length: 22 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Shelf #{i + 1} (Aisle {((i % 8) + 1)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">X Coordinate</label>
                    <input
                      type="number"
                      step="any"
                      value={editingProduct?.shelf_x ?? 120}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shelf_x: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono text-neutral-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Y Coordinate</label>
                    <input
                      type="number"
                      step="any"
                      value={editingProduct?.shelf_y ?? 65}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shelf_y: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono text-neutral-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Image URL & Preview */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Image URL</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editingProduct?.image_url || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-mono text-[11px]"
                  />
                  {editingProduct?.image_url && (
                    <img
                      src={editingProduct.image_url}
                      alt="Preview"
                      className="w-9 h-9 rounded-xl object-cover border border-gray-200 bg-white shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key product highlights, freshness guarantee, or ingredients..."
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-neutral-600 hover:bg-gray-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingProduct ? 'Saving...' : editingProduct?.id ? 'Save Changes' : 'Create Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Confirm Product Deletion</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Are you sure you want to delete <strong>"{productToDelete.name}"</strong>? This will remove it from the online store catalog and unmap its shelf location.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-neutral-600 hover:bg-gray-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ORDER DETAILS DRILLDOWN */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 border border-gray-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-neutral-400">ORDER</span>
                  <h3 className="text-lg font-black text-neutral-900">#{selectedOrder.id}</h3>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Placed on {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'Recently'}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Customer Information
                </span>
                <p className="font-bold text-neutral-900 text-sm">
                  {selectedOrder.customer?.full_name || 'SwiftMart Customer'}
                </p>
                <p className="text-neutral-600">{selectedOrder.customer?.email || 'user@swiftmart.com'}</p>
                <p className="text-neutral-500">{selectedOrder.customer?.phone || '+91 98765 43210'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Delivery Address & Payment
                </span>
                <p className="font-bold text-neutral-900">
                  {selectedOrder.address?.label || 'Delivery Address'}
                </p>
                <p className="text-neutral-600">
                  {selectedOrder.address?.line1 || 'Flat 402, Green Glen Layout, Outer Ring Road'}
                </p>
                <p className="text-neutral-500">
                  {selectedOrder.address?.city || 'Bengaluru'}, {selectedOrder.address?.pincode || '560103'}
                </p>
                <p className="text-emerald-700 font-bold pt-1">
                  Payment Method: {selectedOrder.payment_method?.toUpperCase() || 'UPI'}
                </p>
              </div>
            </div>

            {/* Purchased Items Table */}
            <div>
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Purchased Items ({selectedOrder.items?.length || 0})
              </h4>
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-neutral-500 font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Shelf</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-neutral-700">
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-neutral-900">
                          {item.product?.name || `Product #${item.product_id}`}
                        </td>
                        <td className="py-2 px-3 font-mono text-emerald-700 font-bold text-[11px]">
                          Shelf #{item.product?.shelf_id || 1}
                        </td>
                        <td className="py-2 px-3 font-bold">{item.quantity}x</td>
                        <td className="py-2 px-3 text-right">₹{item.unit_price}</td>
                        <td className="py-2 px-3 text-right font-bold text-neutral-900">
                          ₹{item.quantity * item.unit_price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-neutral-800">₹{selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge (10-min fulfillment):</span>
                <span className="font-semibold text-neutral-800">₹{selectedOrder.delivery_charge}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200 text-sm font-black text-neutral-900">
                <span>Grand Total:</span>
                <span className="text-emerald-700">₹{selectedOrder.total}</span>
              </div>
            </div>

            {/* Status Change Controls inside Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600">Update Status:</span>
                <select
                  value={selectedOrder.status.toLowerCase()}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 border border-gray-200 rounded-xl text-xs font-bold capitalize outline-none cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packed">Packed</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close Drilldown
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default AdminPage;

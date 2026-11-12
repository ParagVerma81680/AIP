import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Compass, 
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import type { Order } from '../types';
import toast from 'react-hot-toast';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  const { addItem } = useCartStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleReorder = async (order: Order) => {
    for (const item of order.items) {
      if (item.product) {
        await addItem(item.product, item.quantity);
      }
    }
    toast.success('Items added to cart!');
    navigate('/catalog');
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Order Confirmed</span>;
      case 'preparing':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Packing Order</span>;
      case 'out_for_delivery':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Out for Delivery</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">Delivered</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">Sign in to view your orders</h2>
          <p className="text-xs text-neutral-500">
            Track real-time dark-store fulfillment, access past receipts, or reorder favorite items in one click.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Your Orders</h1>
            <p className="text-xs text-neutral-500 mt-1">Live tracking and order history</p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 text-neutral-500 hover:text-emerald-600 hover:bg-white rounded-xl transition-all cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse p-6" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="min-h-[300px] bg-white rounded-3xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">No orders yet</h3>
            <p className="text-xs text-neutral-500 max-w-xs">
              When you place an order, you will be able to track live delivery progress here.
            </p>
            <Link
              to="/catalog"
              className="mt-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4 hover:border-gray-200 transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-neutral-700 flex items-center justify-center font-black text-sm">
                      #{order.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900">
                          Order #{order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : 'Just now'} • {order.payment_method?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-neutral-500">Total Paid: </span>
                    <span className="text-base font-black text-neutral-900">₹{Math.round(order.total)}</span>
                  </div>
                </div>

                {/* Progress Steps Visualizer */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 relative">
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                      <span className="text-[10px] text-neutral-600">Confirmed</span>
                    </div>

                    <div className="flex-1 h-0.5 bg-emerald-400 mx-2" />

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                      <span className="text-[10px] text-neutral-600">Packing</span>
                    </div>

                    <div className="flex-1 h-0.5 bg-gray-200 mx-2" />

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-6 h-6 rounded-full bg-gray-200 text-neutral-500 flex items-center justify-center text-xs">
                        3
                      </div>
                      <span className="text-[10px] text-neutral-400">On the way</span>
                    </div>

                    <div className="flex-1 h-0.5 bg-gray-200 mx-2" />

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-6 h-6 rounded-full bg-gray-200 text-neutral-500 flex items-center justify-center text-xs">
                        4
                      </div>
                      <span className="text-[10px] text-neutral-400">Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Order items list */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Items in this order:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/70">
                        <div className="w-10 h-10 rounded-lg bg-white p-1 shrink-0 border border-gray-100 flex items-center justify-center">
                          <img
                            src={item.product?.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-semibold text-neutral-900 truncate">{item.product?.name}</p>
                          <p className="text-[11px] text-neutral-500">
                            {item.quantity} x ₹{Math.round(item.unit_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <Link
                    to="/route-planner"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Store Route for these items</span>
                  </Link>

                  <button
                    onClick={() => handleReorder(order)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reorder All</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

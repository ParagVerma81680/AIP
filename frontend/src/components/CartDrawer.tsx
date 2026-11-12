import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Compass, 
  Truck,
  Sparkles
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items, 
    isCartOpen, 
    closeCart, 
    addItem, 
    removeItem, 
    getSubtotal, 
    getDeliveryCharge, 
    getTotal, 
    getFreeDeliveryRemaining,
    clearCart
  } = useCartStore();

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const deliveryCharge = getDeliveryCharge();
  const total = getTotal();
  const freeDeliveryRemaining = getFreeDeliveryRemaining();

  const handleProceedToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handlePlanRoute = () => {
    closeCart();
    navigate('/route-planner');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 leading-tight">My Cart</h2>
              <p className="text-xs text-neutral-500">
                {items.length === 0 ? 'Empty' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-neutral-400 hover:text-red-500 font-medium px-2 py-1 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Delivery Bar */}
        {items.length > 0 && (
          <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center gap-2 text-xs">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            {freeDeliveryRemaining > 0 ? (
              <p className="text-emerald-900">
                Add items worth <span className="font-bold text-emerald-700">₹{Math.round(freeDeliveryRemaining)}</span> for <strong>FREE delivery</strong>
              </p>
            ) : (
              <p className="text-emerald-800 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Yay! You unlocked FREE 10-min delivery
              </p>
            )}
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 opacity-60" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-800">Your cart is empty</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-[220px]">
                  Explore farm fresh veggies, dairy, snacks and daily essentials.
                </p>
              </div>
              <button
                onClick={() => {
                  closeCart();
                  navigate('/catalog');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  <img
                    src={item.product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                    alt={item.product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-neutral-800 truncate leading-snug">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    {item.product.quantity_label || '1 unit'}
                  </p>
                  <div className="text-xs font-bold text-neutral-900 mt-1">
                    ₹{Math.round(item.product.price * item.quantity)}
                    <span className="text-[10px] text-neutral-400 font-normal ml-1">
                      (₹{Math.round(item.product.price)} each)
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center bg-emerald-600 text-white rounded-lg shadow-2xs font-semibold text-xs overflow-hidden shrink-0">
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="px-2 py-1.5 hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </button>
                  <span className="px-2 text-xs font-bold min-w-[18px] text-center select-none">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => addItem(item.product)}
                    className="px-2 py-1.5 hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/80 space-y-3">
            
            {/* Shortcut: In-Store Route Planner Callout */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-amber-900 leading-tight">
                    Shopping at the store?
                  </span>
                  <span className="text-[11px] text-amber-700 leading-tight">
                    Get quickest walking route for these {items.length} items
                  </span>
                </div>
              </div>
              <button
                onClick={handlePlanRoute}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                Plan Route
              </button>
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>₹{Math.round(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span className="flex items-center gap-1">
                  Delivery Partner Fee
                  {deliveryCharge === 0 && <span className="text-[10px] text-emerald-600 font-bold uppercase">(Free)</span>}
                </span>
                <span>{deliveryCharge === 0 ? <span className="line-through text-neutral-400">₹40</span> : `₹${deliveryCharge}`}</span>
              </div>
              <div className="border-t border-gray-100 pt-1.5 flex justify-between font-bold text-sm text-neutral-900">
                <span>Total to Pay</span>
                <span>₹{Math.round(total)}</span>
              </div>
            </div>

            {/* Proceed to Checkout Button */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-between active:scale-98 cursor-pointer"
            >
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs text-emerald-200">Total ₹{Math.round(total)}</span>
                <span>Proceed to Pay</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold">Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

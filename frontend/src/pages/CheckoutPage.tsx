import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, addresses, fetchAddresses, addAddress, openAuthModal } = useAuthStore();
  const { items, getSubtotal, getDeliveryCharge, getTotal, clearCart } = useCartStore();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('upi');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newLine1, setNewLine1] = useState('');
  const [newLine2, setNewLine2] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newState] = useState('Karnataka');
  const [newPincode, setNewPincode] = useState('560038');

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId === null) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses]);

  const subtotal = getSubtotal();
  const deliveryCharge = getDeliveryCharge();
  const total = getTotal();

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine1 || !newCity) {
      toast.error('Please enter street address and city');
      return;
    }
    try {
      const created = await addAddress({
        label: newLabel,
        line1: newLine1,
        line2: newLine2 || undefined,
        city: newCity,
        state: newState,
        pincode: newPincode,
        is_default: addresses.length === 0,
      });
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
      setNewLine1('');
      setNewLine2('');
      toast.success('Address added!');
    } catch (err: any) {
      toast.error('Failed to add address: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place your order.');
      openAuthModal('login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/catalog');
      return;
    }

    setIsSubmitting(true);
    try {
      // First ensure cart is synced to backend if it's currently only in local state
      for (const it of items) {
        try {
          await api.post('/cart/items', { product_id: it.product_id, quantity: it.quantity });
        } catch {
          // ignore duplicate
        }
      }

      const res = await api.post('/orders', {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        notes: orderNotes || undefined,
      });

      const orderData = res.data;
      setOrderSuccess(orderData);
      await clearCart();
      toast.success('Order placed successfully! ⚡');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-xl text-center border border-gray-100 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900">Order Placed Successfully!</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Order <span className="font-bold text-neutral-800">#{orderSuccess.id}</span> is confirmed and being packed at your local SwiftMart hub.
          </p>

          <div className="my-6 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950 pb-2 border-b border-emerald-200/50">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" /> Estimated Delivery:
              </span>
              <span className="text-emerald-700">10 - 14 Mins</span>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs text-emerald-900">
              <span>Amount Paid ({orderSuccess.payment_method?.toUpperCase()}):</span>
              <span className="font-extrabold text-sm">₹{Math.round(orderSuccess.total)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/orders"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98"
            >
              Track Live Order
            </Link>
            <Link
              to="/catalog"
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-neutral-800 font-bold text-xs rounded-xl transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-emerald-600 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping</span>
        </button>

        <h1 className="text-2xl font-black text-neutral-900 tracking-tight mb-8">
          Checkout & Delivery
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Checkout Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: User / Login prompt if not signed in */}
            {!user && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-amber-900">You are checking out as Guest</h3>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Sign in to save addresses, track order progress, and earn loyalty points!
                  </p>
                </div>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Step 2: Delivery Address */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">Delivery Address</h3>
                </div>

                {user && !showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {/* Saved Addresses list */}
              {user && addresses.length > 0 && !showAddressForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-neutral-800">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-[10px] bg-gray-100 text-neutral-600 px-1.5 py-0.5 rounded font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {addr.line1}, {addr.city} {addr.pincode}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Address Form */}
              {(showAddressForm || (user && addresses.length === 0)) && (
                <form onSubmit={handleAddNewAddress} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-800">Add New Address</span>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="text-xs text-neutral-400 hover:text-neutral-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Home', 'Work', 'Other'].map((lbl) => (
                      <button
                        type="button"
                        key={lbl}
                        onClick={() => setNewLabel(lbl)}
                        className={`py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                          newLabel === lbl ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-neutral-700 border-gray-200'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="House / Flat / Block No., Street"
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Apartment name, Landmark (Optional)"
                    value={newLine2}
                    onChange={(e) => setNewLine2(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City (e.g. Bengaluru)"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Pincode (e.g. 560038)"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 cursor-pointer"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {!user && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-neutral-600">
                  <p className="font-semibold text-neutral-800">Delivering to default local address:</p>
                  <p>102, Green Glen Layout, Bellandur, Bengaluru - 560103</p>
                </div>
              )}
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-base font-bold text-neutral-900">Select Payment Method</h3>
              </div>

              <div className="space-y-2.5">
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      UPI
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">UPI Instant Pay (GPay / PhonePe / Paytm)</p>
                      <p className="text-[11px] text-neutral-500">Fastest checkout experience (Test Mode enabled)</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-neutral-500">Pay cash or UPI upon delivery</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Credit / Debit Card</p>
                      <p className="text-[11px] text-neutral-500">Visa, Mastercard, RuPay (Test Mode)</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>

              {/* Delivery Instructions / Notes */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Delivery instructions (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring the doorbell, leave at the door..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-neutral-900 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-neutral-900">Order Summary</h3>

              {/* Item thumbnails list */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-[180px]">
                      <span className="font-bold text-emerald-600">{item.quantity}x</span>
                      <span className="text-neutral-800 truncate">{item.product.name}</span>
                    </div>
                    <span className="font-semibold text-neutral-900">
                      ₹{Math.round(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>₹{Math.round(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Partner Fee</span>
                  <span>{deliveryCharge === 0 ? <span className="text-emerald-600 font-bold uppercase">FREE</span> : `₹${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Estimated Delivery Time</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 10-15 mins
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-extrabold text-base text-neutral-900">
                  <span>Total Amount</span>
                  <span>₹{Math.round(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Place Order • ₹{Math.round(total)}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 font-medium pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Safe & Secure Checkout</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

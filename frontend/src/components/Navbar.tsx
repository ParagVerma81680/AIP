import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ShoppingCart, 
  User as UserIcon, 
  Sparkles, 
  ChevronDown, 
  LogOut, 
  Package, 
  Navigation,
  Compass,
  LayoutDashboard
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useAIStore } from '../store/useAIStore';
import { api } from '../lib/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, openAuthModal, logout } = useAuthStore();
  const { getTotalItemsCount, getSubtotal, openCart } = useCartStore();
  const { openChat } = useAIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const itemsCount = getTotalItemsCount();
  const subtotal = getSubtotal();

  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions(res.data.suggestions || []);
      } catch {
        // ignore
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/catalog?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-emerald-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>Try our new <strong>AI Supermarket Route Planner</strong> — Navigate physical store shelves 3x faster!</span>
        <Link to="/route-planner" className="underline font-bold text-amber-200 hover:text-white transition-colors ml-1">
          Try Now &rarr;
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3 sm:gap-6">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-2xl font-black">⚡</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-neutral-900 group-hover:text-emerald-600 transition-colors">
                Swift<span className="text-emerald-600">Mart</span>
              </span>
              <span className="text-[10px] text-amber-600 font-bold tracking-wider -mt-1 uppercase">
                10 Mins Delivery
              </span>
            </div>
          </Link>

          {/* Location Picker */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors max-w-[210px]">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex flex-col text-left truncate">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                Deliver to Home <ChevronDown className="w-3 h-3 text-neutral-400" />
              </span>
              <span className="text-[11px] text-neutral-500 truncate">
                Indiranagar, Bengaluru
              </span>
            </div>
          </div>

          {/* Search Bar with live autocomplete */}
          <div ref={searchRef} className="flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder='Search "milk", "lays chips", "avocado", "shampoo"...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-neutral-900 placeholder-neutral-400 text-sm rounded-xl pl-10 pr-10 py-2.5 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in duration-150">
                <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Shopper Assistant Button */}
          <button
            type="button"
            onClick={() => openChat()}
            className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <div className="flex flex-col text-left leading-tight">
              <span>Ask AI Shopper</span>
              <span className="text-[10px] text-emerald-600 font-medium">Find Shelf / Kits</span>
            </div>
          </button>

          {/* AI Route Planner Button */}
          <Link
            to="/route-planner"
            className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 group relative overflow-hidden"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-ping absolute top-2 right-2" />
            <Compass className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
            <div className="flex flex-col text-left leading-tight">
              <span>Smart Store Route</span>
              <span className="text-[10px] text-amber-100 font-normal">Plan Aisle Walk</span>
            </div>
          </Link>

          {/* Actions: Auth & Cart */}
          <div className="flex items-center gap-3">
            {/* User Account */}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl text-neutral-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold max-w-[100px] truncate">
                    {user.full_name || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-neutral-800 truncate">{user.full_name || 'User'}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-neutral-400" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      to="/route-planner"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Navigation className="w-4 h-4 text-emerald-500" />
                      <span>Store Route Planner</span>
                    </Link>
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-800 hover:text-emerald-600 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-neutral-600" />
                <span>Login</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {itemsCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[10px] font-medium text-emerald-100">
                  {itemsCount === 0 ? 'My Cart' : `${itemsCount} items`}
                </span>
                <span className="text-xs font-bold">
                  {itemsCount === 0 ? '₹0' : `₹${Math.round(subtotal)}`}
                </span>
              </div>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

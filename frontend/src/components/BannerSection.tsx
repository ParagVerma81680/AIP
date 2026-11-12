import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, Zap, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export const BannerSection: React.FC = () => {
  return (
    <div className="py-6 space-y-6">
      {/* Grid of 2 Hero Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Card: 10 mins delivery promo */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 p-6 sm:p-8 text-white shadow-md flex flex-col justify-between">
          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-3 backdrop-blur-xs">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>LIGHTNING FAST QUICK-COMMERCE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 leading-tight">
              Groceries & Fresh Finds Delivered in <span className="text-amber-300 underline decoration-amber-400">10 Mins</span>
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base mb-6 max-w-md">
              Farm-fresh produce, everyday dairy, cold drinks, and snacks straight to your doorstep.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <span>Shop Catalog Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 text-xs text-emerald-100 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Zero Delivery Fee on ₹500+</span>
              </div>
            </div>
          </div>

          {/* Decorative graphic background */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none flex items-center justify-center">
            <span className="text-[140px] font-black select-none text-emerald-300">⚡</span>
          </div>
        </div>

        {/* Right Card: AI In-Store Route Planner Spotlight */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-6 sm:p-7 text-white shadow-md border border-neutral-700/50 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold mb-3 border border-amber-500/30">
              <Sparkles className="w-3 h-3" />
              <span>PHYSICAL STORE ASSISTANT</span>
            </div>
            <h2 className="text-xl font-black text-white mb-2 leading-tight">
              Shopping In-Store Today?
            </h2>
            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed mb-4">
              Don't wander aisles searching for items. Our AI finds the shortest walking route through physical supermarket shelves!
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-neutral-800/80 rounded-xl p-3 border border-neutral-700 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> Avg. Time Saved</span>
                <span className="font-bold text-emerald-400">22 minutes</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-amber-400" /> Aisle Optimization</span>
                <span className="font-bold text-amber-400">100% Accurate</span>
              </div>
            </div>

            <Link
              to="/route-planner"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Plan Store Route</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

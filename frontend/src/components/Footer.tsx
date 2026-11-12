import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Clock, Compass, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value props */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">10-Minute Delivery</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Superfast dark-store fulfillment directly to your doorstep.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">AI Store Route</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Smart shelf navigation for physical supermarket visits.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Quality Assured</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Handpicked farm produce and 100% genuine products.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Unbeatable Offers</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Everyday low supermarket prices with zero hidden charges.</p>
            </div>
          </div>
        </div>

        {/* Links section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                ⚡
              </div>
              <span className="text-lg font-black tracking-tight text-neutral-900">
                Swift<span className="text-emerald-600">Mart</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              India's smart quick commerce app bridging hyper-fast online delivery and in-store AI aisle routing.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">Categories</h5>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li><Link to="/catalog?category=1" className="hover:text-emerald-600">Fruits & Vegetables</Link></li>
              <li><Link to="/catalog?category=2" className="hover:text-emerald-600">Dairy & Breakfast</Link></li>
              <li><Link to="/catalog?category=3" className="hover:text-emerald-600">Snacks & Beverages</Link></li>
              <li><Link to="/catalog?category=8" className="hover:text-emerald-600">Atta, Rice & Dal</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">Smart Features</h5>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li><Link to="/route-planner" className="hover:text-emerald-600 font-semibold text-emerald-700">AI Store Route Planner</Link></li>
              <li><Link to="/orders" className="hover:text-emerald-600">Live Order Tracking</Link></li>
              <li><Link to="/catalog" className="hover:text-emerald-600">Supermarket Deals</Link></li>
              <li><Link to="/admin" className="hover:text-emerald-600">Store Manager / Admin</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">Support</h5>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li><span className="text-neutral-600 font-medium">Customer Helpdesk</span></li>
              <li><span>support@swiftmart.app</span></li>
              <li><span>Available 6 AM - 12 Midnight</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
          <p>© 2026 SwiftMart Technologies Pvt Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for fast commerce & smart shopping.
          </p>
        </div>

      </div>
    </footer>
  );
};

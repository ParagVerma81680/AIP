import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BannerSection } from '../components/BannerSection';
import { CategoryBar } from '../components/CategoryBar';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import type { Product } from '../types';
import { ArrowRight, Sparkles, Compass, Flame } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dairyProducts, setDairyProducts] = useState<Product[]>([]);
  const [produceProducts, setProduceProducts] = useState<Product[]>([]);
  const [snacksProducts, setSnacksProducts] = useState<Product[]>([]);

  const { getTotalItemsCount, getSubtotal, openCart } = useCartStore();
  const cartItemsCount = getTotalItemsCount();
  const subtotal = getSubtotal();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [featRes, allRes] = await Promise.allSettled([
          api.get('/products/featured'),
          api.get('/products?limit=60'),
        ]);

        if (featRes.status === 'fulfilled' && featRes.value.data) {
          setFeaturedProducts(featRes.value.data);
        }

        if (allRes.status === 'fulfilled' && allRes.value.data) {
          const all: Product[] = allRes.value.data;
          setProduceProducts(all.filter((p) => p.category_id === 1 || p.category?.slug?.includes('fruit') || p.category?.slug?.includes('vegetable')).slice(0, 6));
          setDairyProducts(all.filter((p) => p.category_id === 2 || p.category?.slug?.includes('dairy')).slice(0, 6));
          setSnacksProducts(all.filter((p) => p.category_id === 3 || p.category_id === 4 || p.category?.slug?.includes('snack') || p.category?.slug?.includes('drink')).slice(0, 6));
          
          if (!featRes || featRes.status !== 'fulfilled' || !featRes.value.data.length) {
            setFeaturedProducts(all.slice(0, 8));
          }
        }
      } catch {
        // Fallback or retry
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Category Pills Bar */}
      <CategoryBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Banner Section */}
        <BannerSection />

        {/* Featured Deals / Best Sellers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                <Flame className="w-4 h-4 fill-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">Best Sellers & Top Deals</h2>
                <p className="text-xs text-neutral-500">Highest discounts delivered in 10 mins</p>
              </div>
            </div>
            <Link
              to="/catalog"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {featuredProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* AI Route Planner Spotlight Highlight Card */}
        <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-neutral-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen In-Store Experience</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Physical Supermarket Smart Route Finder
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed mb-6">
              Shopping inside a large supermarket today? Add items to your list or cart, and our AI will calculate the mathematically shortest path through the aisles — complete with shelf coordinates and 2D canvas visualization!
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/route-planner"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>Launch Store Route Planner</span>
              </Link>
              <span className="text-xs text-neutral-300">
                Works offline on mobile inside the store
              </span>
            </div>
          </div>

          <div className="absolute -right-6 -bottom-6 w-56 h-56 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        </section>

        {/* Fruits & Fresh Vegetables */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">Fresh Farm Produce</h2>
              <p className="text-xs text-neutral-500">Crisp greens, seasonal fruits & kitchen staples</p>
            </div>
            <Link
              to="/catalog?category=1"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              <span>See more</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {produceProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Dairy, Bread & Breakfast */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">Dairy, Bread & Eggs</h2>
              <p className="text-xs text-neutral-500">Fresh morning milk, artisan breads, paneer & butter</p>
            </div>
            <Link
              to="/catalog?category=2"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              <span>See more</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {dairyProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Snacks & Drinks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">Snacks, Munchies & Cold Drinks</h2>
              <p className="text-xs text-neutral-500">Chips, namkeen, cold sodas and party essentials</p>
            </div>
            <Link
              to="/catalog?category=3"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              <span>See more</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {snacksProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      {/* Floating mobile cart bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={openCart}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center font-bold text-xs">
                {cartItemsCount}
              </div>
              <div className="text-left">
                <p className="text-[11px] text-emerald-100 leading-tight">Total to pay</p>
                <p className="text-sm font-extrabold leading-tight">₹{Math.round(subtotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

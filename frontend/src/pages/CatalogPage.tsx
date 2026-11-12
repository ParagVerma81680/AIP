import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { CategoryBar } from '../components/CategoryBar';
import { ArrowUpDown, PackageOpen } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount'>('featured');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let url = '/products?limit=100';
        if (categoryParam) {
          url += `&category_id=${categoryParam}`;
        }
        if (queryParam) {
          url += `&q=${encodeURIComponent(queryParam)}`;
        }
        const res = await api.get(url);
        setProducts(res.data);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [categoryParam, queryParam]);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'discount') return b.discount_pct - a.discount_pct;
    return 0; // default order
  });

  const selectedCategory = categories.find((c) => String(c.id) === categoryParam);

  const clearFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CategoryBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Title & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              {queryParam ? (
                <span>Search results for "{queryParam}"</span>
              ) : selectedCategory ? (
                <span>{selectedCategory.name}</span>
              ) : (
                <span>All Products</span>
              )}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Showing {sortedProducts.length} items available for 10-min delivery
            </p>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-neutral-700 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-none font-bold text-neutral-900 cursor-pointer"
              >
                <option value="featured">Featured Deals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>

            {(categoryParam || queryParam) && (
              <button
                onClick={clearFilter}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold px-2 py-1 transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white border border-gray-100 p-4 animate-pulse space-y-3">
                  <div className="h-32 bg-gray-100 rounded-xl" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-gray-100">
              <div className="w-16 h-16 rounded-full bg-gray-100 text-neutral-400 flex items-center justify-center mb-3">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-neutral-800">No items found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                We couldn't find any items matching your selection. Try searching for something else or clearing your filters.
              </p>
              <button
                onClick={clearFilter}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Browse All Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

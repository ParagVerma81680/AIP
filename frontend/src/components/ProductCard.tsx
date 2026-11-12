import React from 'react';
import { Plus, Minus, Zap } from 'lucide-react';
import type { Product } from '../types';
import { useCartStore } from '../store/useCartStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { getItemQuantity, addItem, removeItem } = useCartStore();
  const quantity = getItemQuantity(product.id);

  // Fallback image if product image is missing or broken
  const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 p-3 flex flex-col justify-between relative">
      {/* Top badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        {product.discount_pct > 0 && (
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs tracking-wide">
            {product.discount_pct}% OFF
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 z-10">
        <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
          <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> 10 MINS
        </span>
      </div>

      {/* Product Image */}
      <div className="w-full aspect-square rounded-xl bg-gray-50 flex items-center justify-center p-2 mb-2 overflow-hidden relative">
        <img
          src={product.image_url || fallbackImage}
          alt={product.name}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackImage;
          }}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {product.brand && (
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug mb-1 title-case">
            {product.name}
          </h3>
          <p className="text-xs text-neutral-500 font-medium mb-3">
            {product.quantity_label || '1 unit'}
          </p>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-neutral-900">
                ₹{Math.round(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-neutral-400 line-through">
                  ₹{Math.round(product.original_price)}
                </span>
              )}
            </div>
          </div>

          <div>
            {quantity === 0 ? (
              <button
                onClick={() => addItem(product)}
                className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-600 font-bold text-xs uppercase px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
              >
                <span>ADD</span>
              </button>
            ) : (
              <div className="flex items-center bg-emerald-600 text-white rounded-lg shadow-sm font-semibold text-xs overflow-hidden">
                <button
                  onClick={() => removeItem(product.id)}
                  aria-label="Decrease quantity"
                  className="px-2.5 py-1.5 hover:bg-emerald-700 transition-colors cursor-pointer active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold min-w-[20px] text-center select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => addItem(product)}
                  aria-label="Increase quantity"
                  className="px-2.5 py-1.5 hover:bg-emerald-700 transition-colors cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

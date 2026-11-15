import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Apple, 
  Milk, 
  Cookie, 
  CupSoda, 
  Cake, 
  Soup, 
  Coffee, 
  Wheat, 
  Sparkles, 
  SprayCan,
  Layers
} from 'lucide-react';
import { api } from '../lib/api';
import type { Category } from '../types';

const CATEGORY_ICON_MAP: Record<number, React.ReactNode> = {
  1: <Apple className="w-3.5 h-3.5 text-rose-500" />,
  2: <Milk className="w-3.5 h-3.5 text-blue-500" />,
  3: <Cookie className="w-3.5 h-3.5 text-amber-500" />,
  4: <CupSoda className="w-3.5 h-3.5 text-cyan-500" />,
  5: <Cake className="w-3.5 h-3.5 text-orange-500" />,
  6: <Soup className="w-3.5 h-3.5 text-red-500" />,
  7: <Coffee className="w-3.5 h-3.5 text-amber-700" />,
  8: <Wheat className="w-3.5 h-3.5 text-yellow-600" />,
  9: <Sparkles className="w-3.5 h-3.5 text-purple-500" />,
  10: <SprayCan className="w-3.5 h-3.5 text-emerald-500" />,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Fruits & Veggies', slug: 'fruits-vegetables', icon: '', sort_order: 1 },
  { id: 2, name: 'Dairy & Breakfast', slug: 'dairy-breakfast', icon: '', sort_order: 2 },
  { id: 3, name: 'Snacks & Munchies', slug: 'snacks-munchies', icon: '', sort_order: 3 },
  { id: 4, name: 'Cold Drinks & Juices', slug: 'drinks-juices', icon: '', sort_order: 4 },
  { id: 5, name: 'Bakery & Biscuits', slug: 'bakery-biscuits', icon: '', sort_order: 5 },
  { id: 6, name: 'Instant Food', slug: 'instant-food', icon: '', sort_order: 6 },
  { id: 7, name: 'Tea, Coffee & More', slug: 'tea-coffee', icon: '', sort_order: 7 },
  { id: 8, name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', icon: '', sort_order: 8 },
  { id: 9, name: 'Personal Care', slug: 'personal-care', icon: '', sort_order: 9 },
  { id: 10, name: 'Cleaning & Household', slug: 'household', icon: '', sort_order: 10 },
];

export const CategoryBar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedCategoryId = searchParams.get('category');

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data && res.data.length > 0) {
          setCategories(res.data);
        }
      } catch {
        // Fallback to defaults
      }
    };
    fetchCategories();
  }, []);

  const handleSelectCategory = (categoryId: number) => {
    navigate(`/catalog?category=${categoryId}`);
  };

  return (
    <div className="bg-white border-b border-gray-100 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
          <button
            onClick={() => navigate('/catalog')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              !selectedCategoryId
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-neutral-700 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === String(cat.id);
            const iconElement = CATEGORY_ICON_MAP[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-neutral-700 hover:bg-gray-200'
                }`}
              >
                {iconElement}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

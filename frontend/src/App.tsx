import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { AIChatDrawer } from './components/ai/AIChatDrawer';

import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { RoutePlannerPage } from './pages/RoutePlannerPage';
import { AdminPage } from './pages/AdminPage';

import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

export function App() {
  const { fetchMe } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    fetchMe();
    fetchCart();
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 text-neutral-900 selection:bg-emerald-500 selection:text-white">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '16px',
              background: '#18181b',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
            },
          }}
        />

        {/* Global Navigation */}
        <Navbar />

        {/* Dynamic Page Views */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/route-planner" element={<RoutePlannerPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global Footer */}
        <Footer />

        {/* Global Modals & Slide-overs */}
        <CartDrawer />
        <AuthModal />
        <AIChatDrawer />
      </div>
    </HashRouter>
  );
}

export default App;

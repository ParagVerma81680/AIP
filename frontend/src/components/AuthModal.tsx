import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (authModalTab === 'login') {
        await login(email, password);
        toast.success('Welcome back to SwiftMart!');
      } else {
        await register(email, password, fullName, phone);
        toast.success('Account created successfully!');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    try {
      await login('demo@swiftmart.com', 'password123');
      toast.success('Logged in as Demo User!');
    } catch {
      // If demo user doesn't exist, try registering demo user
      try {
        await register('demo@swiftmart.com', 'password123', 'Demo Customer', '9876543210');
        toast.success('Created & logged into Demo User!');
      } catch (err: any) {
        setError('Demo login error: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white text-2xl font-black mb-2 shadow-md shadow-emerald-500/20">
            ⚡
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-900">
            {authModalTab === 'login' ? 'Welcome Back!' : 'Create SwiftMart Account'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {authModalTab === 'login' 
              ? 'Sign in to track orders, save addresses, and sync your cart.' 
              : 'Join SwiftMart for 10-minute grocery delivery & smart route planning.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setError(null);
              openAuthModal('login');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authModalTab === 'login' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              openAuthModal('register');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authModalTab === 'register' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalTab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 outline-none transition-all"
                  />
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 outline-none transition-all"
                  />
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer mt-2"
          >
            {isLoading ? 'Please wait...' : authModalTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Instant Demo Account One-Click Login</span>
          </button>
        </div>

      </div>
    </div>
  );
};

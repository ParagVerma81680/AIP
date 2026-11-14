import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Sparkles, 
  ShoppingBag, 
  Navigation, 
  Bot, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const { login, register, setGuest, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (activeTab === 'login') {
        await login(email, password);
        toast.success('Welcome back to SwiftMart!');
      } else {
        await register(email, password, fullName, phone);
        toast.success('Account created successfully!');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please check your credentials or try Demo Login.';
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
      // If demo user doesn't exist yet in the database, automatically register it
      try {
        await register('demo@swiftmart.com', 'password123', 'Demo Customer', '9876543210');
        toast.success('Created & logged into Demo User!');
      } catch (err: any) {
        // If backend is unreachable, notify and allow guest fallback
        const msg = err.response?.data?.detail || err.message || 'Backend connection issue';
        setError('Demo login error: ' + msg);
        toast.error('Unable to reach backend. You can continue as Guest to browse.');
      }
    }
  };

  const handleContinueAsGuest = () => {
    setGuest(true);
    toast.success('Browsing as Guest!');
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-950 via-neutral-900 to-black text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Brand Bar */}
      <header className="px-6 py-5 border-b border-white/10 backdrop-blur-md flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-neutral-950 font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            ⚡
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight">
              Swift<span className="text-emerald-400">Mart</span>
            </span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              AIP 2.0 Engine
            </span>
          </div>
        </div>
        
        <button
          onClick={handleContinueAsGuest}
          className="text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-white/10"
        >
          <span>Skip to Storefront</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 sm:my-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Visual highlights & benefits */}
          <div className="lg:col-span-6 space-y-6 text-left hidden sm:block">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Generation Quick Commerce + Physical Store AI</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
              Instant Groceries, <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
                Powered by Intelligent AI
              </span>
            </h1>

            <p className="text-neutral-400 text-sm leading-relaxed max-w-lg">
              Sign in to unlock personalized meal planning, instant grocery delivery in 10 minutes, and our interactive 2D supermarket shelf route finder.
            </p>

            {/* Feature Pills */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AIP Orchestrated Shopper</h4>
                  <p className="text-[11px] text-neutral-400">Groq-powered conversational meal kits, catalog search, and memory.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">2D In-Store Route Navigator</h4>
                  <p className="text-[11px] text-neutral-400">A* shortest path & TSP optimization through physical supermarket aisles.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">10-Minute Lightning Delivery</h4>
                  <p className="text-[11px] text-neutral-400">Farm-fresh produce, dairy, and household essentials to your door.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>JWT Secure Authentication</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Syncs Cart Across Devices</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white text-neutral-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
              
              {/* Card Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white text-2xl font-black mb-2 shadow-md shadow-emerald-500/20">
                  ⚡
                </div>
                <h2 className="text-2xl font-black text-neutral-900">
                  {activeTab === 'login' ? 'Welcome Back!' : 'Create an Account'}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  {activeTab === 'login' 
                    ? 'Please log in to continue to SwiftMart.' 
                    : 'Join SwiftMart for instant delivery and AI store navigation.'}
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveTab('login');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'login' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveTab('register');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'register' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {activeTab === 'register' && (
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
                  {isLoading ? 'Please wait...' : activeTab === 'login' ? 'Sign In to SwiftMart' : 'Create Account'}
                </button>
              </form>

              {/* Instant One-Click Demo Login */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Instant Demo Account One-Click Login</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className="w-full py-2 text-neutral-500 hover:text-neutral-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer hover:bg-gray-50"
                >
                  <span>Continue Browsing as Guest</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-xs text-neutral-500 border-t border-white/5">
        &copy; {new Date().getFullYear()} SwiftMart Inc. AIP Intelligent Grocery Ecosystem. All rights reserved.
      </footer>
    </div>
  );
};

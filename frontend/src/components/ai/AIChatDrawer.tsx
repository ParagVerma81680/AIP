import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Compass,
  MapPin,
  ShoppingCart,
  Plus,
  Check,
  Bot,
  Zap,
} from 'lucide-react';
import { useAIStore } from '../../store/useAIStore';
import { useCartStore } from '../../store/useCartStore';
import type { AIProductInfo } from '../../types';
import toast from 'react-hot-toast';

export const AIChatDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    isOpen,
    isLoading,
    messages,
    activeSuggestions,
    openChat,
    closeChat,
    sendMessage,
    clearChat,
    addAllToCart,
  } = useAIStore();

  const { addItem, getItemQuantity } = useCartStore();
  const [inputText, setInputText] = useState('');
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleAddSingleProduct = async (p: AIProductInfo) => {
    await addItem({
      id: p.id,
      name: p.name,
      brand: p.brand || null,
      price: p.price,
      original_price: p.original_price || null,
      discount_pct: p.discount_pct || 0,
      stock: 100,
      is_available: p.is_available ?? true,
      image_url: p.image_url || null,
      quantity_label: p.quantity_label || '1 unit',
      shelf_id: null,
      shelf_x: p.shelf_x || null,
      shelf_y: p.shelf_y || null,
    });
    setAddedIds((prev) => ({ ...prev, [p.id]: true }));
    toast.success(`Added ${p.name} to cart!`);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  const handleOpenMap = (p?: AIProductInfo) => {
    closeChat();
    if (p) {
      navigate(`/route-planner?focusProductId=${p.id}`);
    } else {
      navigate('/route-planner');
    }
  };

  // Simple Markdown-like renderer for formatted replies
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Header
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-neutral-900 text-sm mt-1">
                {line.replace('### ', '')}
              </h4>
            );
          }

          // Bullet point
          if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
            const bulletText = line.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-emerald-500 font-bold shrink-0">•</span>
                <span>{renderInlineStyles(bulletText)}</span>
              </div>
            );
          }

          // Numbered list item
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-amber-500 font-semibold shrink-0">
                  {line.match(/^\d+\./)?.[0]}
                </span>
                <span>{renderInlineStyles(line.replace(/^\d+\.\s*/, ''))}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (text: string) => {
    // Parse **bold** and *italic*
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-neutral-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-neutral-600">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* FLOATING ACTION TRIGGER (When closed)                         */}
      {/* ------------------------------------------------------------- */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
          {/* Quick Prompt Pill Bubble */}
          <div className="hidden sm:flex items-center gap-2 bg-neutral-900 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-neutral-700/60 animate-bounce duration-1000">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300 font-medium">Ask AI:</span>
            <span className="text-neutral-300">"Where is Amul butter?"</span>
          </div>

          {/* Main Floating Trigger Button */}
          <button
            onClick={() => openChat()}
            aria-label="Ask AI Shopper"
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-full shadow-xl shadow-emerald-900/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-amber-300">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-black tracking-wide uppercase text-amber-300">
                AI Shopper 🤖
              </span>
              <span className="text-[10px] text-emerald-100 font-normal">
                Ask recipes, aisles & routes
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* AI CHAT POPUP DRAWER (When open)                               */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[640px] max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-200">
          
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-neutral-900 p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-neutral-950 font-black shadow-md">
                  <Bot className="w-6 h-6 text-neutral-950" />
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-neutral-900 absolute -bottom-0.5 -right-0.5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight text-white">
                    SwiftMart AI Shopper
                  </h3>
                  <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-400/30">
                    SMART AGENT
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span>Store Navigator & Meal Planner</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={clearChat}
                title="Restart chat"
                className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                title="Close chat"
                className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Banner */}
          <div className="bg-emerald-50 px-3.5 py-1.5 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Ask for meal kits, product aisles, or 2D store routes</span>
            </div>
            <button
              onClick={() => handleOpenMap()}
              className="font-bold underline text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              Store Map &rarr;
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                >
                  {/* Bubble Container */}
                  <div className="flex items-start gap-2 max-w-[92%] sm:max-w-[85%]">
                    {!isUser && (
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl shadow-2xs ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white border border-gray-200/80 text-neutral-800 rounded-bl-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      ) : (
                        renderFormattedContent(msg.content)
                      )}
                    </div>
                  </div>

                  {/* IN-CHAT PRODUCT CARDS (When AI returns products) */}
                  {!isUser && msg.products && msg.products.length > 0 && (
                    <div className="w-full pl-9 space-y-2 mt-1">
                      {/* One-click Add All Banner if multiple items */}
                      {msg.products.length > 1 && (
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 p-2.5 rounded-2xl flex items-center justify-between shadow-xs">
                          <div>
                            <span className="text-xs font-black block text-white">
                              Meal Bundle ({msg.products.length} Items)
                            </span>
                            <span className="text-[11px] text-amber-100">
                              Total: ₹
                              {msg.products.reduce((acc, p) => acc + p.price, 0).toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={() => addAllToCart(msg.products!)}
                            className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <ShoppingCart className="w-3 h-3 text-amber-300" />
                            <span>Add All to Cart</span>
                          </button>
                        </div>
                      )}

                      {/* Product Cards List */}
                      <div className="grid grid-cols-1 gap-2">
                        {msg.products.map((p) => {
                          const inCartQty = getItemQuantity(p.id);
                          const isJustAdded = !!addedIds[p.id];
                          const fallbackImg =
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

                          return (
                            <div
                              key={p.id}
                              className="bg-white rounded-2xl border border-gray-200 p-2.5 flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-300 transition-all"
                            >
                              {/* Product Thumbnail */}
                              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center p-1 shrink-0 overflow-hidden border border-gray-100">
                                <img
                                  src={p.image_url || fallbackImg}
                                  alt={p.name}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = fallbackImg;
                                  }}
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {p.brand && (
                                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider truncate">
                                      {p.brand}
                                    </span>
                                  )}
                                  {p.discount_pct ? (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                      {p.discount_pct}% OFF
                                    </span>
                                  ) : null}
                                </div>
                                <h5 className="text-xs font-bold text-neutral-900 truncate">
                                  {p.name}
                                </h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black text-emerald-700">
                                    ₹{p.price.toFixed(2)}
                                  </span>
                                  {p.quantity_label && (
                                    <span className="text-[10px] text-neutral-500 font-medium">
                                      ({p.quantity_label})
                                    </span>
                                  )}
                                </div>

                                {/* Shelf / Aisle location badge */}
                                {p.aisle_name && (
                                  <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-500 font-medium">
                                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span className="truncate">
                                      {p.aisle_name} {p.shelf_name ? `• ${p.shelf_name}` : ''}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-1 items-end shrink-0">
                                <button
                                  onClick={() => handleAddSingleProduct(p)}
                                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                    isJustAdded
                                      ? 'bg-emerald-600 text-white'
                                      : inCartQty > 0
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  }`}
                                >
                                  {isJustAdded ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>{inCartQty > 0 ? `${inCartQty} in Cart` : 'Add'}</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleOpenMap(p)}
                                  className="text-[10px] font-semibold text-neutral-500 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Compass className="w-2.5 h-2.5 text-amber-500" />
                                  <span>View on Map</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* IN-CHAT ROUTE SUMMARY CARD (When Route is generated) */}
                  {!isUser && msg.routeGenerated && (
                    <div className="w-full pl-9 mt-1">
                      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-3.5 text-white shadow-md space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
                              <Compass className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-extrabold text-white">
                                Store Walking Route Ready
                              </h5>
                              <p className="text-[10px] text-emerald-200">
                                Turnstile &rarr; Aisles &rarr; Express Checkout
                              </p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">
                            Optimized
                          </span>
                        </div>

                        {/* Route Stats */}
                        <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-xl p-2 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-emerald-200 block">Distance</span>
                            <span className="font-bold text-amber-300">
                              {msg.routeSummary?.total_distance || '72'}m
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-200 block">Est. Walk</span>
                            <span className="font-bold text-white">
                              ~{msg.routeSummary?.estimated_minutes || '3'} min
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-200 block">Stops</span>
                            <span className="font-bold text-white">
                              {msg.routeSummary?.stops_count ||
                                msg.products?.length ||
                                '3'} items
                            </span>
                          </div>
                        </div>

                        {/* Launch Store Map Button */}
                        <button
                          onClick={() => handleOpenMap()}
                          className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Compass className="w-4 h-4" />
                          <span>Open Route in Store Map &rarr;</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className="text-[10px] text-neutral-400 px-2">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-2xl rounded-bl-xs text-neutral-600 text-xs flex items-center gap-2">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500">
                    Finding shelf aisles & calculating path...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* QUICK PROMPT CHIPS                                             */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-white border-t border-gray-100 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
            {activeSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-700 border border-gray-200/80 hover:border-emerald-300 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* INPUT BAR                                                     */}
          {/* ------------------------------------------------------------- */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-gray-200/80 flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='Ask "Where is Amul butter?" or "Dinner under ₹300"...'
                disabled={isLoading}
                className="w-full pl-3.5 pr-9 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-50"
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white disabled:text-neutral-400 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

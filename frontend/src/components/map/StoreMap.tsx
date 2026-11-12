import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Check, 
  Navigation2
} from 'lucide-react';
import type { StoreMapData, RouteStop, PathCoord } from '../../types';
import { DEFAULT_STORE_MAP, ENTRANCE_POINT, CHECKOUT_POINT } from './defaultMapData';

export interface StoreMapProps {
  storeMap?: StoreMapData | null;
  stops?: RouteStop[];
  pathCoords?: PathCoord[];
  activeStopIndex?: number;
  completedStopIndices?: number[];
  shopperPosition?: PathCoord | null;
  onStopClick?: (stop: RouteStop, index: number) => void;
  className?: string;
  isNavigating?: boolean;
}

export const StoreMap: React.FC<StoreMapProps> = ({
  storeMap = DEFAULT_STORE_MAP,
  stops = [],
  pathCoords = [],
  activeStopIndex = 0,
  completedStopIndices = [],
  shopperPosition,
  onStopClick,
  className = '',
  isNavigating = false,
}) => {
  const mapData = storeMap || DEFAULT_STORE_MAP;

  // Viewport transforms (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [hoveredShelf, setHoveredShelf] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<{ stop: RouteStop; index: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Number((z - 0.25).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedStop(null);
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Primary button only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan & pinch handlers for mobile
  const touchState = useRef<{ startX: number; startY: number; initialDist: number }>({
    startX: 0,
    startY: 0,
    initialDist: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchState.current.startX = e.touches[0].clientX - pan.x;
      touchState.current.startY = e.touches[0].clientY - pan.y;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchState.current.initialDist = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - touchState.current.startX,
        y: e.touches[0].clientY - touchState.current.startY,
      });
    } else if (e.touches.length === 2 && touchState.current.initialDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchState.current.initialDist;
      if (Math.abs(factor - 1) > 0.05) {
        setZoom((prev) => Math.min(2.5, Math.max(0.6, Number((prev * (factor > 1 ? 1.05 : 0.95)).toFixed(2)))));
        touchState.current.initialDist = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((z) => Math.min(2.5, Math.max(0.6, Number((z + delta).toFixed(2)))));
  };

  // Build SVG path string from coordinates
  const pathDataString = useMemo(() => {
    if (!pathCoords || pathCoords.length < 2) return '';
    return pathCoords.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [pathCoords]);

  // Determine current active shopper marker location
  const currentShopperPos = useMemo(() => {
    if (shopperPosition) return shopperPosition;
    if (stops.length > 0 && activeStopIndex >= 0 && activeStopIndex < stops.length) {
      return { x: stops[activeStopIndex].x, y: stops[activeStopIndex].y };
    }
    return ENTRANCE_POINT;
  }, [shopperPosition, stops, activeStopIndex]);

  // Center on active stop when navigating to it
  useEffect(() => {
    if (isNavigating && stops.length > 0 && activeStopIndex >= 0 && activeStopIndex < stops.length) {
      const targetStop = stops[activeStopIndex];
      setSelectedStop({ stop: targetStop, index: activeStopIndex });
    }
  }, [activeStopIndex, isNavigating, stops]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-[4/3] bg-neutral-900 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden select-none touch-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* SVG Canvas Map */}
      <svg
        className="w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle blueprint grid */}
          <pattern id="store-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1.2" fill="#3f3f46" />
          </pattern>

          {/* Glowing filters */}
          <filter id="glow-route" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-marker" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients */}
          <linearGradient id="entrance-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="checkout-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Dynamic Zoom & Pan Container */}
        <g 
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: '400px 300px', transition: isDragging ? 'none' : 'transform 0.15s ease-out' }}
        >
          {/* Background Grid */}
          <rect width="800" height="600" fill="url(#store-grid)" />

          {/* Store Outer Wall */}
          <rect
            x="40"
            y="25"
            width="720"
            height="550"
            rx="18"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="3"
            strokeDasharray="none"
          />

          {/* Store Sections */}
          {mapData.sections.map((section) => {
            const sx = section.x ?? 60;
            const sy = section.y ?? 40;
            const sw = section.width ?? 200;
            const sh = section.height ?? 100;

            return (
              <g key={`sec-${section.id}`} className="transition-opacity">
                {/* Section Zone Tint */}
                <rect
                  x={sx}
                  y={sy}
                  width={sw}
                  height={sh}
                  rx="14"
                  fill={section.color}
                  fillOpacity="0.12"
                  stroke={section.color}
                  strokeOpacity="0.35"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />

                {/* Section Header Label Tag */}
                <rect
                  x={sx + 10}
                  y={sy - 11}
                  width={Math.min(sw - 20, section.name.length * 8.2 + 20)}
                  height="22"
                  rx="6"
                  fill="#27272a"
                  stroke={section.color}
                  strokeWidth="1"
                />
                <text
                  x={sx + 20}
                  y={sy + 4}
                  fill="#f4f4f5"
                  fontSize="10"
                  fontWeight="bold"
                  letterSpacing="0.5"
                >
                  {section.name.toUpperCase()}
                </text>

                {/* Aisles and Shelves in Section */}
                {section.aisles.map((aisle) => (
                  <g key={`aisle-${aisle.id}`}>
                    {aisle.shelves.map((shelf) => {
                      const shx = shelf.x ?? sx;
                      const shy = shelf.y ?? sy;
                      const shw = shelf.width;
                      const shh = shelf.height;
                      const isHovered = hoveredShelf === shelf.name;

                      return (
                        <g
                          key={`shelf-${shelf.id}`}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredShelf(shelf.name || null)}
                          onMouseLeave={() => setHoveredShelf(null)}
                        >
                          {/* Shelf Shadow */}
                          <rect
                            x={shx + 2}
                            y={shy + 2}
                            width={shw}
                            height={shh}
                            rx="6"
                            fill="#09090b"
                            opacity="0.6"
                          />

                          {/* Shelf Structure Block */}
                          <rect
                            x={shx}
                            y={shy}
                            width={shw}
                            height={shh}
                            rx="6"
                            fill={isHovered ? '#3f3f46' : '#27272a'}
                            stroke={isHovered ? '#38bdf8' : '#52525b'}
                            strokeWidth={isHovered ? '2' : '1.2'}
                            className="transition-colors"
                          />

                          {/* Shelf Rack Lines (3D grocery feel) */}
                          <line
                            x1={shx + 4}
                            y1={shy + shh / 2}
                            x2={shx + shw - 4}
                            y2={shy + shh / 2}
                            stroke="#52525b"
                            strokeWidth="1"
                            strokeDasharray="3 2"
                          />

                          {/* Shelf Label */}
                          <text
                            x={shx + shw / 2}
                            y={shy + shh / 2 + 3.5}
                            fill={isHovered ? '#ffffff' : '#a1a1aa'}
                            fontSize={shw < 70 ? '8.5' : '9.5'}
                            fontWeight="600"
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                          >
                            {shelf.name && shelf.name.length > 14
                              ? `${shelf.name.slice(0, 12)}…`
                              : shelf.name || `Shelf #${shelf.id}`}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                ))}
              </g>
            );
          })}

          {/* Walkable Corridors / Graph Edges */}
          {showCorridors && mapData.edges && mapData.nodes && (
            <g className="transition-opacity opacity-45">
              {mapData.edges.map((edge) => {
                const nodeFrom = mapData.nodes.find((n) => n.id === edge.from_node_id);
                const nodeTo = mapData.nodes.find((n) => n.id === edge.to_node_id);
                if (!nodeFrom || !nodeTo) return null;
                return (
                  <line
                    key={`edge-${edge.id}`}
                    x1={nodeFrom.x}
                    y1={nodeFrom.y}
                    x2={nodeTo.x}
                    y2={nodeTo.y}
                    stroke="#52525b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </g>
          )}

          {/* Entrance Concourse Zone & Marker */}
          <g>
            {/* Entrance Floor Platform */}
            <rect
              x="55"
              y="525"
              width="90"
              height="45"
              rx="10"
              fill="url(#entrance-grad)"
              fillOpacity="0.2"
              stroke="#10B981"
              strokeWidth="1.5"
            />
            {/* Entrance Pulsing Radar Ring */}
            <circle
              cx={ENTRANCE_POINT.x}
              cy={ENTRANCE_POINT.y}
              r="22"
              fill="#10B981"
              opacity="0.25"
              className="animate-ping"
              style={{ transformOrigin: `${ENTRANCE_POINT.x}px ${ENTRANCE_POINT.y}px` }}
            />
            {/* Entrance Pin Base */}
            <circle
              cx={ENTRANCE_POINT.x}
              cy={ENTRANCE_POINT.y}
              r="12"
              fill="url(#entrance-grad)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x={ENTRANCE_POINT.x}
              y={ENTRANCE_POINT.y + 3.5}
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              textAnchor="middle"
            >
              IN
            </text>
            <text
              x={ENTRANCE_POINT.x}
              y={ENTRANCE_POINT.y - 18}
              fill="#34d399"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              className="drop-shadow"
            >
              ENTRANCE 🟢
            </text>
          </g>

          {/* Checkout Zone & Counters */}
          <g>
            {/* Checkout Counters Desk visual */}
            <rect
              x="570"
              y="525"
              width="155"
              height="45"
              rx="10"
              fill="url(#checkout-grad)"
              fillOpacity="0.2"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            {/* Counter register desks */}
            <rect x="585" y="534" width="22" height="26" rx="4" fill="#3f3f46" stroke="#fbbf24" strokeWidth="1" />
            <rect x="625" y="534" width="22" height="26" rx="4" fill="#3f3f46" stroke="#fbbf24" strokeWidth="1" />
            <rect x="665" y="534" width="22" height="26" rx="4" fill="#3f3f46" stroke="#fbbf24" strokeWidth="1" />

            {/* Checkout Target Pin */}
            <circle
              cx={CHECKOUT_POINT.x}
              cy={CHECKOUT_POINT.y}
              r="14"
              fill="url(#checkout-grad)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x={CHECKOUT_POINT.x}
              y={CHECKOUT_POINT.y + 4}
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              textAnchor="middle"
            >
              OUT
            </text>
            <text
              x={CHECKOUT_POINT.x}
              y={CHECKOUT_POINT.y - 18}
              fill="#fbbf24"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              className="drop-shadow"
            >
              CHECKOUT 🛒
            </text>
          </g>

          {/* Active Calculated Route Polyline */}
          {pathDataString && (
            <g>
              {/* Outer Glow Route Underlayer */}
              <path
                d={pathDataString}
                fill="none"
                stroke="#10B981"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.28"
                filter="url(#glow-route)"
              />
              {/* Inner Vibrant Dashed Walking Path */}
              <path
                d={pathDataString}
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 6"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Product Stops Markers */}
          {stops.map((stop, index) => {
            const isCompleted = completedStopIndices.includes(index);
            const isActive = index === activeStopIndex;
            const stopNum = index + 1;

            return (
              <g
                key={`stop-${stop.product_id || index}-${index}`}
                className="cursor-pointer transition-transform"
                onClick={() => {
                  setSelectedStop({ stop, index });
                  if (onStopClick) onStopClick(stop, index);
                }}
              >
                {/* Active Stop Radar Ring */}
                {isActive && !isCompleted && (
                  <circle
                    cx={stop.x}
                    cy={stop.y}
                    r="24"
                    fill="#F59E0B"
                    opacity="0.35"
                    className="animate-ping"
                    style={{ transformOrigin: `${stop.x}px ${stop.y}px` }}
                  />
                )}

                {/* Marker Outer Glow Ring */}
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r={isActive ? 16 : 13}
                  fill={isCompleted ? '#059669' : isActive ? '#F59E0B' : '#6366F1'}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter="url(#glow-marker)"
                />

                {/* Stop Content (Checkmark if completed, otherwise Number) */}
                {isCompleted ? (
                  <g transform={`translate(${stop.x - 6}, ${stop.y - 6})`}>
                    <path
                      d="M 2 6 L 5 9 L 10 3"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                ) : (
                  <text
                    x={stop.x}
                    y={stop.y + 4}
                    fill="#ffffff"
                    fontSize={isActive ? '11' : '10'}
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    {stopNum}
                  </text>
                )}

                {/* Active Target Banner Pin above stop */}
                {isActive && (
                  <g>
                    <polygon
                      points={`${stop.x},${stop.y - 18} ${stop.x - 5},${stop.y - 25} ${stop.x + 5},${stop.y - 25}`}
                      fill="#F59E0B"
                    />
                    <rect
                      x={stop.x - 45}
                      y={stop.y - 44}
                      width="90"
                      height="20"
                      rx="6"
                      fill="#18181b"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                    <text
                      x={stop.x}
                      y={stop.y - 30}
                      fill="#FDE68A"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      🎯 CURRENT STOP
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Current Shopper Animated Marker */}
          {isNavigating && currentShopperPos && (
            <g transform={`translate(${currentShopperPos.x}, ${currentShopperPos.y})`}>
              {/* Walking Pulse Ring */}
              <circle
                r="18"
                fill="#38bdf8"
                opacity="0.3"
                className="animate-ping"
              />
              <circle
                r="11"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="2.5"
                filter="url(#glow-marker)"
              />
              {/* Shopper icon dot */}
              <circle r="4" fill="#ffffff" />
            </g>
          )}
        </g>
      </svg>

      {/* Floating Interactive Controls Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-700 shadow-xl z-20">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          title="Reset View"
          className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-neutral-700 mx-0.5" />
        <button
          type="button"
          onClick={() => setShowCorridors(!showCorridors)}
          title={showCorridors ? 'Hide Corridors' : 'Show Corridors'}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            showCorridors ? 'text-emerald-400 bg-neutral-800' : 'text-neutral-400 hover:text-white'
          }`}
        >
          {showCorridors ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Status & Legend Badge */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
        <div className="flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-neutral-700/80 text-[11px] text-neutral-300 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="font-semibold text-neutral-200">Entrance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Stops</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Active Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span>Checkout</span>
          </div>
        </div>

        {/* Live Navigation Shopper Status Pill */}
        {isNavigating && stops[activeStopIndex] && (
          <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs text-amber-300 font-bold flex items-center gap-2 shadow-lg pointer-events-auto">
            <Navigation2 className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Target #{activeStopIndex + 1}: {stops[activeStopIndex].product_name}</span>
          </div>
        )}
      </div>

      {/* Selected Stop Details Popup Card */}
      {selectedStop && (
        <div className="absolute top-16 left-4 max-w-xs bg-neutral-900/95 backdrop-blur-md border border-neutral-700 p-4 rounded-2xl shadow-2xl z-30 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                {selectedStop.index + 1}
              </span>
              <div>
                <h4 className="text-xs font-bold text-white line-clamp-1">
                  {selectedStop.stop.product_name || `Stop #${selectedStop.index + 1}`}
                </h4>
                <p className="text-[10px] text-neutral-400">
                  {selectedStop.stop.aisle_name} • {selectedStop.stop.shelf_name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStop(null)}
              className="text-neutral-400 hover:text-white text-xs cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-neutral-300 bg-neutral-800/80 p-2 rounded-xl border border-neutral-700/50">
            {selectedStop.stop.instruction || `Locate item at ${selectedStop.stop.shelf_name}`}
          </p>
          <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
            <span>Coordinates: ({selectedStop.stop.x}, {selectedStop.stop.y})</span>
            {completedStopIndices.includes(selectedStop.index) ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Collected
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">Pending pickup</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

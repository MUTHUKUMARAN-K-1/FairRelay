import { useRef } from 'react';

export function GlobalMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  // SVG coordinates for a simple world map representation (dots for major hubs)
  const hubs = [
    { x: 200, y: 120, name: 'North America', status: 'active' }, // NA
    { x: 450, y: 100, name: 'Europe', status: 'active' },      // EU
    { x: 650, y: 140, name: 'Asia', status: 'active' },        // ASIA
    { x: 300, y: 250, name: 'South America', status: 'active' }, // SA
    { x: 480, y: 220, name: 'Africa', status: 'idle' },       // AF
    { x: 700, y: 300, name: 'Australia', status: 'active' },   // AU
  ];

  const routes = [
    { from: 0, to: 1 }, // NA -> EU
    { from: 1, to: 2 }, // EU -> ASIA
    { from: 2, to: 5 }, // ASIA -> AU
    { from: 0, to: 3 }, // NA -> SA
    { from: 1, to: 4 }, // EU -> AF
  ];

  return (
    <div className="bg-eco-card backdrop-blur-md rounded-xl p-6 border border-white/10 h-[500px] relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-eco-emerald-500 to-eco-action-blue opacity-50"></div>
      
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div>
          <h3 className="text-lg font-semibold text-white">Global Logistics Routes</h3>
          <p className="text-sm text-gray-400">Real-time fleet tracking</p>
        </div>
        <div className="flex space-x-2">
          <span className="flex items-center text-xs text-eco-emerald-400">
            <span className="w-2 h-2 rounded-full bg-eco-emerald-500 mr-2 animate-pulse"></span>
            Active
          </span>
          <span className="flex items-center text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span>
            Idle
          </span>
        </div>
      </div>

      <div className="w-full h-full flex items-center justify-center relative" ref={mapRef}>
        {/* Abstract World Map Background */}
        <div className="absolute inset-0 opacity-20">
             <svg viewBox="0 0 800 400" className="w-full h-full text-gray-600 fill-current">
                {/* Simplified continents */}
                <path d="M50,50 Q150,20 250,50 T400,100 T550,50 T750,100 V300 H50 Z" opacity="0.1" />
                {/* Grid lines */}
                <path d="M0,100 H800 M0,200 H800 M0,300 H800 M200,0 V400 M400,0 V400 M600,0 V400" stroke="currentColor" strokeWidth="0.5" fill="none" />
             </svg>
        </div>

        {/* Routes & Hubs */}
        <svg viewBox="0 0 800 400" className="w-full h-full absolute inset-0">
          <defs>
             <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
               <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
             </linearGradient>
             <filter id="glow">
               <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
               <feMerge>
                 <feMergeNode in="coloredBlur" />
                 <feMergeNode in="SourceGraphic" />
               </feMerge>
             </filter>
          </defs>

          {/* Connection Lines */}
          {routes.map((route, i) => {
             const start = hubs[route.from];
             const end = hubs[route.to];
             return (
               <g key={i}>
                {/* Base Line */}
                <line 
                  x1={start.x} y1={start.y} x2={end.x} y2={end.y} 
                  stroke="url(#routeGradient)" 
                  strokeWidth="2" 
                  strokeDasharray="5,5" 
                  opacity="0.3" 
                />
                
                {/* Animated Particle */}
                <circle r="3" fill="#3b82f6">
                  <animateMotion 
                    dur={`${3 + i}s`} 
                    repeatCount="indefinite"
                    path={`M${start.x},${start.y} L${end.x},${end.y}`}
                  />
                </circle>
               </g>
             );
          })}

          {/* Hub Dots */}
          {hubs.map((hub, i) => (
            <g key={i}>
              <circle 
                cx={hub.x} 
                cy={hub.y} 
                r="6" 
                fill={hub.status === 'active' ? '#10b981' : '#4b5563'} 
                className="transition-all duration-300 hover:r-8 cursor-pointer"
                filter={hub.status === 'active' ? "url(#glow)" : ""}
              />
              <circle 
                 cx={hub.x} 
                 cy={hub.y} 
                 r="12" 
                 stroke={hub.status === 'active' ? '#10b981' : '#4b5563'} 
                 strokeWidth="1" 
                 fill="none" 
                 opacity="0.3"
                 className={hub.status === 'active' ? "animate-ping" : ""}
              />
              <text 
                x={hub.x} 
                y={hub.y + 20} 
                textAnchor="middle" 
                className="text-[10px] fill-gray-400 font-sans tracking-widest uppercase opacity-70"
              >
                {hub.name}
              </text>
            </g>
          ))}
        </svg>

        {/* Map UI Controls */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
            <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white transition-colors border border-white/10 text-xs font-medium">
                Zoom In
            </button>
            <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white transition-colors border border-white/10 text-xs font-medium">
                Reset
            </button>
        </div>
      </div>
    </div>
  );
}

import { LayoutDashboard, BarChart3, FileSpreadsheet, LogOut, Leaf, Package, Navigation, Brain, Shield, Key, Layers, Route } from 'lucide-react';
import { cn } from '../lib/utils';
import { NavLink } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Brain, label: 'AI Fair Dispatch', to: '/fair-dispatch' },
  { icon: Route, label: 'Route Optimizer', to: '/route-optimization' },
  { icon: FileSpreadsheet, label: 'Absorption', to: '/absorption-requests' },
  { icon: Package, label: 'Packages', to: '/packages' },
  { icon: Navigation, label: 'Allocate Routes', to: '/allocate-routes' },
  { icon: Layers, label: 'Load Consolidation', to: '/load-consolidation' },
  { icon: BarChart3, label: 'Analytics', to: '/analytics' },
  { icon: Leaf, label: 'Carbon Tracking', to: '/carbon-tracking' },
  { icon: Key, label: 'API Keys', to: '/api-keys' },
];

export function Sidebar() {
  return (
    <div className="h-screen w-[240px] bg-eco-dark border-r border-eco-card-border flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 p-2 rounded-full border border-orange-500/30">
            <Shield className="w-5 h-5 text-orange-400" />
        </div>
        <span className="text-xl font-bold text-white tracking-wide">
          Fair<span className="text-orange-400">Relay</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
              isActive 
                ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-600/20" 
                : "text-eco-text-secondary hover:bg-eco-secondary hover:text-white"
            )}
          >
            <item.icon className={cn("w-4.5 h-4.5 transition-colors", 
                "group-[.active]:text-white"
            )} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-eco-card-border mt-auto">
        <NavLink to="/admin" className="flex items-center space-x-3 mb-3 px-2 hover:bg-eco-secondary/50 p-2 rounded-lg transition-colors group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm group-hover:shadow-neon-orange transition-all">
                A
            </div>
            <div>
                <div className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors">Admin User</div>
                <div className="text-xs text-eco-text-secondary">System Admin</div>
            </div>
        </NavLink>
        <button className="flex items-center space-x-3 text-eco-text-secondary hover:text-white transition-colors px-2 py-2 w-full hover:bg-eco-secondary rounded-lg">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

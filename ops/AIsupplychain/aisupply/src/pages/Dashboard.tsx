import { useEffect, useState, useRef } from 'react';
import { FileText, Box, Truck, MapPin, Star, ArrowUpRight, TrendingUp, TrendingDown, AlertCircle, Brain, Zap } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getDashboardStats, getDashboardActivity, getLiveTracking, getRecentAbsorptions, getAllDrivers, getDispatchHealth } from '../services/apiClient';

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current || target === 0) return;
    startedRef.current = true;
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

export function Dashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [liveTracking, setLiveTracking] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brainStatus, setBrainStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    getDispatchHealth()
      .then(data => setBrainStatus(data.brain_status === 'connected' ? 'connected' : 'disconnected'))
      .catch(() => setBrainStatus('disconnected'));
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [statsData, activity, tracking, absorptions, drivers] = await Promise.all([
          getDashboardStats(),
          getDashboardActivity(),
          getLiveTracking(),
          getRecentAbsorptions(),
          getAllDrivers()
        ]);

        setStats(statsData);
        setActivityData(activity);

        // Transform Live Tracking Data
        setLiveTracking(tracking.map((item: any) => ({
          ...item,
          icon: item.status === 'Active' ? MapPin : (item.status === 'Loading' ? Box : Truck),
          color: item.status === 'Active' ? 'text-eco-brand-orange' : 'text-eco-info'
        })));

        // Use absorption data directly (already formatted from backend)
        setRecentRequests(absorptions.map((abs: any) => ({
          id: abs.id.substring(0, 8),
          fullId: abs.id,
          type: abs.type,
          route: abs.route,
          weight: abs.weight,
          priority: abs.priority,
          color: abs.priority === 'HIGH' ? 'text-eco-error bg-eco-error/10 border-eco-error/20' : 
                 (abs.priority === 'MEDIUM' ? 'text-eco-brand-orange bg-eco-brand-orange/10 border-eco-brand-orange/20' : 
                 'text-eco-success bg-eco-success/10 border-eco-success/20')
        })));

        // Transform Top Drivers (Sort by rating, take top 3)
        const sortedDrivers = drivers
            .filter((d: any) => d.rating !== undefined)
            .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);
            
        setTopDrivers(sortedDrivers.map((d: any) => ({
            name: d.name,
            id: d.id, 
            deliveries: d.deliveriesCount || 0,
            rating: d.rating || 0,
            initials: d.initials || d.name.substring(0,2).toUpperCase(),
            color: 'bg-gradient-to-br from-orange-600 to-amber-500' 
        })));

      } catch (err: any) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to load dashboard data. Check backend connection.");
        showToast("Connection Error", "Is the backend server running?", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const handleTrackingClick = (item: any) => {
      showToast(`Tracking ${item.name}`, `Status: ${item.status}`, 'info');
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <AlertCircle className="w-12 h-12 text-eco-error mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Unavailable</h3>
            <p className="text-eco-text-secondary">{error}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
       {/* FairRelay AI Dispatch Banner */}
       <div className="bg-gradient-to-r from-orange-900/40 via-amber-900/30 to-orange-900/40 rounded-xl border border-orange-500/20 p-5">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/30">
               <Brain className="w-7 h-7 text-orange-400" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-white">FairRelay AI Dispatch Engine</h2>
               <p className="text-sm text-eco-text-secondary">8-agent LangGraph pipeline • Fairness-aware routing • Wellness-first dispatch</p>
             </div>
           </div>
           <div className="flex items-center gap-3">
             <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
               brainStatus === 'connected' 
                 ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                 : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
             }`}>
               <div className={`w-2 h-2 rounded-full animate-pulse ${brainStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
               {brainStatus === 'connected' ? 'AI Brain Online' : 'Demo Mode'}
             </div>
             <Link 
               to="/fair-dispatch" 
               className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all"
             >
               <Zap className="w-4 h-4" /> Run Fair Allocation
             </Link>
           </div>
         </div>
       </div>

       {/* AI Savings Banner */}
       {!loading && !error && (
         <div className="flex flex-wrap gap-4">
           {[
             { icon: '⚖️', label: 'Gini Today', value: '0.12', sub: 'Excellent fairness', color: 'text-emerald-400' },
             { icon: '🌿', label: 'CO₂ Saved', value: '14.2kg', sub: 'This run', color: 'text-green-400' },
             { icon: '🤖', label: 'AI Dispatches', value: stats?.dispatchRuns || '48', sub: 'Today', color: 'text-orange-400' },
             { icon: '⏱', label: 'AI saved', value: '3.2 hrs', sub: 'vs manual dispatch', color: 'text-blue-400' },
           ].map((item, i) => (
             <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-white/3 border border-white/8 rounded-xl hover:border-orange-500/20 transition-all">
               <span className="text-xl">{item.icon}</span>
               <div>
                 <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                 <p className="text-xs text-gray-500">{item.label} · {item.sub}</p>
               </div>
             </div>
           ))}
         </div>
       )}

       <div className="flex items-center text-sm text-eco-text-secondary mb-2">
           <span className="text-white font-semibold">Dashboard</span>
       </div>

       {/* Stats Row */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatWidget 
                title="Pending Requests" 
                value={stats?.pendingRequests || "0"} 
                change={stats?.trends?.pendingRequests || "-"} 
                positive={true} 
                icon={FileText} 
                iconColor="text-eco-brand-orange" 
                iconBg="bg-eco-brand-orange/10" 
            />
           <StatWidget 
                title="Active Shipments" 
                value={stats?.activeShipments || "0"} 
                change={stats?.trends?.activeShipments || "-"} 
                positive={true} 
                icon={Box} 
                iconColor="text-eco-info" 
                iconBg="bg-eco-info/10" 
            />
           <StatWidget 
                title="Active Drivers" 
                value={stats?.activeDrivers || "0"} 
                change={stats?.trends?.activeDrivers || "-"} 
                positive={true} 
                icon={Truck} 
                iconColor="text-eco-success" 
                iconBg="bg-eco-success/10"
                pulse={true}
            />
           <StatWidget 
                title="Fleet Utilization" 
                value={stats?.fleetUtilization || "0%"} 
                change={stats?.trends?.fleetUtilization || "-"} 
                positive={false} 
                icon={TrendingUp} 
                iconColor="text-eco-brand-orange" 
                iconBg="bg-eco-brand-orange/10" 
            />
       </div>

       {/* Middle Section: Chart + Live Tracking */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Chart */}
           <div className="lg:col-span-2 bg-eco-card rounded-xl border border-eco-card-border p-6 h-[340px]">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-white font-semibold text-lg">Weekly Request Activity</h3>
                   <Link to="/analytics" className="flex items-center text-eco-brand-orange text-sm cursor-pointer hover:underline">
                       Analytics <ArrowUpRight className="w-4 h-4 ml-1" />
                   </Link>
               </div>
               <ResponsiveContainer width="100%" height="80%">
                   <AreaChart data={activityData}>
                       <defs>
                           <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#3A2820" stopOpacity={0}/>
                           </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#2A3142" vertical={false} />
                       <XAxis dataKey="day" stroke="#8B92A8" tickLine={false} axisLine={false} dy={10} />
                       <YAxis stroke="#8B92A8" tickLine={false} axisLine={false} dx={-10} interval={0} allowDecimals={false} />
                       <Tooltip 
                            contentStyle={{ backgroundColor: '#151B28', borderColor: '#2A3142', borderRadius: '8px', color: '#fff' }} 
                            itemStyle={{ color: '#FF6B35' }}
                            cursor={{ stroke: '#FF6B35', strokeDasharray: '5 5' }}
                        />
                       <Area type="monotone" dataKey="requests" stroke="#FF6B35" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                   </AreaChart>
               </ResponsiveContainer>
           </div>

           {/* Live Tracking */}
           <div className="bg-eco-card rounded-xl border border-eco-card-border p-6 h-[340px] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-white font-semibold text-lg">Live Tracking</h3>
                   <MapPin className="w-5 h-5 text-eco-brand-orange" />
               </div>
               <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                   {liveTracking.map((item) => (
                       <div 
                        key={item.id} 
                        className="bg-eco-secondary p-3 rounded-lg border border-eco-card-border flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => handleTrackingClick(item)}
                       >
                           <div className="flex items-center space-x-3">
                               <div className="p-2 bg-white/5 rounded-md text-gray-400">
                                   <item.icon className="w-5 h-5" />
                               </div>
                               <div>
                                   <div className="text-sm font-medium text-white">{item.name}</div>
                                   <div className={`text-xs ${item.status === 'Active' ? 'text-eco-brand-orange' : 'text-eco-info'}`}>{item.status}</div>
                               </div>
                           </div>
                           <div className={`w-2 h-2 rounded-full animate-pulse ${item.status === 'Active' ? 'bg-eco-brand-orange' : 'bg-eco-info'}`}></div>
                       </div>
                   ))}
               </div>
           </div>
       </div>

       {/* Bottom Section: Recent Requests + Top Drivers */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Recent Requests */}
           <div className="bg-eco-card rounded-xl border border-eco-card-border p-6">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-white font-semibold text-lg">Recent Absorption Requests</h3>
                   <Link to="/absorption-requests" className="flex items-center text-eco-brand-orange text-sm cursor-pointer hover:underline">
                       View All <ArrowUpRight className="w-4 h-4 ml-1" />
                   </Link>
               </div>
               <div className="space-y-4">
                   {recentRequests.map((req) => (
                       <div key={req.id} className="bg-eco-secondary p-4 rounded-xl border border-eco-card-border flex justify-between items-center group hover:border-white/10 transition-all cursor-pointer" onClick={() => showToast(`Opening Request ${req.id}`, 'Redirecting to details...', 'info')}>
                           <div>
                               <div className="flex items-center space-x-2 mb-1">
                                   <span className="text-eco-brand-orange font-bold text-sm">#{req.id}</span>
                                   <span className="text-eco-text-secondary text-sm">{req.type}</span>
                               </div>
                               <div className="text-gray-300 text-sm">{req.route}</div>
                           </div>
                           <div className="flex flex-col items-end space-y-2">
                               <span className={`px-2 py-1 rounded text-xs font-medium border ${req.color}`}>
                                   {req.priority}
                               </span>
                               <span className="text-white text-sm font-semibold">{req.weight}</span>
                           </div>
                       </div>
                   ))}
               </div>
           </div>

           {/* Top Drivers */}
           <div className="bg-eco-card rounded-xl border border-eco-card-border p-6">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-white font-semibold text-lg">Top Performing Drivers</h3>
                   <Link to="/drivers" className="flex items-center text-eco-brand-orange text-sm cursor-pointer hover:underline">
                       View All <ArrowUpRight className="w-4 h-4 ml-1" />
                   </Link>
               </div>
               <div className="space-y-4">
                   {topDrivers.map((driver) => (
                       <div key={driver.id} className="bg-eco-secondary p-4 rounded-xl border border-eco-card-border flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer" onClick={() => showToast(`Driver ${driver.initials}`, 'View performance profile', 'info')}>
                           <div className="flex items-center space-x-3">
                               <div className={`w-10 h-10 rounded-full ${driver.color} text-white flex items-center justify-center font-bold text-sm`}>
                                   {driver.initials}
                               </div>
                               <div>
                                   <div className="text-white font-medium text-sm">{driver.name}</div>
                                   <div className="text-eco-text-secondary text-xs">{driver.id}</div>
                               </div>
                           </div>
                           <div className="text-right">
                               <div className="flex items-center text-yellow-500 font-bold text-sm justify-end">
                                   <Star className="w-4 h-4 fill-current mr-1" /> {driver.rating}
                               </div>
                               <div className="text-eco-text-secondary text-xs mt-1">{driver.deliveries} deliveries completed</div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       </div>
    </div>
  );
}

function StatWidget({ title, value, change, positive, icon: Icon, iconColor, iconBg, pulse = false }: any) {
    const parsed = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) || 0 : (value || 0);
    const animated = useCountUp(parsed);
    const displayValue = typeof value === 'string' && /[^0-9]/.test(value)
        ? value // keep string like "87%" as-is
        : animated.toLocaleString();
    return (
        <div className="bg-eco-card rounded-xl p-6 border border-eco-card-border flex items-start justify-between shadow-lg hover:shadow-xl transition-shadow cursor-default hover:border-eco-brand-orange/20">
            <div>
                <div className="text-eco-text-secondary text-sm font-medium mb-1">{title}</div>
                <div className="text-3xl font-bold text-white mb-1">{displayValue}</div>
                <div className={`flex items-center text-xs font-semibold ${positive ? 'text-eco-success' : 'text-eco-warning'}`}>
                    {positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {change}
                </div>
            </div>
            <div className={`p-4 rounded-full ${iconBg} relative`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
                {pulse && <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping border-2 border-gray-900" />}
            </div>
        </div>
    )
}

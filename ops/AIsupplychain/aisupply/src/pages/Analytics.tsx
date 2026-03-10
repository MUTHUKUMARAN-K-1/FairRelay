import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Users, Truck, DollarSign, BarChart2, Award } from 'lucide-react';

const volumeData = [
  { name: 'Aug', value: 280, revenue: 120000 },
  { name: 'Sep', value: 300, revenue: 150000 },
  { name: 'Oct', value: 320, revenue: 180000 },
  { name: 'Nov', value: 310, revenue: 170000 },
  { name: 'Dec', value: 350, revenue: 220000 },
  { name: 'Jan', value: 380, revenue: 260000 },
];

const routeData = [
  { name: 'Mumbai–Delhi', value: 240 },
  { name: 'Ahmd–Mumbai', value: 180 },
  { name: 'Bang–Chennai', value: 160 },
  { name: 'Delhi–Kolkata', value: 140 },
  { name: 'Pune–Hyd', value: 120 },
];

const pieData = [
  { name: 'On Time', value: 78, color: '#10B981' },
  { name: 'Delayed', value: 15, color: '#f97316' },
  { name: 'In Transit', value: 7, color: '#3B82F6' },
];

// Gini trend — showing FairRelay's impact over time
const giniTrend = [
  { month: 'Aug', gini: 0.82, label: 'No AI' },
  { month: 'Sep', gini: 0.79, label: 'Pilot' },
  { month: 'Oct', gini: 0.61, label: 'V1 Live' },
  { month: 'Nov', gini: 0.42, label: 'Tuned' },
  { month: 'Dec', gini: 0.25, label: 'V2' },
  { month: 'Jan', gini: 0.12, label: 'V3' },
];

// Driver earnings before vs after
const earningsData = [
  { name: 'Rajesh', before: 8200, after: 5400 },
  { name: 'Priya', before: 1100, after: 4800 },
  { name: 'Amit', before: 7800, after: 5200 },
  { name: 'Sunita', before: 900, after: 4600 },
  { name: 'Vikram', before: 200, after: 4200 },
];

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function KpiCard({ title, value, change, negative, icon: Icon, prefix = '', suffix = '' }: any) {
  const num = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div className="bg-eco-card rounded-xl p-5 border border-eco-card-border shadow-sm hover:border-eco-brand-orange/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-eco-text-secondary text-xs font-medium mb-1 uppercase tracking-wider">{title}</div>
          <div className="text-2xl font-bold text-white mt-1">
            {prefix}{typeof value === 'number' ? num.toLocaleString() : value}{suffix}
          </div>
        </div>
        <div className={`p-2.5 rounded-xl ${negative ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`}>
          <Icon className={`w-5 h-5 ${negative ? 'text-orange-400' : 'text-emerald-400'}`} />
        </div>
      </div>
      <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${negative ? 'text-orange-400' : 'text-emerald-400'}`}>
        {negative ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
        {change}
        <span className="text-gray-500 font-normal ml-1">vs last month</span>
      </div>
    </div>
  );
}

const CustomGiniTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const val = payload[0].value;
    const quality = val < 0.2 ? 'Excellent' : val < 0.4 ? 'Good' : val < 0.6 ? 'Moderate' : 'Poor';
    const color = val < 0.2 ? '#34d399' : val < 0.4 ? '#fbbf24' : val < 0.6 ? '#f97316' : '#f87171';
    return (
      <div className="bg-gray-900 border border-white/10 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-gray-400 mb-1">{label} · {payload[0].payload.label}</p>
        <p className="font-bold" style={{ color }}>Gini: {val} — {quality}</p>
      </div>
    );
  }
  return null;
};

import { getDashboardStats } from '../services/apiClient';

export function Analytics() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats()
      .then(data => setStats(data))
      .catch(() => setStats(null)); // graceful fallback to static values
  }, []);

  const activeShipments = useCountUp(stats?.activeShipments ? parseInt(stats.activeShipments) : 1234);
  const co2Avoided = useCountUp(142);

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-eco-text-secondary mb-2">
        Dashboard <span className="mx-2">&gt;</span> <span className="text-white font-semibold">Analytics</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value={12400000} prefix="₹" change="+12.5%" icon={DollarSign} />
        <KpiCard title="Active Shipments" value={stats?.activeShipments ? parseInt(stats.activeShipments) : 1234} change="+8.2%" icon={Truck} />
        <KpiCard title="AI Dispatches Today" value={stats?.dispatchRuns || 48} change="+14%" icon={BarChart2} />
        <KpiCard title="Active Drivers" value={stats?.activeDrivers ? parseInt(stats.activeDrivers) : 456} change="+5.3%" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-eco-card rounded-xl border border-eco-card-border p-6 h-[320px]">
          <h3 className="text-white font-semibold mb-1">Revenue Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Monthly platform revenue (₹)</p>
          <ResponsiveContainer width="100%" height="82%">
            <AreaChart data={volumeData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" vertical={false} />
              <XAxis dataKey="name" stroke="#4B5563" tickLine={false} axisLine={false} dy={10} fontSize={11} />
              <YAxis stroke="#4B5563" tickLine={false} axisLine={false} dx={-5} fontSize={11} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1e2438', color: '#fff', borderRadius: 8 }} formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gini Trend — Flagship Chart */}
        <div className="bg-eco-card rounded-xl border border-orange-500/20 p-6 h-[320px] relative">
          <div className="absolute top-3 right-3">
            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium flex items-center gap-1">
              <Award className="w-3 h-3" /> FairRelay Impact
            </span>
          </div>
          <h3 className="text-white font-semibold mb-1">Gini Fairness Index Over Time</h3>
          <p className="text-xs text-gray-500 mb-4">Lower = fairer income distribution across drivers</p>
          <ResponsiveContainer width="100%" height="82%">
            <LineChart data={giniTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" vertical={false} />
              <XAxis dataKey="month" stroke="#4B5563" tickLine={false} axisLine={false} dy={10} fontSize={11} />
              <YAxis stroke="#4B5563" tickLine={false} axisLine={false} dx={-5} fontSize={11} domain={[0, 1]} tickFormatter={v => v.toFixed(1)} />
              <Tooltip content={<CustomGiniTooltip />} />
              <ReferenceLine y={0.2} stroke="#34d399" strokeDasharray="4 4" label={{ value: 'Fair', position: 'right', fill: '#34d399', fontSize: 10 }} />
              <ReferenceLine y={0.5} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Moderate', position: 'right', fill: '#f97316', fontSize: 10 }} />
              <Line type="monotone" dataKey="gini" stroke="#f97316" strokeWidth={3} dot={{ r: 5, fill: '#f97316', stroke: '#0f1117', strokeWidth: 2 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Earnings: Before vs After */}
        <div className="bg-eco-card rounded-xl border border-eco-card-border p-6 h-[320px]">
          <h3 className="text-white font-semibold mb-1">Driver Earnings Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Monthly earnings (₹) — Before vs After FairRelay</p>
          <ResponsiveContainer width="100%" height="82%">
            <BarChart data={earningsData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" vertical={false} />
              <XAxis dataKey="name" stroke="#4B5563" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis stroke="#4B5563" tickLine={false} axisLine={false} fontSize={11} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1e2438', color: '#fff', borderRadius: 8 }} formatter={(v: any, name: any) => [`₹${(v as number).toLocaleString()}`, name === 'before' ? 'Before' : 'After FairRelay']} />
              <Bar dataKey="before" fill="#f87171" radius={[3, 3, 0, 0]} barSize={16} name="before" />
              <Bar dataKey="after" fill="#34d399" radius={[3, 3, 0, 0]} barSize={16} name="after" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Delivery Performance */}
        <div className="bg-eco-card rounded-xl border border-eco-card-border p-6 h-[320px] flex flex-col">
          <h3 className="text-white font-semibold mb-1">Delivery Performance</h3>
          <p className="text-xs text-gray-500 mb-4">On-time delivery rate by status</p>
          <div className="flex-1 flex items-center relative">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" startAngle={90} endAngle={450}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1e2438', color: '#fff', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute left-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <span className="text-3xl font-bold text-white">78%</span>
              <span className="text-xs text-gray-400">On Time</span>
            </div>
            <div className="flex-1 space-y-3 pl-4">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-400">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FairRelay Impact Section */}
      <div className="bg-gradient-to-r from-orange-900/30 via-amber-900/20 to-orange-900/30 border border-orange-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">FairRelay Impact This Quarter</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'CO₂ Avoided', value: `${co2Avoided} Tons`, sub: 'via route optimization', icon: '🌿', color: 'text-green-400' },
            { label: 'Income Equality', value: '±12%', sub: 'driver earnings variance (was ±340%)', icon: '⚖️', color: 'text-emerald-400' },
            { label: 'Gini Reduction', value: '86%', sub: '0.85 → 0.12 this quarter', icon: '📉', color: 'text-orange-400' },
            { label: 'AI Dispatches', value: `${activeShipments.toLocaleString()}`, sub: 'fair allocations run', icon: '🤖', color: 'text-blue-400' },
          ].map((item, i) => (
            <div key={i} className="bg-black/20 rounded-xl p-4 border border-white/5">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.label}</p>
              <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Routes */}
      <div className="bg-eco-card rounded-xl border border-eco-card-border p-6">
        <h3 className="text-white font-semibold mb-4">Top Routes by Volume</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={routeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" horizontal={false} />
              <XAxis type="number" stroke="#4B5563" hide />
              <YAxis dataKey="name" type="category" stroke="#4B5563" tickLine={false} axisLine={false} width={110} fontSize={11} />
              <Tooltip cursor={{ fill: '#1e2438' }} contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1e2438', color: '#fff', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#f97316" radius={[0, 5, 5, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

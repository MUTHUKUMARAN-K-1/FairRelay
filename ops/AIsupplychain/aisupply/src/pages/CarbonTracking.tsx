import { useEffect, useState } from 'react';
import { Leaf, TrendingDown, Award, Target, Zap, Cpu, Network, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const emissionTrend = [
  { month: 'Aug', actual: 45, baseline: 58 },
  { month: 'Sep', actual: 42, baseline: 57 },
  { month: 'Oct', actual: 38, baseline: 56 },
  { month: 'Nov', actual: 35, baseline: 55 },
  { month: 'Dec', actual: 32, baseline: 54 },
  { month: 'Jan', actual: 28, baseline: 53 },
];

const efficiencyData = [
  { route: 'Mumbai–Delhi', value: 85 },
  { route: 'Ahmd–Mumbai', value: 92 },
  { route: 'Bang–Chennai', value: 78 },
  { route: 'Delhi–Kolkata', value: 88 },
  { route: 'Pune–Hyd', value: 80 },
];

const esgData = [
  { subject: 'Fuel Efficiency', A: 120, fullMark: 150 },
  { subject: 'Route Opti', A: 98, fullMark: 150 },
  { subject: 'Load Capacity', A: 86, fullMark: 150 },
  { subject: 'Idle Time', A: 99, fullMark: 150 },
  { subject: 'Maintenance', A: 85, fullMark: 150 },
  { subject: 'Driver Training', A: 65, fullMark: 150 },
];

const initiatives = [
  { title: 'Electric Fleet Integration', desc: '15% of fleet transitioning to EVs — prioritised in city-centre routes', progress: 65, impact: '3.2 Tons', status: 'In Progress', icon: Zap },
  { title: 'Route Optimization AI', desc: 'AI-powered fair dispatch reducing fuel consumption per delivery', progress: 85, impact: '5.8 Tons', status: 'Active', icon: Cpu },
  { title: 'Virtual Hub Network', desc: 'Collaborative absorption logistics reducing empty miles by 34%', progress: 72, impact: '4.1 Tons', status: 'In Progress', icon: Network },
];

const SDG_BADGES = [
  { number: 8, title: 'Decent Work', color: '#A21942', desc: 'Fair wages for gig workers' },
  { number: 10, title: 'Reduced Inequalities', color: '#DD1367', desc: 'Gini fairness scoring' },
  { number: 13, title: 'Climate Action', color: '#3F7E44', desc: 'CO₂ reduction via AI routing' },
];

function useCountUp(target: number, duration = 1500, decimals = 1) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setValue(target); clearInterval(timer); }
      else setValue(parseFloat(current.toFixed(decimals)));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, decimals]);
  return value;
}

export function CarbonTracking() {
  const co2Saved = useCountUp(12.4);
  const greenMiles = useCountUp(45678, 2000, 0);
  const esgScore = useCountUp(87, 1200, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-eco-text-secondary mb-2">
        Dashboard <span className="mx-2">&gt;</span> <span className="text-white font-semibold">Carbon Tracking</span>
      </div>

      {/* SDG Badges */}
      <div className="flex flex-wrap gap-3">
        {SDG_BADGES.map(sdg => (
          <div key={sdg.number} className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/10 bg-white/3 hover:border-white/20 transition-all">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: sdg.color }}>
              {sdg.number}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{sdg.title}</p>
              <p className="text-gray-500 text-xs">{sdg.desc}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-500/20 bg-green-500/5">
          <Leaf className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-xs font-medium">UN Sustainable Development Goals alignment</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-eco-card rounded-xl p-5 border border-emerald-500/20 flex items-start justify-between shadow-sm">
          <div>
            <div className="text-eco-text-secondary text-xs font-medium mb-1 uppercase tracking-wider">Carbon Saved (MTD)</div>
            <div className="text-3xl font-bold text-emerald-400">{co2Saved} <span className="text-lg">Tons</span></div>
            <div className="text-xs text-emerald-500 mt-1 font-semibold">↓ 15.2% vs last month</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10"><Leaf className="w-5 h-5 text-emerald-400" /></div>
        </div>
        <div className="bg-eco-card rounded-xl p-5 border border-blue-500/20 flex items-start justify-between shadow-sm">
          <div>
            <div className="text-eco-text-secondary text-xs font-medium mb-1 uppercase tracking-wider">Emission Reduction</div>
            <div className="text-3xl font-bold text-blue-400">23.6<span className="text-lg">%</span></div>
            <div className="text-xs text-blue-400 mt-1 font-semibold">↑ 5.3% vs last month</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10"><TrendingDown className="w-5 h-5 text-blue-400" /></div>
        </div>
        <div className="bg-eco-card rounded-xl p-5 border border-orange-500/20 flex items-start justify-between shadow-sm">
          <div>
            <div className="text-eco-text-secondary text-xs font-medium mb-1 uppercase tracking-wider">ESG Score</div>
            <div className="text-3xl font-bold text-orange-400">{esgScore}<span className="text-lg">/100</span></div>
            <div className="text-xs text-emerald-400 mt-1 font-semibold">↑ +3.2 this quarter</div>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-500/10"><Award className="w-5 h-5 text-orange-400" /></div>
        </div>
        <div className="bg-eco-card rounded-xl p-5 border border-eco-brand-orange/10 flex items-start justify-between shadow-sm">
          <div>
            <div className="text-eco-text-secondary text-xs font-medium mb-1 uppercase tracking-wider">Green Miles</div>
            <div className="text-3xl font-bold text-eco-brand-orange">{greenMiles.toLocaleString()}<span className="text-sm ml-1">km</span></div>
            <div className="text-xs text-emerald-400 mt-1 font-semibold">↑ 12.1% vs last month</div>
          </div>
          <div className="p-2.5 rounded-xl bg-eco-brand-orange/10"><Target className="w-5 h-5 text-eco-brand-orange" /></div>
        </div>
      </div>

      {/* Per-Allocation Impact Banner */}
      <div className="bg-gradient-to-r from-green-900/30 via-emerald-900/20 to-green-900/30 border border-green-500/20 rounded-xl p-4 flex flex-wrap items-center gap-4">
        <BarChart3 className="w-5 h-5 text-green-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-green-300 font-semibold text-sm">Per-Allocation Carbon Impact</p>
          <p className="text-gray-400 text-sm mt-0.5">Each AI dispatch saves avg <span className="text-white font-bold">1.8 kg CO₂</span> vs naive dispatch · EV-first routing prevents <span className="text-white font-bold">0 g</span> direct emissions in city centre · Empty miles reduced by <span className="text-white font-bold">34%</span> via absorption routes</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emission Trend with Baseline */}
        <div className="bg-eco-card rounded-xl border border-eco-card-border p-6 h-[350px]">
          <h3 className="text-white font-semibold mb-1">Carbon Emissions Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Actual (CO₂ tons) vs baseline without FairRelay</p>
          <ResponsiveContainer width="100%" height="82%">
            <AreaChart data={emissionTrend}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" vertical={false} />
              <XAxis dataKey="month" stroke="#4B5563" tickLine={false} axisLine={false} dy={10} fontSize={11} />
              <YAxis stroke="#4B5563" tickLine={false} axisLine={false} dx={-5} fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1e2438', color: '#fff', borderRadius: 8 }} />
              <Area type="monotone" dataKey="baseline" stroke="#f87171" strokeWidth={1.5} strokeDasharray="5 3" fillOpacity={1} fill="url(#colorBaseline)" name="Without AI" />
              <Area type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActual)" name="With FairRelay" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Route Efficiency */}
        <div className="bg-eco-card rounded-xl border border-eco-card-border p-6 h-[350px]">
          <h3 className="text-white font-semibold mb-1">Route Carbon Efficiency</h3>
          <p className="text-xs text-gray-500 mb-4">% efficiency score per major route</p>
          <ResponsiveContainer width="100%" height="82%">
            <BarChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" vertical={false} />
              <XAxis dataKey="route" stroke="#4B5563" tickLine={false} axisLine={false} dy={10} fontSize={10} />
              <YAxis stroke="#4B5563" tickLine={false} axisLine={false} dx={-5} domain={[60, 100]} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1e2438', color: '#fff', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#10B981" radius={[5, 5, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: ESG + Initiatives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-eco-card rounded-xl border border-eco-card-border p-6 h-[380px]">
          <h3 className="text-white font-semibold mb-2">ESG Performance</h3>
          <p className="text-xs text-gray-500 mb-2">Multi-dimensional sustainability score</p>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={esgData}>
              <PolarGrid stroke="#1e2438" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
              <Radar name="ESG" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.2} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1e2438', color: '#fff', borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-eco-card rounded-xl border border-eco-card-border p-6 space-y-4 h-[380px] overflow-y-auto">
          <h3 className="text-white font-semibold">Sustainability Initiatives</h3>
          {initiatives.map((item, idx) => (
            <div key={idx} className="bg-eco-secondary/50 p-5 rounded-xl border border-eco-card-border hover:border-eco-brand-orange/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <p className="text-eco-text-secondary text-xs mt-1">{item.desc}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded flex-shrink-0 ml-4 ${
                  item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>{item.status}</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-bold">{item.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-700/30 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-emerald-400 font-medium">
                <Leaf className="w-3.5 h-3.5 mr-1.5" /> Impact: <span className="text-white ml-1">{item.impact} CO₂ saved/month</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

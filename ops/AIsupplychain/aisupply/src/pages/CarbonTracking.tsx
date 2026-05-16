import { useEffect, useState, useCallback } from 'react';
import { Leaf, TrendingDown, Award, Target, Zap, Cpu, Network, BarChart3, Brain, AlertTriangle, CheckCircle, Loader2, Flame, ArrowRight, Truck } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from 'recharts';

// ── Static chart data ────────────────────────────────────────────────────────
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
  { subject: 'Route Opti',      A: 98,  fullMark: 150 },
  { subject: 'Load Capacity',   A: 86,  fullMark: 150 },
  { subject: 'Idle Time',       A: 99,  fullMark: 150 },
  { subject: 'Maintenance',     A: 85,  fullMark: 150 },
  { subject: 'Driver Training', A: 65,  fullMark: 150 },
];

const initiatives = [
  { title: 'Electric Fleet Integration',  desc: '15% of fleet transitioning to EVs — prioritised in city-centre routes',     progress: 65, impact: '3.2 Tons', status: 'In Progress', icon: Zap     },
  { title: 'Route Optimization AI',       desc: 'AI-powered fair dispatch reducing fuel consumption per delivery',              progress: 85, impact: '5.8 Tons', status: 'Active',      icon: Cpu     },
  { title: 'Virtual Hub Network',         desc: 'Collaborative absorption logistics reducing empty miles by 34%',               progress: 72, impact: '4.1 Tons', status: 'In Progress', icon: Network },
];

const SDG_BADGES = [
  { number: 8,  title: 'Decent Work',          color: '#A21942', desc: 'Fair wages for gig workers'      },
  { number: 10, title: 'Reduced Inequalities', color: '#DD1367', desc: 'Gini fairness scoring'           },
  { number: 13, title: 'Climate Action',        color: '#3F7E44', desc: 'CO₂ reduction via AI routing'   },
];

// ── Shipment-level emission data (estimation model: 0.21 kg CO₂/km × weight factor) ──
const SHIPMENT_EMISSIONS = [
  { id: 'SH-001', lane: 'Mumbai → Pune',           distKm: 149, weightKg: 800,  maxKg: 2000, truck: 'Tata Ace Gold'   },
  { id: 'SH-002', lane: 'Mumbai JNPT → Pune Ind.', distKm: 152, weightKg: 600,  maxKg: 2000, truck: 'Tata Ace Gold'   },
  { id: 'SH-003', lane: 'Blr → Chennai',           distKm: 347, weightKg: 1200, maxKg: 5000, truck: 'Eicher Pro 2049' },
  { id: 'SH-004', lane: 'Delhi NCR → Jaipur',      distKm: 281, weightKg: 1500, maxKg: 5000, truck: 'Eicher Pro 2049' },
  { id: 'SH-005', lane: 'Hyderabad → Kurnool',     distKm: 215, weightKg: 1800, maxKg: 3000, truck: 'BharatBenz'      },
  { id: 'SH-006', lane: 'Mumbai → Surat',          distKm: 284, weightKg: 950,  maxKg: 3500, truck: 'Tata Ultra T.7'  },
  { id: 'SH-007', lane: 'Delhi → Gurgaon',         distKm: 32,  weightKg: 300,  maxKg: 1500, truck: 'Mahindra Bolero' },
].map(s => {
  const loadFactor  = s.weightKg / s.maxKg;
  const co2Kg       = +(s.distKm * loadFactor * 0.21).toFixed(1);
  const co2Baseline = +(s.distKm * 1.0        * 0.21).toFixed(1);   // fully loaded baseline
  const saved       = +(co2Baseline - co2Kg).toFixed(1);
  const risk        = co2Kg > 50 ? 'HIGH' : co2Kg > 25 ? 'MEDIUM' : 'LOW';
  return { ...s, co2Kg, co2Baseline, saved, loadFactor: +(loadFactor * 100).toFixed(0), risk };
});

// High-emission lanes (sorted desc)
const HIGH_EMISSION_LANES = [...SHIPMENT_EMISSIONS]
  .sort((a, b) => b.co2Kg - a.co2Kg)
  .map(s => ({ lane: s.lane, co2: s.co2Kg, risk: s.risk }));

// AI reduction opportunities
const REDUCTION_OPPS = [
  {
    lane: 'Hyderabad → Kurnool',
    finding: 'Load factor only 60% — consolidate with Kurnool Industrial shipment. Estimated saving: 18.4 kg CO₂/run.',
    saving: 18.4, effort: 'Low', color: '#10b981',
  },
  {
    lane: 'Delhi NCR → Jaipur',
    finding: 'Night departures (22:00–05:00) show 12% lower fuel burn due to traffic reduction. Shift scheduling recommended.',
    saving: 12.1, effort: 'Low', color: '#f59e0b',
  },
  {
    lane: 'Bangalore → Chennai',
    finding: 'Switch to BharatBenz 1015R (BS6 Euro 6 equivalent) from current Eicher. Emission factor drops from 0.21 → 0.16 kg/km.',
    saving: 24.5, effort: 'Medium', color: '#3b82f6',
  },
];

// Agent pipeline steps
const AGENT_STEPS = [
  { key: 'ingest',   label: 'Data Ingestion',        desc: 'Pull shipment & route data',          ms: 120 },
  { key: 'estimate', label: 'Emission Estimation',    desc: 'Apply 0.21 kg CO₂/km × load factor', ms: 85  },
  { key: 'lane',     label: 'Lane Profiling',         desc: 'Rank corridors by emission intensity', ms: 45  },
  { key: 'opps',     label: 'Opportunity Detection',  desc: 'Identify consolidation + mode shifts', ms: 200 },
  { key: 'insights', label: 'AI Insight Generation',  desc: 'Gemini-powered sustainability report', ms: 1800 },
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

const riskColor = (r: string) =>
  r === 'HIGH' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
  r === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

export function CarbonTracking() {
  const co2Saved   = useCountUp(12.4);
  const greenMiles = useCountUp(45678, 2000, 0);
  const esgScore   = useCountUp(87, 1200, 0);

  // Carbon Intelligence Agent state
  const [agentRunning, setAgentRunning]   = useState(false);
  const [agentDone, setAgentDone]         = useState(false);
  const [activeStep, setActiveStep]       = useState(-1);
  const [stepTimes, setStepTimes]         = useState<number[]>([]);

  const runAgent = useCallback(async () => {
    setAgentRunning(true); setAgentDone(false); setActiveStep(0); setStepTimes([]);
    const times: number[] = [];
    for (let i = 0; i < AGENT_STEPS.length; i++) {
      setActiveStep(i);
      await new Promise(r => setTimeout(r, AGENT_STEPS[i].ms));
      times.push(AGENT_STEPS[i].ms);
      setStepTimes([...times]);
    }
    setAgentRunning(false); setAgentDone(true); setActiveStep(-1);
  }, []);

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

      {/* ── CARBON INTELLIGENCE AGENT ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-green-900/20 via-eco-card to-emerald-900/10 border border-green-500/20 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
                <Brain className="w-5 h-5 text-green-400" />
              </div>
              Carbon Intelligence Agent
            </h2>
            <p className="text-gray-400 text-sm mt-1">AI-powered emission estimation · Lane profiling · Reduction opportunity detection</p>
          </div>
          <button
            onClick={runAgent}
            disabled={agentRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-sm hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 transition-all shadow-lg shadow-green-600/20"
          >
            {agentRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {agentRunning ? 'Analysing…' : agentDone ? 'Re-run Analysis' : 'Run Carbon Agent'}
          </button>
        </div>

        {/* Agent pipeline */}
        <div className="flex items-start gap-1 overflow-x-auto pb-1">
          {AGENT_STEPS.map((step, i) => {
            const isDone    = stepTimes[i] != null;
            const isRunning = agentRunning && activeStep === i;
            return (
              <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                <div className={`rounded-xl border p-3 min-w-[130px] transition-all ${
                  isDone    ? 'border-green-500/30 bg-green-500/8'  :
                  isRunning ? 'border-green-400/50 bg-green-500/10 animate-pulse' :
                              'border-white/5 bg-white/2'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {isDone    ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> :
                     isRunning ? <Loader2 className="w-3.5 h-3.5 text-green-400 animate-spin flex-shrink-0" /> :
                                 <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />}
                    <span className={`text-[10px] font-bold ${isDone || isRunning ? 'text-green-400' : 'text-gray-600'}`}>{step.label}</span>
                  </div>
                  <div className="text-[9px] text-gray-500 leading-tight">{step.desc}</div>
                  {isDone && <div className="text-[9px] font-mono text-green-400 mt-1">{step.ms}ms</div>}
                </div>
                {i < AGENT_STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />}
              </div>
            );
          })}
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

      {/* ── SHIPMENT-LEVEL EMISSION ESTIMATOR ─────────────────────────────── */}
      <div className="bg-eco-card border border-eco-card-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-eco-card-border flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2"><Truck className="w-4 h-4 text-green-400" /> Shipment-Level Emission Estimator</h3>
            <p className="text-xs text-gray-500 mt-0.5">Model: CO₂ (kg) = Distance × (Weight / MaxCapacity) × 0.21 kg/km</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-semibold">LIVE MODEL</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-eco-card-border">
                {['Shipment', 'Lane', 'Dist (km)', 'Weight', 'Load %', 'CO₂ Est.', 'Baseline', 'Saved', 'Risk'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIPMENT_EMISSIONS.map((s, i) => (
                <tr key={s.id} className={`border-b border-eco-card-border/50 hover:bg-white/2 transition-colors ${i % 2 === 0 ? 'bg-white/1' : ''}`}>
                  <td className="px-4 py-3 font-mono text-orange-400 text-xs font-semibold">{s.id}</td>
                  <td className="px-4 py-3 text-white text-xs whitespace-nowrap">{s.lane}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{s.distKm}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{s.weightKg.toLocaleString()} kg</td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-gray-700/40 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.loadFactor}%` }} />
                      </div>
                      <span className="text-gray-300">{s.loadFactor}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-white text-xs">{s.co2Kg} kg</td>
                  <td className="px-4 py-3 text-red-400/70 text-xs line-through">{s.co2Baseline} kg</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold text-xs">↓{s.saved} kg</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${riskColor(s.risk)}`}>{s.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── HIGH EMISSION LANES + REDUCTION OPPORTUNITIES ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* High-emission lanes bar chart */}
        <div className="bg-eco-card border border-eco-card-border rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2"><Flame className="w-4 h-4 text-red-400" /> High-Emission Lane Identification</h3>
          <p className="text-xs text-gray-500 mb-4">CO₂ kg per shipment — AI flags corridors above threshold</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={HIGH_EMISSION_LANES} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" horizontal={false} />
              <XAxis type="number" stroke="#4B5563" tickLine={false} axisLine={false} fontSize={10} />
              <YAxis type="category" dataKey="lane" stroke="#4B5563" tickLine={false} axisLine={false} fontSize={9} width={130} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1e2438', color: '#fff', borderRadius: 8 }}
                formatter={(v: any) => [`${v} kg CO₂`, 'Emission']}
              />
              <Bar dataKey="co2" radius={[0, 4, 4, 0]} barSize={18}>
                {HIGH_EMISSION_LANES.map((entry, i) => (
                  <Cell key={i} fill={entry.risk === 'HIGH' ? '#ef4444' : entry.risk === 'MEDIUM' ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-end">
            {[['HIGH', '#ef4444'], ['MEDIUM', '#f59e0b'], ['LOW', '#10b981']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color as string }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Reduction opportunities */}
        <div className="bg-eco-card border border-eco-card-border rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> AI Reduction Opportunities</h3>
          <p className="text-xs text-gray-500 mb-4">Carbon agent-identified optimisation actions</p>
          <div className="space-y-3">
            {REDUCTION_OPPS.map((opp, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/2 p-4 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-bold text-white">{opp.lane}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                      opp.effort === 'Low' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>{opp.effort} effort</span>
                    <span className="text-[10px] font-bold text-emerald-400">↓{opp.saving} kg CO₂</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{opp.finding}</p>
                <div className="mt-2 h-1 w-full bg-gray-700/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min((opp.saving / 30) * 100, 100)}%`, backgroundColor: opp.color }} />
                </div>
              </div>
            ))}
          </div>
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
              <Area type="monotone" dataKey="actual"   stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActual)"   name="With FairRelay" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

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

import { useState, useCallback } from 'react';
import {
  FileText, Upload, CheckCircle2, AlertTriangle, XCircle,
  Brain, RefreshCw, Download, Sparkles, Shield, ArrowRight,
  Loader2, Receipt, Truck, Activity, Clock,
  TrendingUp, ChevronDown, ChevronUp, Edit3, Check, X,
  Eye, BarChart3, Scale, Info, Layers, FileCheck,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
type DiscStatus = 'open' | 'approved' | 'rejected' | 'corrected';
type MatchStatus = 'match' | 'partial' | 'mismatch' | 'missing';

interface FieldRow {
  key: string;
  label: string;
  lr: string;
  pod: string;
  invoice: string;
  match: MatchStatus;
  risk: RiskLevel;
}

interface Discrepancy {
  id: string;
  field: string;
  type: 'amount' | 'weight' | 'date' | 'party' | 'reference';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  lr: string;
  pod: string;
  invoice: string;
  description: string;
  recommendation: string;
  status: DiscStatus;
  expanded: boolean;
}

// ── Demo Data ─────────────────────────────────────────────────────────────────
const DEMO_FIELDS: FieldRow[] = [
  { key: 'lr_no',       label: 'LR / Reference No.',  lr: 'LR-2026-05-7841',          pod: 'LR-2026-05-7841',       invoice: 'LR-2026-05-7841',           match: 'match',    risk: 'OK'     },
  { key: 'date',        label: 'Document Date',        lr: '16-May-2026',               pod: '17-May-2026',           invoice: '15-May-2026',               match: 'partial',  risk: 'LOW'    },
  { key: 'consignor',   label: 'Consignor / Ship-From',lr: 'Unilever India Ltd, Mumbai',pod: '—',                     invoice: 'Unilever India Ltd, Mumbai',match: 'match',    risk: 'OK'     },
  { key: 'consignee',   label: 'Consignee / Bill-To',  lr: 'Reliance Fresh Pvt Ltd',   pod: 'Reliance Fresh Pvt Ltd',invoice: 'Reliance Fresh Pvt. Ltd.',  match: 'partial',  risk: 'LOW'    },
  { key: 'truck',       label: 'Vehicle No.',           lr: 'MH-12-AB-3456',             pod: 'MH-12-AB-3456',         invoice: '—',                         match: 'match',    risk: 'OK'     },
  { key: 'description', label: 'Goods Description',    lr: 'FMCG Goods — 48 cartons',  pod: '48 cartons delivered',  invoice: 'FMCG Goods — 48 cartons',   match: 'match',    risk: 'OK'     },
  { key: 'weight',      label: 'Weight (kg)',           lr: '1,240 kg',                  pod: '1,220 kg',              invoice: '1,240 kg',                  match: 'mismatch', risk: 'MEDIUM' },
  { key: 'freight',     label: 'Freight / Base Amount', lr: '₹42,500',                  pod: '—',                     invoice: '₹45,200',                   match: 'mismatch', risk: 'HIGH'   },
  { key: 'insurance',   label: 'Insurance',             lr: '₹500',                     pod: '—',                     invoice: '₹500',                      match: 'match',    risk: 'OK'     },
  { key: 'total',       label: 'Invoice Total',         lr: '—',                        pod: '—',                     invoice: '₹53,868',                   match: 'missing',  risk: 'OK'     },
  { key: 'receiver',    label: 'Received By',           lr: '—',                        pod: 'Suresh Kumar',          invoice: '—',                         match: 'match',    risk: 'OK'     },
  { key: 'condition',   label: 'Goods Condition',       lr: '—',                        pod: 'Good — No damage',      invoice: '—',                         match: 'match',    risk: 'OK'     },
];

const INITIAL_DISCREPANCIES: Discrepancy[] = [
  {
    id: 'd1', field: 'Freight / Base Amount', type: 'amount', severity: 'HIGH',
    lr: '₹42,500', pod: '—', invoice: '₹45,200',
    description: 'Invoice base amount exceeds LR agreed freight by ₹2,700 (6.4% over-billing). This exceeds the ±3% auto-approval threshold.',
    recommendation: 'Obtain vendor justification or request revised invoice. Do not approve payment until resolved.',
    status: 'open', expanded: false,
  },
  {
    id: 'd2', field: 'Weight (kg)', type: 'weight', severity: 'MEDIUM',
    lr: '1,240 kg', pod: '1,220 kg', invoice: '1,240 kg',
    description: 'POD records 20 kg less than LR dispatched weight. Possible in-transit loss, mismeasurement, or loading error. Freight charged on original weight.',
    recommendation: 'Verify with driver and warehouse. If shortage confirmed, raise debit note for 20 kg × freight rate.',
    status: 'open', expanded: false,
  },
  {
    id: 'd3', field: 'Document Date', type: 'date', severity: 'LOW',
    lr: '16-May-2026 (LR date)', pod: '17-May-2026 (delivery)', invoice: '15-May-2026 (invoice date)',
    description: 'Invoice dated one day before LR creation — invoice pre-dates the lorry receipt. May indicate backdating.',
    recommendation: 'Flag for finance audit. Acceptable if invoice was raised on goods dispatch from factory before LR issuance.',
    status: 'open', expanded: false,
  },
  {
    id: 'd4', field: 'Consignee Name', type: 'party', severity: 'LOW',
    lr: 'Reliance Fresh Pvt Ltd', pod: 'Reliance Fresh Pvt Ltd', invoice: 'Reliance Fresh Pvt. Ltd.',
    description: 'Minor punctuation difference in consignee name (period after "Pvt"). Likely same entity.',
    recommendation: 'Auto-approve after fuzzy name matching confirms 98% similarity score. Update vendor master.',
    status: 'approved', expanded: false,
  },
];

const AGENT_STEPS = [
  { key: 'ocr',     label: 'OCR Extraction',     desc: 'Extract text & structured fields from LR, POD, Invoice PDFs', icon: Eye,         ms: 900  },
  { key: 'map',     label: 'Field Mapping',       desc: 'NLP-based key-value alignment across document schemas',        icon: Layers,      ms: 600  },
  { key: 'match',   label: 'Document Matching',   desc: 'Cross-reference all shared fields for LR ↔ POD ↔ Invoice',    icon: Scale,       ms: 750  },
  { key: 'detect',  label: 'Discrepancy Detection',desc: 'Identify amount, weight, date & party mismatches',            icon: AlertTriangle,ms: 500 },
  { key: 'risk',    label: 'Risk Scoring',         desc: 'Assign severity & auto-approve LOW-risk variations',           icon: Shield,      ms: 400  },
];

const accuracyTrend = [
  { month: 'Nov', accuracy: 67, manual: 33 },
  { month: 'Dec', accuracy: 72, manual: 28 },
  { month: 'Jan', accuracy: 78, manual: 22 },
  { month: 'Feb', accuracy: 83, manual: 17 },
  { month: 'Mar', accuracy: 87, manual: 13 },
  { month: 'Apr', accuracy: 91, manual: 9  },
  { month: 'May', accuracy: 94, manual: 6  },
];

const discTypeData = [
  { type: 'Amount',    count: 34, color: '#EF4444' },
  { type: 'Weight',    count: 22, color: '#F59E0B' },
  { type: 'Date',      count: 18, color: '#3B82F6' },
  { type: 'Party',     count: 12, color: '#8B5CF6' },
  { type: 'Reference', count: 7,  color: '#10B981' },
];

const processingTime = [
  { month: 'Nov', minutes: 42 },
  { month: 'Dec', minutes: 35 },
  { month: 'Jan', minutes: 28 },
  { month: 'Feb', minutes: 19 },
  { month: 'Mar', minutes: 12 },
  { month: 'Apr', minutes: 7  },
  { month: 'May', minutes: 4  },
];

const recentActivity = [
  { id: 'INV-4418', lr: 'LR-7835', score: 97, risk: 'OK',    action: 'Auto-approved', time: '2m ago'  },
  { id: 'INV-4419', lr: 'LR-7836', score: 84, risk: 'MEDIUM',action: 'Sent for review',time: '18m ago' },
  { id: 'INV-4420', lr: 'LR-7837', score: 99, risk: 'OK',    action: 'Auto-approved', time: '1h ago'  },
  { id: 'INV-4421', lr: 'LR-7841', score: 73, risk: 'HIGH',  action: 'Escalated',     time: '2h ago'  },
  { id: 'INV-4416', lr: 'LR-7829', score: 91, risk: 'LOW',   action: 'Auto-approved', time: '3h ago'  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function riskBadge(risk: RiskLevel | 'OK') {
  const map: Record<string, string> = {
    HIGH:    'bg-red-500/15 text-red-400 border-red-500/30',
    MEDIUM:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    LOW:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
    OK:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return `px-2 py-0.5 rounded-full text-xs font-bold border ${map[risk] ?? map.LOW}`;
}

function matchIcon(match: MatchStatus) {
  if (match === 'match')    return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (match === 'partial')  return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
  if (match === 'mismatch') return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  return <Info className="w-4 h-4 text-slate-500 shrink-0" />;
}

function severityColor(s: string) {
  if (s === 'HIGH')   return 'border-red-500/40 bg-red-500/5';
  if (s === 'MEDIUM') return 'border-amber-500/40 bg-amber-500/5';
  return 'border-blue-500/40 bg-blue-500/5';
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function InvoiceReconciliation() {
  const [phase, setPhase] = useState<'upload' | 'processing' | 'results'>('upload');
  const [agentProgress, setAgentProgress] = useState<Record<string, 'pending' | 'running' | 'done'>>({});
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>(INITIAL_DISCREPANCIES);
  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'discrepancies' | 'history'>('overview');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [insightDone, setInsightDone] = useState(false);

  const INSIGHT = 'Invoice INV-4421 carries a HIGH-risk freight amount discrepancy of ₹2,700 (6.4%) and a MEDIUM-risk 20 kg weight shortage at delivery. The date sequence anomaly (invoice pre-dates LR by 1 day) warrants finance team review but is not unusual for factory-dispatch scenarios. The consignee name variation has been auto-approved with 98% fuzzy-match confidence. Recommend holding payment pending vendor clarification on the freight overage. System has learned 3 new patterns from this reconciliation to improve future matching accuracy.';

  const runPipeline = useCallback(async () => {
    setPhase('processing');
    setAgentProgress({});
    setInsightDone(false);
    setAiInsight('');

    for (const step of AGENT_STEPS) {
      setAgentProgress(p => ({ ...p, [step.key]: 'running' }));
      await new Promise(r => setTimeout(r, step.ms));
      setAgentProgress(p => ({ ...p, [step.key]: 'done' }));
    }

    setPhase('results');
    setActiveTab('overview');

    // typewriter insight
    let i = 0;
    const tick = () => {
      if (i < INSIGHT.length) {
        setAiInsight(INSIGHT.slice(0, ++i));
        setTimeout(tick, 14);
      } else {
        setInsightDone(true);
      }
    };
    setTimeout(tick, 400);
  }, []);

  const updateDisc = useCallback((id: string, status: DiscStatus, corrected?: string) => {
    setDiscrepancies(prev => prev.map(d =>
      d.id === id
        ? { ...d, status, ...(corrected ? { invoice: corrected } : {}) }
        : d
    ));
    setEditingId(null);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setDiscrepancies(prev => prev.map(d =>
      d.id === id ? { ...d, expanded: !d.expanded } : d
    ));
  }, []);

  const openCount   = discrepancies.filter(d => d.status === 'open').length;
  const matchScore  = Math.round(DEMO_FIELDS.filter(f => f.match === 'match').length / DEMO_FIELDS.length * 100);

  // ── Upload Phase ────────────────────────────────────────────────────────────
  if (phase === 'upload') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30">
                <Receipt className="w-6 h-6 text-orange-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Invoice Reconciliation AI</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400">LR-POD-Invoice Matching</span>
            </div>
            <p className="text-eco-text-secondary text-sm max-w-2xl">
              Upload Lorry Receipt, Proof of Delivery, and Invoice — the 5-agent AI pipeline extracts, matches, and flags discrepancies in seconds.
            </p>
          </div>
          <button
            onClick={runPipeline}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Run AI Analysis
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Processed', value: '1,284', icon: FileText, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
            { label: 'Auto-Approved', value: '1,102', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Flagged for Review', value: '147', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Avg. Process Time', value: '4 min', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-eco-text-secondary">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Upload zones */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { type: 'Lorry Receipt (LR)', icon: Truck, color: 'orange', file: 'LR-2026-05-7841.pdf', size: '284 KB', uploaded: true },
            { type: 'Proof of Delivery (POD)', icon: FileCheck, color: 'emerald', file: 'POD-9123-Reliance-Pune.pdf', size: '141 KB', uploaded: true },
            { type: 'Tax Invoice', icon: Receipt, color: 'blue', file: 'INV-4421-Unilever.pdf', size: '318 KB', uploaded: true },
          ].map(doc => (
            <div
              key={doc.type}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer hover:scale-[1.02] ${
                doc.uploaded
                  ? `border-${doc.color}-500/50 bg-${doc.color}-500/5`
                  : 'border-eco-card-border bg-eco-secondary/30 hover:border-orange-500/40'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                doc.uploaded ? `bg-${doc.color}-500/15 border border-${doc.color}-500/30` : 'bg-eco-secondary'
              }`}>
                <doc.icon className={`w-7 h-7 ${doc.uploaded ? `text-${doc.color}-400` : 'text-eco-text-secondary'}`} />
              </div>
              <div className="font-semibold text-white text-sm mb-1">{doc.type}</div>
              {doc.uploaded ? (
                <>
                  <div className="text-xs text-eco-text-secondary mb-3">{doc.file}</div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 text-${doc.color}-400`} />
                    <span className={`text-xs text-${doc.color}-400 font-medium`}>Ready · {doc.size}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-eco-text-secondary mb-3">Drag & drop or click to upload</div>
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-eco-text-secondary" />
                    <span className="text-xs text-eco-text-secondary">PDF, JPG, PNG — max 10 MB</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Agent pipeline preview */}
        <div className="rounded-2xl border border-eco-card-border bg-eco-secondary/20 p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-orange-400" /> AI Pipeline — 5 Agents
          </h3>
          <div className="flex items-center gap-0">
            {AGENT_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex-1 flex flex-col items-center gap-2 text-center px-2">
                  <div className="w-10 h-10 rounded-xl bg-eco-secondary border border-eco-card-border flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-eco-text-secondary" />
                  </div>
                  <div className="text-xs text-eco-text-secondary font-medium">{step.label}</div>
                  <div className="text-[10px] text-eco-text-secondary/60 leading-tight">{step.desc}</div>
                </div>
                {i < AGENT_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-eco-card-border shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-eco-card-border bg-eco-secondary/20 p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" /> Recent Reconciliations
          </h3>
          <div className="space-y-2">
            {recentActivity.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-eco-secondary/40 hover:bg-eco-secondary/70 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-3.5 h-3.5 text-eco-text-secondary" />
                  <span className="text-sm font-medium text-white">{r.id}</span>
                  <span className="text-xs text-eco-text-secondary">↔ {r.lr}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${r.score >= 90 ? 'text-emerald-400' : r.score >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{r.score}% match</span>
                  <span className={riskBadge(r.risk as RiskLevel)}>{r.risk}</span>
                  <span className="text-xs text-eco-text-secondary">{r.action}</span>
                  <span className="text-xs text-eco-text-secondary/50">{r.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Processing Phase ────────────────────────────────────────────────────────
  if (phase === 'processing') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-10">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">AI Pipeline Running</h2>
          <p className="text-eco-text-secondary text-sm">Extracting, matching and scoring LR-2026-05-7841 ↔ POD-9123 ↔ INV-4421</p>
        </div>

        <div className="w-full max-w-2xl space-y-3">
          {AGENT_STEPS.map((step, idx) => {
            const status = agentProgress[step.key] ?? 'pending';
            return (
              <div key={step.key} className={`rounded-xl border px-5 py-4 flex items-center gap-4 transition-all duration-500 ${
                status === 'done'    ? 'border-emerald-500/40 bg-emerald-500/5'
                : status === 'running' ? 'border-orange-500/40 bg-orange-500/5'
                : 'border-eco-card-border bg-eco-secondary/20 opacity-40'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  status === 'done'    ? 'bg-emerald-500/20'
                  : status === 'running' ? 'bg-orange-500/20'
                  : 'bg-eco-secondary'
                }`}>
                  {status === 'done'    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  : status === 'running' ? <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                  : <step.icon className="w-5 h-5 text-eco-text-secondary" />}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${status === 'done' ? 'text-emerald-400' : status === 'running' ? 'text-orange-400' : 'text-eco-text-secondary'}`}>
                    {idx + 1}. {step.label}
                  </div>
                  <div className="text-xs text-eco-text-secondary">{step.desc}</div>
                </div>
                {status === 'done' && <span className="text-xs text-emerald-400 font-medium">Done</span>}
                {status === 'running' && <span className="text-xs text-orange-400 font-medium animate-pulse">Running…</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Results Phase ───────────────────────────────────────────────────────────
  const openDiscs   = discrepancies.filter(d => d.status === 'open');
  const highDiscs   = openDiscs.filter(d => d.severity === 'HIGH');
  const overallRisk = highDiscs.length > 0 ? 'HIGH' : openDiscs.length > 0 ? 'MEDIUM' : 'OK';

  const tabs = [
    { key: 'overview',      label: 'Overview',        icon: BarChart3   },
    { key: 'fields',        label: 'Field Comparison', icon: Layers     },
    { key: 'discrepancies', label: `Discrepancies (${openCount})`, icon: AlertTriangle },
    { key: 'history',       label: 'Analytics',       icon: TrendingUp  },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30">
              <Receipt className="w-5 h-5 text-orange-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Invoice Reconciliation — INV-4421</h1>
            <span className={riskBadge(overallRisk as RiskLevel)}>
              {overallRisk === 'OK' ? '✓ CLEAN' : overallRisk === 'HIGH' ? '⚠ HIGH RISK' : '~ REVIEW'}
            </span>
          </div>
          <p className="text-eco-text-secondary text-xs ml-11">LR-2026-05-7841 · POD-9123 · INV-4421 · Unilever India → Reliance Fresh, Pune</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPhase('upload'); setDiscrepancies(INITIAL_DISCREPANCIES); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-eco-secondary border border-eco-card-border text-eco-text-secondary hover:text-white text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New Analysis
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-eco-secondary border border-eco-card-border text-eco-text-secondary hover:text-white text-xs transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Match Score',       value: `${matchScore}%`, sub: '9 of 12 fields match',        color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Open Discrepancies', value: openCount.toString(),  sub: `${discrepancies.filter(d=>d.severity==='HIGH'&&d.status==='open').length} high severity`, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Amount Difference', value: '₹2,700',  sub: '6.4% over-billing',                  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Weight Variance',   value: '−20 kg',  sub: 'POD vs LR at delivery',              color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'AI Confidence',     value: '94%',     sub: 'Pattern match confidence',            color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-3 ${k.bg}`}>
            <div className="text-xs text-eco-text-secondary mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[10px] text-eco-text-secondary mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Gemini 2.5 Flash · AI Reconciliation Insight</span>
          {!insightDone && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin ml-auto" />}
        </div>
        <p className="text-sm text-eco-text-secondary leading-relaxed">
          {aiInsight}<span className={`inline-block w-0.5 h-4 bg-purple-400 ml-0.5 align-middle ${insightDone ? 'hidden' : 'animate-pulse'}`} />
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-eco-secondary/40 border border-eco-card-border w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md'
                : 'text-eco-text-secondary hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Document summary cards */}
          <div className="col-span-2 grid grid-cols-3 gap-4">
            {[
              { title: 'Lorry Receipt', subtitle: 'LR-2026-05-7841', icon: Truck,        color: 'orange', lines: ['Date: 16-May-2026', 'Consignor: Unilever India Ltd', 'Consignee: Reliance Fresh', 'Weight: 1,240 kg', 'Freight: ₹42,500'] },
              { title: 'Proof of Delivery', subtitle: 'POD-9123',     icon: FileCheck,    color: 'emerald',lines: ['Delivery: 17-May-2026', 'Received by: Suresh Kumar', 'Cartons: 48 ✓', 'Weight: 1,220 kg', 'Condition: Good'] },
              { title: 'Tax Invoice',   subtitle: 'INV-4421',          icon: Receipt,      color: 'blue',   lines: ['Date: 15-May-2026', 'Bill-To: Reliance Fresh Pvt. Ltd.', 'Base: ₹45,200', 'GST 18%: ₹8,136', 'Total: ₹53,868'] },
            ].map(doc => (
              <div key={doc.title} className={`rounded-2xl border border-${doc.color}-500/25 bg-${doc.color}-500/5 p-5`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl bg-${doc.color}-500/15 border border-${doc.color}-500/30 flex items-center justify-center`}>
                    <doc.icon className={`w-4.5 h-4.5 text-${doc.color}-400`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{doc.title}</div>
                    <div className="text-xs text-eco-text-secondary">{doc.subtitle}</div>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 text-${doc.color}-400 ml-auto`} />
                </div>
                <div className="space-y-1.5">
                  {doc.lines.map(l => (
                    <div key={l} className="text-xs text-eco-text-secondary flex items-center gap-2">
                      <span className={`w-1 h-1 rounded-full bg-${doc.color}-400 shrink-0`} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Discrepancy summary */}
          <div className="rounded-2xl border border-eco-card-border bg-eco-secondary/20 p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Discrepancy Summary
            </h3>
            <div className="space-y-3">
              {discrepancies.map(d => (
                <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-eco-secondary/40">
                  <div className="flex items-center gap-2">
                    {d.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : d.status === 'rejected' ? <XCircle className="w-3.5 h-3.5 text-red-400" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    <span className="text-xs text-white font-medium">{d.field}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={riskBadge(d.severity as RiskLevel)}>{d.severity}</span>
                    <span className={`text-xs font-medium ${
                      d.status === 'approved' ? 'text-emerald-400'
                      : d.status === 'rejected' ? 'text-red-400'
                      : d.status === 'corrected' ? 'text-blue-400'
                      : 'text-amber-400'
                    }`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" /> AI Recommendation
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <XCircle className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-red-400">HOLD PAYMENT — ESCALATE</div>
                <div className="text-xs text-eco-text-secondary mt-0.5">Amount discrepancy ₹2,700 exceeds ±3% auto-approval limit. Requires finance manager sign-off.</div>
              </div>
            </div>
            <div className="space-y-2 text-xs text-eco-text-secondary">
              <div className="flex items-start gap-2"><span className="text-orange-400 font-bold mt-0.5">①</span> Contact vendor for revised invoice or justification note</div>
              <div className="flex items-start gap-2"><span className="text-amber-400 font-bold mt-0.5">②</span> Raise debit note for 20 kg shortage (LR vs POD)</div>
              <div className="flex items-start gap-2"><span className="text-blue-400 font-bold mt-0.5">③</span> Confirm invoice backdating with shipper finance team</div>
              <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">④</span> Consignee name variation auto-approved (98% fuzzy match)</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Field Comparison ── */}
      {activeTab === 'fields' && (
        <div className="rounded-2xl border border-eco-card-border overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_70px] bg-eco-secondary/60 border-b border-eco-card-border text-xs font-semibold text-eco-text-secondary uppercase tracking-wide">
            <div className="px-4 py-3">Field</div>
            <div className="px-4 py-3">Lorry Receipt</div>
            <div className="px-4 py-3">POD</div>
            <div className="px-4 py-3">Invoice</div>
            <div className="px-4 py-3">Match</div>
            <div className="px-4 py-3">Risk</div>
          </div>
          {DEMO_FIELDS.map((row, i) => (
            <div key={row.key} className={`grid grid-cols-[2fr_1fr_1fr_1fr_80px_70px] border-b border-eco-card-border/50 text-sm transition-colors ${i % 2 === 0 ? 'bg-eco-secondary/10' : ''} hover:bg-eco-secondary/30 ${row.match === 'mismatch' ? 'bg-red-500/5' : row.match === 'partial' ? 'bg-amber-500/5' : ''}`}>
              <div className="px-4 py-3 text-white font-medium">{row.label}</div>
              <div className={`px-4 py-3 text-xs font-mono ${row.match === 'mismatch' ? 'text-red-400' : 'text-eco-text-secondary'}`}>{row.lr}</div>
              <div className={`px-4 py-3 text-xs font-mono ${row.match === 'mismatch' && row.pod !== '—' ? 'text-amber-400' : 'text-eco-text-secondary'}`}>{row.pod}</div>
              <div className={`px-4 py-3 text-xs font-mono ${row.match === 'mismatch' ? 'text-red-400' : 'text-eco-text-secondary'}`}>{row.invoice}</div>
              <div className="px-4 py-3 flex items-center gap-1.5">
                {matchIcon(row.match)}
                <span className="text-xs text-eco-text-secondary capitalize">{row.match}</span>
              </div>
              <div className="px-4 py-3"><span className={riskBadge(row.risk)}>{row.risk}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Discrepancies ── */}
      {activeTab === 'discrepancies' && (
        <div className="space-y-4">
          {discrepancies.map(d => (
            <div key={d.id} className={`rounded-2xl border p-5 transition-all ${severityColor(d.severity)} ${d.status !== 'open' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                    d.severity === 'HIGH' ? 'bg-red-500/20' : d.severity === 'MEDIUM' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${d.severity === 'HIGH' ? 'text-red-400' : d.severity === 'MEDIUM' ? 'text-amber-400' : 'text-blue-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{d.field}</span>
                      <span className={riskBadge(d.severity as RiskLevel)}>{d.severity}</span>
                      <span className="text-xs text-eco-text-secondary capitalize bg-eco-secondary/50 px-2 py-0.5 rounded-full">{d.type}</span>
                      {d.status !== 'open' && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          d.status === 'approved' ? 'text-emerald-400 bg-emerald-400/10'
                          : d.status === 'rejected' ? 'text-red-400 bg-red-400/10'
                          : 'text-blue-400 bg-blue-400/10'
                        }`}>{d.status}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-xs"><span className="text-eco-text-secondary">LR: </span><span className="text-white font-mono">{d.lr}</span></div>
                      <div className="text-xs"><span className="text-eco-text-secondary">POD: </span><span className="text-white font-mono">{d.pod}</span></div>
                      <div className="text-xs"><span className="text-eco-text-secondary">Invoice: </span>
                        {editingId === d.id ? (
                          <input
                            className="bg-eco-secondary border border-orange-500/40 rounded px-1.5 text-white font-mono text-xs w-28"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <span className="text-white font-mono">{d.invoice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleExpand(d.id)} className="text-eco-text-secondary hover:text-white transition-colors shrink-0 mt-1">
                  {d.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {d.expanded && (
                <div className="ml-11 mt-2 space-y-3">
                  <div className="text-xs text-eco-text-secondary leading-relaxed bg-eco-secondary/30 rounded-lg p-3">
                    <span className="font-semibold text-white">Finding: </span>{d.description}
                  </div>
                  <div className="text-xs text-eco-text-secondary leading-relaxed bg-eco-secondary/30 rounded-lg p-3">
                    <span className="font-semibold text-white">Recommendation: </span>{d.recommendation}
                  </div>
                </div>
              )}

              {d.status === 'open' && (
                <div className="ml-11 mt-3 flex items-center gap-2">
                  {editingId === d.id ? (
                    <>
                      <button onClick={() => updateDisc(d.id, 'corrected', editValue)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors">
                        <Check className="w-3.5 h-3.5" /> Save Correction
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-eco-secondary border border-eco-card-border text-eco-text-secondary text-xs hover:text-white transition-colors">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => updateDisc(d.id, 'approved')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => updateDisc(d.id, 'rejected')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button onClick={() => { setEditingId(d.id); setEditValue(d.invoice); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-eco-secondary border border-eco-card-border text-eco-text-secondary text-xs hover:text-white transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> Correct Value
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {openCount === 0 && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <div className="text-lg font-bold text-emerald-400 mb-1">All Discrepancies Resolved</div>
              <div className="text-sm text-eco-text-secondary">Invoice INV-4421 is ready for payment processing.</div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Analytics ── */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Accuracy trend */}
          <div className="rounded-2xl border border-eco-card-border bg-eco-secondary/20 p-5">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Reconciliation Accuracy Trend
            </h3>
            <p className="text-xs text-eco-text-secondary mb-4">% of invoices auto-approved vs. manual review (6 months)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={accuracyTrend}>
                <defs>
                  <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}  />
                  </linearGradient>
                  <linearGradient id="gMan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}  />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: '#0A0F1C', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="accuracy" stroke="#10B981" fill="url(#gAcc)" strokeWidth={2} name="Auto-approved %" />
                <Area type="monotone" dataKey="manual"   stroke="#EF4444" fill="url(#gMan)" strokeWidth={2} name="Manual review %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Discrepancy types */}
          <div className="rounded-2xl border border-eco-card-border bg-eco-secondary/20 p-5">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-400" /> Discrepancy Types (All-Time)
            </h3>
            <p className="text-xs text-eco-text-secondary mb-4">Most common mismatch categories across 1,284 invoices</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={discTypeData} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={65} />
                <Tooltip contentStyle={{ background: '#0A0F1C', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Count">
                  {discTypeData.map(d => <Cell key={d.type} fill={d.color} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Processing time */}
          <div className="rounded-2xl border border-eco-card-border bg-eco-secondary/20 p-5">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Avg. Processing Time (minutes)
            </h3>
            <p className="text-xs text-eco-text-secondary mb-4">AI learns from corrections — processing gets faster over time</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={processingTime}>
                <defs>
                  <linearGradient id="gTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}  />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} unit="m" />
                <Tooltip contentStyle={{ background: '#0A0F1C', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="minutes" stroke="#3B82F6" fill="url(#gTime)" strokeWidth={2} name="Minutes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Learning stats */}
          <div className="rounded-2xl border border-eco-card-border bg-eco-secondary/20 p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> Continuous Learning Stats
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Patterns Learned', value: '847', delta: '+23 this month', color: 'text-purple-400' },
                { label: 'Vendor Profiles',  value: '312', delta: '+8 new vendors',  color: 'text-blue-400'   },
                { label: 'False Positives Eliminated', value: '94.2%', delta: '+2.1% vs last month', color: 'text-emerald-400' },
                { label: 'Avg Fuzzy Match Threshold',  value: '96.8%', delta: 'Name disambiguation',  color: 'text-orange-400'  },
                { label: 'Corrections Incorporated',   value: '1,102', delta: 'Feedback entries',      color: 'text-amber-400'   },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-eco-card-border/30 last:border-0">
                  <span className="text-xs text-eco-text-secondary">{s.label}</span>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-eco-text-secondary">{s.delta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

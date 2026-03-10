import { BarChart3 } from 'lucide-react';

interface CognitiveFactors {
  fatigue: number;
  decisionFatigue: number;
  circadian: number;
  monotony: number;
  complexityStress: number;
  recoveryDeficit: number;
}

interface DriverCognitive {
  name: string;
  cognitiveLoadIndex: number;
  cognitiveState: 'SHARP' | 'ALERT' | 'STRAINED' | 'OVERLOADED';
  factors: CognitiveFactors;
  recommendation: string;
}

// Simple SVG radar chart — no dependencies needed
function RadarChart({ factors }: { factors: CognitiveFactors }) {
  const labels = [
    { key: 'fatigue', label: 'Fatigue', angle: 0 },
    { key: 'decisionFatigue', label: 'Decisions', angle: 60 },
    { key: 'circadian', label: 'Circadian', angle: 120 },
    { key: 'monotony', label: 'Monotony', angle: 180 },
    { key: 'complexityStress', label: 'Complexity', angle: 240 },
    { key: 'recoveryDeficit', label: 'Recovery', angle: 300 },
  ];

  const cx = 100, cy = 100, maxR = 70;

  const toXY = (angle: number, value: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const points = labels.map(l => {
    const val = factors[l.key as keyof CognitiveFactors] || 0;
    return toXY(l.angle, val);
  });
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');

  // Grid rings
  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ maxHeight: 220 }}>
      {/* Grid rings */}
      {rings.map(r => {
        const pts = labels.map(l => toXY(l.angle, r));
        return (
          <polygon
            key={r}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Axes */}
      {labels.map(l => {
        const end = toXY(l.angle, 100);
        return (
          <line key={l.key} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        );
      })}

      {/* Data polygon */}
      <polygon points={polygon} fill="rgba(6,182,212,0.2)" stroke="#06B6D4" strokeWidth="1.5" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#06B6D4" />
      ))}

      {/* Labels */}
      {labels.map(l => {
        const labelPos = toXY(l.angle, 115);
        return (
          <text
            key={l.key}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[8px] fill-gray-400"
          >
            {l.label}
          </text>
        );
      })}
    </svg>
  );
}

const STATE_CONFIG: Record<string, { color: string; bg: string; border: string; emoji: string; label: string }> = {
  SHARP: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', emoji: '🧠', label: 'Sharp' },
  ALERT: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', emoji: '⚡', label: 'Alert' },
  STRAINED: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', emoji: '⚠️', label: 'Strained' },
  OVERLOADED: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', emoji: '🔴', label: 'Overloaded' },
};

// Factor bar component
function FactorBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const barColor = value <= 30 ? 'bg-cyan-500' : value <= 55 ? 'bg-blue-500' : value <= 75 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-4">{icon}</span>
      <span className="text-xs text-gray-400 w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-7 text-right font-mono">{value}</span>
    </div>
  );
}

interface CognitivePanelProps {
  drivers?: DriverCognitive[];
}

// Demo data when no backend
const DEMO_COGNITIVE: DriverCognitive[] = [
  {
    name: 'Rajesh Kumar',
    cognitiveLoadIndex: 22,
    cognitiveState: 'SHARP',
    factors: { fatigue: 29, decisionFatigue: 15, circadian: 10, monotony: 20, complexityStress: 40, recoveryDeficit: 0 },
    recommendation: '🧠 Peak cognitive readiness — ready for complex routes',
  },
  {
    name: 'Priya Sharma',
    cognitiveLoadIndex: 18,
    cognitiveState: 'SHARP',
    factors: { fatigue: 14, decisionFatigue: 5, circadian: 10, monotony: 0, complexityStress: 40, recoveryDeficit: 0 },
    recommendation: '🧠 Peak cognitive readiness — ready for complex routes',
  },
  {
    name: 'Amit Patel',
    cognitiveLoadIndex: 72,
    cognitiveState: 'STRAINED',
    factors: { fatigue: 64, decisionFatigue: 80, circadian: 10, monotony: 60, complexityStress: 80, recoveryDeficit: 75 },
    recommendation: '⚠️ Assign simple routes only — brain strain detected',
  },
  {
    name: 'Sunita Devi',
    cognitiveLoadIndex: 12,
    cognitiveState: 'SHARP',
    factors: { fatigue: 7, decisionFatigue: 0, circadian: 10, monotony: 0, complexityStress: 15, recoveryDeficit: 0 },
    recommendation: '🧠 Peak cognitive readiness — ready for complex routes',
  },
  {
    name: 'Vikram Singh',
    cognitiveLoadIndex: 81,
    cognitiveState: 'OVERLOADED',
    factors: { fatigue: 43, decisionFatigue: 70, circadian: 10, monotony: 80, complexityStress: 80, recoveryDeficit: 100 },
    recommendation: '⛔ Rest recommended — cognitive overload detected',
  },
];

export function CognitivePanel({ drivers }: CognitivePanelProps) {
  const data = drivers && drivers.length > 0 ? drivers : DEMO_COGNITIVE;
  const selectedDriver = data[0]; // Show first driver's radar by default

  // Fleet cognitive summary
  const avgCLI = Math.round(data.reduce((sum, d) => sum + d.cognitiveLoadIndex, 0) / data.length);
  const sharpCount = data.filter(d => d.cognitiveState === 'SHARP').length;
  const overloadedCount = data.filter(d => d.cognitiveState === 'OVERLOADED').length;

  return (
    <div className="bg-eco-card border border-eco-card-border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-white font-semibold text-sm">Cognitive Load Analysis</h3>
          <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20 font-mono">
            6-Factor CLI
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Research: Kahneman · Mackworth · Yerkes-Dodson
        </span>
      </div>

      {/* Fleet summary chips */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-cyan-400 font-mono">{avgCLI}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Fleet Avg CLI</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-emerald-400 font-mono">{sharpCount}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Sharp Minds</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-red-400 font-mono">{overloadedCount}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Overloaded</div>
        </div>
      </div>

      {/* Radar chart + factor bars */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 text-center">
            {selectedDriver.name} — Cognitive Radar
          </div>
          <RadarChart factors={selectedDriver.factors} />
        </div>
        <div className="space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Factor Breakdown</div>
          <FactorBar label="Fatigue" value={selectedDriver.factors.fatigue} icon="🧠" />
          <FactorBar label="Decisions" value={selectedDriver.factors.decisionFatigue} icon="🎯" />
          <FactorBar label="Circadian" value={selectedDriver.factors.circadian} icon="🌙" />
          <FactorBar label="Monotony" value={selectedDriver.factors.monotony} icon="🔁" />
          <FactorBar label="Complexity" value={selectedDriver.factors.complexityStress} icon="🏙️" />
          <FactorBar label="Recovery" value={selectedDriver.factors.recoveryDeficit} icon="💤" />
        </div>
      </div>

      {/* Driver list with CLI scores */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">All Drivers</div>
        {data.map((d, i) => {
          const cfg = STATE_CONFIG[d.cognitiveState] || STATE_CONFIG.ALERT;
          return (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <span className="text-sm text-white font-medium">{d.name}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                  {cfg.emoji} {cfg.label} {d.cognitiveLoadIndex}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Recommendation */}
      {data.some(d => d.cognitiveState === 'OVERLOADED') && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="text-red-400 text-xs font-semibold mb-1">⛔ Cognitive Overload Alert</div>
          <div className="text-gray-400 text-xs">
            {data.filter(d => d.cognitiveState === 'OVERLOADED').map(d => d.name).join(', ')} should be restricted to EASY routes only or given a rest break.
          </div>
        </div>
      )}
    </div>
  );
}

import { inr } from '../services/api';
const compact = v => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
const Empty = () => <div className="text-center text-muted small py-4">No data yet</div>;

export function Donut({ data, center }) {
  const total = data.reduce((s, d) => s + d.value, 0), R = 38, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="d-flex align-items-center justify-content-center gap-3">
      <svg width="104" height="104" viewBox="0 0 104 104" role="img" aria-label="Form response status">
        <circle cx="52" cy="52" r={R} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        {total > 0 && data.map(d => {
          const len = d.value / total * C;
          const el = <circle key={d.label} cx="52" cy="52" r={R} fill="none" stroke={d.color} strokeWidth="12"
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 52 52)" />;
          off += len; return el;
        })}
        <text x="52" y="53" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1e293b">{total}</text>
        <text x="52" y="66" textAnchor="middle" fontSize="8" fill="#64748b">{center}</text>
      </svg>
      <div>{data.map(d => (
        <div key={d.label} className="d-flex align-items-center gap-2 mb-1 small">
          <span style={{ width: 8, height: 8, borderRadius: 3, background: d.color }} />{d.label}<strong className="ms-auto ps-2">{d.value}</strong>
        </div>))}</div>
    </div>
  );
}

export function BarChart({ data }) {
  if (!data.length) return <Empty />;
  const W = 300, H = 128, pad = { l: 30, r: 6, t: 6, b: 20 }, max = Math.max(...data.map(d => d.value)) || 1;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, bw = Math.min(26, iw / data.length * 0.55);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Expense amount by month">
      {[0, .5, 1].map(t => { const y = pad.t + ih - ih * t; return (
        <g key={t}><line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#f1f5f9" /><text x={pad.l - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{compact(max * t)}</text></g>); })}
      {data.map((d, i) => { const h = ih * d.value / max, x = pad.l + iw / data.length * (i + .5) - bw / 2; return (
        <g key={d.label}><rect x={x} y={pad.t + ih - h} width={bw} height={h} rx="4" fill="#a5b4fc"><title>{d.label}: {inr(d.value)}</title></rect>
          <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#64748b">{d.label}</text></g>); })}
    </svg>
  );
}

export function HBar({ data }) {
  if (!data.some(d => d.value)) return <Empty />;
  const max = Math.max(...data.map(d => d.value), 1);
  return <>{data.map(d => (
    <div key={d.label} className="mb-2">
      <div className="d-flex justify-content-between small"><span className="text-truncate pe-2">{d.label}</span><strong>{inr(d.value)}</strong></div>
      <div className="progress" style={{ height: 5, background: '#f1f5f9' }}><div className="progress-bar" style={{ width: `${d.value / max * 100}%`, background: '#a5b4fc' }} /></div>
    </div>))}</>;
}
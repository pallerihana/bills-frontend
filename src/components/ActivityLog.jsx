import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiClock, FiFileText, FiCheckSquare, FiFolder, FiUsers,
  FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import api, { errMsg } from '../services/api';

const PAGE_SIZE = 10;

const CAT = {
  BILL: { icon: FiFileText, fg: '#6366f1', bg: '#eef2ff', label: 'Bills' },
  REVIEW: { icon: FiCheckSquare, fg: '#10b981', bg: '#ecfdf5', label: 'Review' },
  PROJECT: { icon: FiFolder, fg: '#f59e0b', bg: '#fffbeb', label: 'Project' },
  PEOPLE: { icon: FiUsers, fg: '#0ea5e9', bg: '#f0f9ff', label: 'People & emails' },
};

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDT = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(d.getDate()).padStart(2, '0')}-${MON[d.getMonth()]}-${d.getFullYear()} ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};

const who = (e) => (e.actorType === 'ADMIN' ? 'Admin' : e.actorType === 'SYSTEM' ? 'System' : e.actor || 'Unknown');

// Page numbers with gaps, e.g. 1 … 4 5 6 … 20
const pageList = (cur, last) => {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const set = new Set([1, last, cur - 1, cur, cur + 1]);
  if (cur <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (cur >= last - 2) [last - 1, last - 2, last - 3].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
};

export default function ActivityLog({ projectId, version }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cat, setCat] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const reqId = useRef(0); // ignores responses that arrive after a newer request

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // silent = background refresh: no spinner, the list stays on screen
  const load = useCallback(async (p, category, silent = false) => {
    if (!projectId) return;
    const id = ++reqId.current;
    if (!silent) { setLoading(true); setErr(''); }
    try {
      const { data } = await api.get(`/projects/${projectId}/audit`, {
        params: { limit: PAGE_SIZE, skip: (p - 1) * PAGE_SIZE, category: category || undefined },
      });
      if (id !== reqId.current) return; // an older request finished late
      const count = data.total || 0, pages = Math.ceil(count / PAGE_SIZE);
      setTotal(count);
      setErr('');
      if (p > Math.max(pages, 1)) { setPage(Math.max(pages, 1)); return; } // current page no longer exists: go to the last one
      setItems(data.items || []);
    } catch (e) {
      if (id === reqId.current && !silent) setErr(errMsg(e));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [projectId]);

  // Opening the card, changing page or category: normal load
  useEffect(() => { if (open) load(page, cat); }, [open, page, cat, load]);

  // The project page reloads every 15 seconds and when something changes: refresh quietly
  useEffect(() => { if (open) load(page, cat, true); }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeCategory = (v) => { setCat(v); setPage(1); };
  const goTo = (n) => { if (n >= 1 && n <= totalPages && n !== page) setPage(n); };
  const toggle = () => setOpen((o) => !o);

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="card shadow-sm mt-3"><div className="card-body">
      <div className="d-flex justify-content-between align-items-center" role="button" tabIndex={0} aria-expanded={open}
        onClick={toggle} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}>
        <h6 className="mb-0"><FiClock className="me-1" /> Activity History</h6>
        <span className="small text-muted">{open ? <>Hide <FiChevronUp /></> : <>Show <FiChevronDown /></>}</span>
      </div>

      {open && (
        <div className="mt-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <select className="form-select form-select-sm" style={{ maxWidth: 220 }} value={cat}
              onChange={(e) => changeCategory(e.target.value)} aria-label="Filter activity category">
              <option value="">All activity</option>
              {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="small text-muted">{total} {total === 1 ? 'entry' : 'entries'} · Read-only</span>
          </div>

          {err && (
            <div className="alert alert-danger py-2 d-flex justify-content-between align-items-center">
              <span>{err}</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => load(page, cat)} disabled={loading}>Retry</button>
            </div>
          )}

          {loading && items.length === 0 && (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
              <span className="ms-2 text-muted small">Loading activity...</span>
            </div>
          )}

          {!loading && !err && items.length === 0 && <p className="text-muted mb-0">No activity recorded yet.</p>}

          {/* while a new page loads, the current rows stay visible but dimmed */}
          <div style={{ opacity: loading && items.length ? 0.5 : 1, transition: 'opacity .15s' }}>
            {!err && items.map((e) => {
              const c = CAT[e.category] || CAT.PROJECT, Icon = c.icon;
              return (
                <div className="d-flex gap-3 py-3 border-bottom" key={e._id}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 28, height: 28, background: c.bg, color: c.fg, flex: 'none' }}><Icon /></div>
                  <div className="flex-grow-1">
                    <div className="text-muted" style={{ fontSize: 12 }}>{fmtDT(e.createdAt)}</div>
                    <div style={{ overflowWrap: 'anywhere' }}><strong>{who(e)}</strong> {e.message}</div>
                    {e.actorType === 'ADMIN' && e.actor && <div className="text-muted" style={{ fontSize: 11 }}>by {e.actor}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 0 && !err && (
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-3">
              <span className="small text-muted">Showing {start}–{end} of {total}</span>
              {totalPages > 1 && (
                <nav aria-label="Activity history pagination">
                  <ul className="pagination pagination-sm mb-0 flex-wrap justify-content-center">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button type="button" className="page-link" onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Previous page">
                        <FiChevronLeft /><span className="ms-1">Previous</span>
                      </button>
                    </li>
                    {pageList(page, totalPages).map((n) => typeof n === 'string'
                      ? <li className="page-item disabled" key={n}><span className="page-link">…</span></li>
                      : (
                        <li className={`page-item ${n === page ? 'active' : ''}`} key={n}>
                          <button type="button" className="page-link" onClick={() => goTo(n)} aria-current={n === page ? 'page' : undefined}>{n}</button>
                        </li>
                      ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button type="button" className="page-link" onClick={() => goTo(page + 1)} disabled={page === totalPages} aria-label="Next page">
                        <span className="me-1">Next</span><FiChevronRight />
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          )}
        </div>
      )}
    </div></div>
  );
}
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiFolder, FiActivity, FiCheckCircle, FiUsers, FiClock,
  FiCheckSquare, FiLock, FiFileText, FiAlertTriangle, FiEye, FiUserPlus,
  FiShield, FiChevronDown, FiCalendar, FiMoreVertical, FiX, FiGrid, FiList, FiArrowUpRight, FiBarChart2, FiTrendingUp
} from 'react-icons/fi';
import { MdOutlineAccountBalance } from 'react-icons/md';

import api, { inr, errMsg } from '../services/api';
import { Donut, BarChart, HBar } from '../components/Charts.jsx';
import AddEmployeeModal from '../components/AddEmployeeModal.jsx';
import AddAdminModal from '../components/AddAdminModal.jsx';

/* ======================================================================
   Constants & helpers
   ====================================================================== */

const DAY = 864e5;
const IST_OFFSET = 330 * 60000;

const ALL_YEARS = 'All Years';
const ALL_STATUS = 'All Status';
const STATUS_OPTIONS = [ALL_STATUS, 'Open', 'Closed', 'Completed', 'Locked'];

const REVIEW_STAGES = [
  ['SUBMITTED', 'Submitted', '#cbd5e1'],
  ['UNDER_REVIEW', 'Under Review', '#7dd3fc'],
  ['APPROVED', 'Approved', '#6ee7b7'],
  ['REJECTED', 'Rejected', '#fca5a5'],
  ['REIMBURSED', 'Reimbursed', '#a5b4fc']
];

const ATTENTION_STYLE = {
  DEADLINE: [FiClock, '#b45309', '#fffbeb'],
  EXPIRED: [FiAlertTriangle, '#be123c', '#fff1f2'],
  REVIEW: [FiEye, '#0369a1', '#f0f9ff'],
  REIMBURSE: [FiCheckCircle, '#047857', '#ecfdf5']
};

/** Per-college accent (avatar + project count chip). */
const TINTS = [
  { bg: '#e0ecff', fg: '#1d4ed8', chip: '#dbe6ff' }, // blue
  { bg: '#ffe4e8', fg: '#be123c', chip: '#ffdfe4' }, // rose
  { bg: '#dcfce7', fg: '#15803d', chip: '#d5f5e3' }, // green
  { bg: '#ede9fe', fg: '#6d28d9', chip: '#e6defc' }, // violet
  { bg: '#fef3c7', fg: '#b45309', chip: '#fde9b0' }  // amber
];

/** Number badges for projects inside a college. */
const NUM_TINTS = [
  { bg: '#dbeafe', fg: '#1d4ed8' },
  { bg: '#d1fae5', fg: '#047857' },
  { bg: '#ede9fe', fg: '#6d28d9' },
  { bg: '#fef3c7', fg: '#b45309' },
  { bg: '#ffe4e6', fg: '#be123c' }
];

const closesAt = p =>
  p.formEndDate ? new Date(p.formEndDate).getTime() + DAY - IST_OFFSET : null;

const monthLabel = key => {
  const [y, m] = key.split('-');
  return new Date(y, m - 1).toLocaleString('en-GB', { month: 'short' });
};

const fmt = d =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

const ago = d => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  return `${Math.floor(m / 1440)} d ago`;
};

const actorName = e =>
  e.actorType === 'ADMIN' ? 'Admin' : e.actorType === 'SYSTEM' ? 'System' : e.actor || 'Unknown';

/** Academic year runs June to May, e.g. 2025-26. */
const academicYear = d => {
  if (!d) return 'Unknown';
  const dt = new Date(d);
  const start = dt.getMonth() >= 5 ? dt.getFullYear() : dt.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(2)}`;
};

const statusOf = p => {
  const now = Date.now();
  if (p.locked) return { label: 'Locked', cls: 'st-locked' };
  if (p.endDate && new Date(p.endDate) < now) return { label: 'Completed', cls: 'st-completed' };
  const c = closesAt(p);
  if (c && c <= now) return { label: 'Closed', cls: 'st-closed' };
  return { label: 'Open', cls: 'st-open' };
};

const projectSubject = (p, i) => (p.tags?.length ? p.tags.join(', ') : `Project ${i + 1}`);

/* ======================================================================
   Small presentational components
   ====================================================================== */

const Rupee = () => <span className="fw-bold">₹</span>;

const Tile = ({ icon: Icon, label, value, tone }) => (
  <div className={`stat ${tone}`}>
    <div className="ico"><Icon /></div>
    <div>
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  </div>
);

const Panel = ({ title, right, icon: Icon, color = '#6366f1', children }) => (
  <div className="card chart-card dash-panel h-100" style={{ '--pc': color }}>
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="dash-panel-title">
          {Icon && <span className="dash-panel-ico"><Icon /></span>}
          <span>{title}</span>
        </div>
        {right}
      </div>
      {children}
    </div>
  </div>
);

const StatusBadge = ({ project }) => {
  const { label, cls } = statusOf(project);
  return <span className={`cp-status ${cls}`}>{label}</span>;
};

function RowMenu({ id }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="cp-menu" onBlur={e => {
      if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
    }}>
      <button
        type="button"
        className="cp-kebab"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <FiMoreVertical />
      </button>
      {open && (
        <div className="cp-menu-list" role="menu">
          <Link to={`/projects/${id}`} role="menuitem"><FiEye /> View project</Link>
        </div>
      )}
    </div>
  );
}

/** One project line inside an expanded college. `compact` is used inside cards. */
function ProjectRow({ project, stats, index, compact = false }) {
  const tint = NUM_TINTS[index % NUM_TINTS.length];
  const employees = stats?.employees ?? 0;

  if (compact) {
    return (
      <div className="cp-row is-compact" style={{ '--tc': tint.fg }}>
        <span className="cp-num" style={{ background: tint.bg, color: tint.fg }}>{index + 1}</span>
        <div className="cp-row-main">
          <div className="cp-row-name">
            {projectSubject(project, index)}
            {project.locked && <FiLock size={12} className="ms-1 text-muted" aria-label="Locked" />}
          </div>
          <div className="cp-row-meta">
            <FiCalendar size={12} /> {fmt(project.startDate)} – {fmt(project.endDate) || 'TBD'}
          </div>
          <div className="cp-row-meta">
            <FiUsers size={12} /> {employees}
            <span className="cp-dot">·</span>
            {inr(stats?.amount || 0)}
          </div>
        </div>
        <StatusBadge project={project} />
        <Link to={`/projects/${project._id}`} className="cp-icon-link" aria-label="Open project">
          <FiArrowUpRight />
        </Link>
        <RowMenu id={project._id} />
      </div>
    );
  }

  return (
    <div className="cp-row" style={{ '--tc': tint.fg }}>
      <span className="cp-num" style={{ background: tint.bg, color: tint.fg }}>{index + 1}</span>

      <div className="cp-row-main">
        <div className="cp-row-name">
          {projectSubject(project, index)}
          {project.locked && <FiLock size={13} className="ms-2 text-muted" aria-label="Locked" />}
        </div>
        <div className="cp-row-meta">
          <FiCalendar size={13} /> {fmt(project.startDate)} – {fmt(project.endDate) || 'To be decided'}
        </div>
        <div className="cp-row-meta">
          <FiFileText size={13} /> Form Deadline: {fmt(project.formEndDate) || '—'}
        </div>
      </div>

      <StatusBadge project={project} />

      <div className="cp-stat is-emp">
        <div className="cp-stat-top"><FiUsers /> <b>{employees}</b></div>
        <div className="cp-stat-lbl">Employees</div>
      </div>
      <div className="cp-stat is-exp">
        <div className="cp-stat-top"><FiFileText /> <b>{inr(stats?.amount || 0)}</b></div>
        <div className="cp-stat-lbl">Employee Expenses</div>
      </div>
      <div className="cp-stat is-bill">
        <div className="cp-stat-top"><FiFileText /> <b>{inr(stats?.companyTotal || 0)}</b></div>
        <div className="cp-stat-lbl">Company Bills</div>
      </div>

      <Link to={`/projects/${project._id}`} className="cp-view">View Project</Link>
      <RowMenu id={project._id} />
    </div>
  );
}

function Metric({ icon: Icon, label, value, kind }) {
  return (
    <span className={`cp-metric is-${kind}`}>
      <span className="cp-metric-lbl">{label}</span>
      <span className="cp-metric-val"><span className="cp-metric-ico"><Icon /></span> {value}</span>
    </span>
  );
}

/** One college: a summary row that expands to list its projects. */
function CollegeAccordion({ group, index, stats, open, onToggle }) {
  const tint = TINTS[index % TINTS.length];
  const panelId = `college-panel-${index}`;
  const count = group.projects.length;

  return (
    <section className={`cp-acc ${open ? 'is-open' : ''}`} style={{ '--tc': tint.fg, '--tb': tint.bg }}>
      <button type="button" className="cp-acc-head" aria-expanded={open}
        aria-controls={panelId} onClick={onToggle}>
        <span className="cp-avatar" style={{ background: tint.bg, color: tint.fg }}>
          <MdOutlineAccountBalance size={28} />
        </span>

        <span className="cp-acc-main">
          <span className="cp-acc-name">{group.name}</span>
          {group.location && <span className="cp-acc-loc">{group.location}</span>}
        </span>

        <span className="cp-chip" style={{ background: tint.chip, color: tint.fg }}>
          {count} {count === 1 ? 'Project' : 'Projects'}
        </span>

        <span className="cp-acc-metrics">
          <Metric icon={FiUsers} label="Total Employees" value={group.employees} kind="emp" />
          <Metric icon={FiFileText} label="Total Expenses" value={inr(group.expenses)} kind="exp" />
          <Metric icon={FiFileText} label="Total Company Bills" value={inr(group.companyBills)} kind="bill" />
        </span>

        <FiChevronDown className={`cp-chev ${open ? 'is-flipped' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="cp-projects" id={panelId}>
          <div className="cp-projects-head">
            <div className="cp-projects-title">Projects under {group.name}</div>
            <Link to={`/projects/new?college=${encodeURIComponent(group.name)}`} className="cp-add">
              <FiPlus /> Add New Project
            </Link>
          </div>
          {group.projects.map((p, i) => (
            <ProjectRow key={p._id} project={p} stats={stats[p._id]} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Card layout: summary tiles plus an expandable project list. */
function CollegeCard({ group, index, stats, open, onToggle }) {
  const tint = TINTS[index % TINTS.length];
  const count = group.projects.length;
  const pct = count ? (group.completed / count) * 100 : 0;
  const panelId = `college-card-${index}`;

  return (
    <article className="cp-card" style={{ '--tc': tint.fg, '--tb': tint.bg }}>
      <header className="cp-card-top">
        <span className="cp-avatar" style={{ background: tint.bg, color: tint.fg }}>
          <MdOutlineAccountBalance size={28} />
        </span>
        <div className="cp-card-heading">
          <h3 className="cp-card-name">{group.name}</h3>
          {group.location && <div className="cp-acc-loc">{group.location}</div>}
        </div>
        <span className="cp-chip" style={{ background: tint.chip, color: tint.fg }}>
          {count} {count === 1 ? 'Project' : 'Projects'}
        </span>
      </header>

      <dl className="cp-kpis">
        <div className="is-emp"><dt>Total Employees</dt><dd><FiUsers /> {group.employees}</dd></div>
        <div className="is-exp"><dt>Total Expenses</dt><dd><FiFileText /> {inr(group.expenses)}</dd></div>
        <div className="is-bill"><dt>Company Bills</dt><dd><FiFileText /> {inr(group.companyBills)}</dd></div>
      </dl>

      <div className="cp-progress-wrap">
        <div className="cp-progress-row">
          <span>Completion</span>
          <span>{group.completed} of {count} completed</span>
        </div>
        <div className="cp-progress" role="progressbar" aria-valuenow={Math.round(pct)}
          aria-valuemin={0} aria-valuemax={100}>
          <div className="cp-progress-fill" style={{ width: `${pct}%`, background: tint.fg }} />
        </div>
      </div>

      <button type="button" className="cp-toggle" onClick={onToggle}
        aria-expanded={open} aria-controls={panelId}>
        {open ? 'Hide Projects' : 'View Projects'}
        <FiChevronDown className={open ? 'is-flipped' : ''} />
      </button>

      {open && (
        <div className="cp-card-projects" id={panelId}>
          {group.projects.map((p, i) => (
            <ProjectRow key={p._id} project={p} stats={stats[p._id]} index={i} compact />
          ))}
          <Link to={`/projects/new?college=${encodeURIComponent(group.name)}`} className="cp-add cp-add-block">
            <FiPlus /> Add New Project
          </Link>
        </div>
      )}
    </article>
  );
}

/* ======================================================================
   Page
   ====================================================================== */

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recent, setRecent] = useState([]);
  const [err, setErr] = useState('');

  const [modal, setModal] = useState(null);
  const [note, setNote] = useState(null);

  const [q, setQ] = useState('');
  const [year, setYear] = useState(ALL_YEARS);
  const [status, setStatus] = useState(ALL_STATUS);
  const [sort, setSort] = useState('name');
  const [expanded, setExpanded] = useState({});
  const [view, setView] = useState('cards');
  const dashRef = useRef(null);

  useEffect(() => {
    api.get('/projects/stats').then(r => setS(r.data)).catch(e => setErr(errMsg(e)));
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    api.get('/projects/activity/recent').then(r => setRecent(r.data)).catch(() => {});
  }, []);

  /* Use the full page width: lift max-width limits on parent wrappers
     (e.g. Bootstrap .container) while this page is mounted. */
  const ready = !!s;
  useEffect(() => {
    if (!ready || !dashRef.current) return undefined;
    const changed = [];
    for (let el = dashRef.current.parentElement; el && el !== document.body; el = el.parentElement) {
      if (getComputedStyle(el).maxWidth !== 'none') {
        changed.push([el, el.style.maxWidth]);
        el.style.maxWidth = 'none';
      }
    }
    return () => changed.forEach(([el, prev]) => { el.style.maxWidth = prev; });
  }, [ready]);

  const stats = useMemo(
    () => Object.fromEntries((s?.projects || []).map(x => [x._id, x])),
    [s]
  );

  const years = useMemo(() => {
    const set = new Set(projects.map(p => academicYear(p.startDate)));
    return [ALL_YEARS, ...Array.from(set).sort().reverse()];
  }, [projects]);

  const groups = useMemo(() => {
    const term = q.trim().toLocaleLowerCase();

    const filtered = projects.filter(p => {
      if (term && !String(p.collegeName || '').toLocaleLowerCase().includes(term)) return false;
      if (year !== ALL_YEARS && academicYear(p.startDate) !== year) return false;
      if (status !== ALL_STATUS && statusOf(p).label !== status) return false;
      return true;
    });

    const map = new Map();
    filtered.forEach(p => {
      const name = String(p.collegeName || 'Unnamed College').trim();
      const key = name.toLocaleLowerCase();
      if (!map.has(key)) {
        map.set(key, { key, name, location: p.location || p.collegeLocation || '', projects: [] });
      }
      map.get(key).projects.push(p);
    });

    const list = Array.from(map.values()).map(g => {
      g.projects.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
      const sum = field => g.projects.reduce((t, p) => t + (Number(stats[p._id]?.[field]) || 0), 0);
      return {
        ...g,
        employees: sum('employees'),
        expenses: sum('amount'),
        companyBills: sum('companyTotal'),
        completed: g.projects.filter(p => statusOf(p).label === 'Completed').length
      };
    });

    list.sort((a, b) => {
      if (sort === 'projects') return b.projects.length - a.projects.length;
      if (sort === 'expenses') return b.expenses - a.expenses;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [projects, stats, q, year, status, sort]);

  const toggle = key => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const filtersActive = q || year !== ALL_YEARS || status !== ALL_STATUS || sort !== 'name';
  const resetFilters = () => { setQ(''); setYear(ALL_YEARS); setStatus(ALL_STATUS); setSort('name'); };

  if (err) return <div className="alert alert-danger">{err}</div>;
  if (!s) return <div className="text-center text-muted py-5">Loading dashboard…</div>;

  /* ---------- derived values for the overview section ---------- */

  const topProjects = [...(s.projects || [])]
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 4)
    .map(p => ({ label: p.name, value: p.amount }));

  const tiles = [
    [FiFolder, 'Total projects', s.totalProjects, 't-indigo', 'col-6 col-lg-3'],
    [FiActivity, 'Active projects', s.activeProjects, 't-green', 'col-6 col-lg-3'],
    [FiCheckCircle, 'Completed projects', s.completedProjects, 't-sky', 'col-6 col-lg-3'],
    [FiUsers, 'Total employees', s.totalEmployees, 't-violet', 'col-6 col-lg-3'],
    [FiCheckSquare, 'Forms completed', s.formsCompleted, 't-teal', 'col-6 col-lg-3'],
    [FiClock, 'Forms pending', s.formsPending, 't-amber', 'col-6 col-lg-3'],
    [FiLock, 'Locked projects', s.lockedProjects, 't-rose', 'col-6 col-lg-3'],
    [FiFileText, 'Employee bills', s.totalBills, 't-sky', 'col-6 col-lg-3'],
    [Rupee, 'Employee expenses', inr(s.totalAmount), 't-green', 'col-12 col-lg-4'],
    [Rupee, `Company bills (${s.companyBills})`, inr(s.companyTotal), 't-rose', 'col-6 col-lg-4'],
    [Rupee, 'Grand total', inr(s.grandTotal), 't-indigo', 'col-6 col-lg-4']
  ];

  const pipeline = REVIEW_STAGES.map(([k, label, color]) => ({
    k, label, color, ...(s.review?.[k] || { count: 0, amount: 0 })
  }));
  const pipelineTotal = pipeline.reduce((t, x) => t + x.count, 0);


  return (
    <>
      <style>{CSS}</style>
      <div className="dash" ref={dashRef}>

      {/* ---------- Page header ---------- */}
      <header className="dash-hero">
        <div className="dash-hero-text">
          <h3 className="dash-hero-title">Dashboard</h3>
          <div className="dash-hero-sub">Overview of all projects and expenses</div>
          <div className="dash-hero-chips">
            <span className="dash-chip"><FiActivity /> {s.activeProjects} active projects</span>
            <span className="dash-chip"><FiClock /> {s.formsPending} forms pending</span>
            <span className="dash-chip"><FiUsers /> {s.totalEmployees} employees</span>
          </div>
        </div>

        <div className="dash-hero-actions">
          <button type="button" className="dash-btn dash-btn-solid" onClick={() => setModal('employee')}>
            <FiUserPlus /> Add Employee
          </button>
          <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setModal('admin')}>
            <FiShield /> Add Admin
          </button>
        </div>
      </header>

      {note && (
        <div className={`alert alert-${note.t} py-2 d-flex justify-content-between align-items-start`} role="status">
          <span>{note.m}</span>
          <button className="btn-close" aria-label="Close" onClick={() => setNote(null)} />
        </div>
      )}

      {modal === 'employee' && (
        <AddEmployeeModal
          onClose={() => setModal(null)}
          onAdded={e => {
            setModal(null);
            setNote({ t: 'success', m: `${e.name} (${e.employeeId}) was added. They now appear in the employee dropdowns.` });
          }}
        />
      )}

      {modal === 'admin' && (
        <AddAdminModal
          onClose={() => setModal(null)}
          onCreated={a => {
            setModal(null);
            setNote({ t: 'success', m: `Admin account created for ${a.name}. They can log in with ${a.email} and the password you set.` });
          }}
        />
      )}

      {/* ---------- Summary tiles ---------- */}
      <div className="row g-3 mb-4">
        {tiles.map(([icon, label, value, tone, cls]) => (
          <div className={cls} key={label}>
            <Tile icon={icon} label={label} value={value} tone={tone} />
          </div>
        ))}
      </div>

      {/* ---------- Attention / review / activity ---------- */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-xl-4">
          <Panel title="Needs attention" icon={FiAlertTriangle} color="#f59e0b" right={<span className="small text-muted">{(s.attention || []).length}</span>}>
            {!s.attention?.length ? (
              <div className="text-muted small py-3">
                <FiCheckCircle className="text-success me-1" /> Nothing needs your attention.
              </div>
            ) : (
              <div className="cp-scroll">
                {s.attention.map((a, i) => {
                  const [Icon, fg, bg] = ATTENTION_STYLE[a.type] || ATTENTION_STYLE.REVIEW;
                  return (
                    <Link key={`${a.projectId}-${a.type}-${i}`} to={`/projects/${a.projectId}`}
                      className="d-flex gap-2 py-2 border-bottom text-decoration-none align-items-start">
                      <span className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: 28, height: 28, background: bg, color: fg, flex: 'none' }}>
                        <Icon />
                      </span>
                      <span className="small">
                        <span className="fw-semibold text-dark">{a.project}</span><br />
                        <span className="text-muted">{a.text}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <div className="col-md-6 col-xl-4">
          <Panel title="Bill review" icon={FiFileText} color="#6366f1" right={<span className="small text-muted">{pipelineTotal} bills</span>}>
            <div className="d-flex rounded overflow-hidden mb-3" style={{ height: 10, background: '#f1f5f9' }}>
              {pipeline.filter(x => x.count > 0).map(x => (
                <div key={x.k} title={`${x.label}: ${x.count}`}
                  style={{ width: `${(x.count / pipelineTotal) * 100}%`, background: x.color }} />
              ))}
            </div>
            {pipeline.map(x => (
              <div key={x.k} className="d-flex align-items-center gap-2 small mb-1">
                <span style={{ width: 8, height: 8, borderRadius: 3, background: x.color }} />
                {x.label}
                <strong className="ms-auto">{x.count}</strong>
                <span className="text-muted" style={{ minWidth: 78, textAlign: 'right' }}>{inr(x.amount)}</span>
              </div>
            ))}
            {s.review?.APPROVED?.count > 0 && (
              <div className="small text-muted mt-2">
                Awaiting reimbursement: <strong className="text-dark">{inr(s.review.APPROVED.amount)}</strong>
              </div>
            )}
          </Panel>
        </div>

        <div className="col-md-12 col-xl-4">
          <Panel title="Recent activity" icon={FiActivity} color="#10b981">
            {!recent.length ? (
              <div className="text-muted small py-3">No activity yet.</div>
            ) : (
              <div className="cp-scroll">
                {recent.map(e => (
                  <Link key={e._id} to={`/projects/${e.projectId}`}
                    className="d-block py-2 border-bottom text-decoration-none small">
                    <div className="text-muted" style={{ fontSize: 11 }}>{ago(e.createdAt)} · {e.project}</div>
                    <div className="text-dark" style={{ overflowWrap: 'anywhere' }}>
                      <strong>{actorName(e)}</strong> {e.message}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ---------- Charts ---------- */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-xl-4">
          <Panel title="Form responses" icon={FiCheckSquare} color="#14b8a6">
            <Donut center="employees" data={[
              { label: 'Submitted', value: s.submitted, color: '#6ee7b7' },
              { label: 'No Bill', value: s.noBill, color: '#cbd5e1' },
              { label: 'Pending', value: s.formsPending, color: '#fcd34d' }
            ]} />
          </Panel>
        </div>
        <div className="col-md-6 col-xl-4">
          <Panel title="Expenses by month" icon={FiBarChart2} color="#3b82f6">
            <BarChart data={(s.monthly || []).slice(-6).map(m => ({ label: monthLabel(m.month), value: m.amount }))} />
          </Panel>
        </div>
        <div className="col-md-12 col-xl-4">
          <Panel title="Top projects by spend" icon={FiTrendingUp} color="#f43f5e">
            <HBar data={topProjects} />
          </Panel>
        </div>
      </div>

      {/* ================= College project dashboard ================= */}
      <div className="cp-wrap">
        <div className="cp-head">
          <div className="cp-head-left">
            <span className="cp-head-ico"><MdOutlineAccountBalance /></span>
            <div>
              <h2 className="cp-title">College Project Dashboard</h2>
              <div className="cp-sub">Manage colleges and their projects</div>
            </div>
          </div>
          <div className="cp-head-actions">
            <div className="cp-seg" role="group" aria-label="Layout">
              <button type="button" className={`cp-seg-btn ${view === 'cards' ? 'is-active' : ''}`}
                aria-pressed={view === 'cards'} onClick={() => setView('cards')}>
                <FiGrid /> Cards
              </button>
              <button type="button" className={`cp-seg-btn ${view === 'list' ? 'is-active' : ''}`}
                aria-pressed={view === 'list'} onClick={() => setView('list')}>
                <FiList /> List
              </button>
            </div>
            <Link to="/projects/new" className="cp-create"><FiPlus /> Create New Project</Link>
          </div>
        </div>

        <div className="cp-filters">
          <div className="cp-search">
            <FiSearch aria-hidden />
            <input type="search" placeholder="Search college name..." aria-label="Search college name"
              value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <label className="cp-field">
            <span>Academic Year</span>
            <select value={year} onChange={e => setYear(e.target.value)}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </label>
          <label className="cp-field">
            <span>Project Status</span>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="cp-field">
            <span>Sort By</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="name">College Name</option>
              <option value="projects">Most Projects</option>
              <option value="expenses">Highest Expenses</option>
            </select>
          </label>
        </div>

        {filtersActive && (
          <div className="cp-filter-note">
            Showing filtered results.
            <button type="button" onClick={resetFilters}><FiX /> Clear filters</button>
          </div>
        )}

        {!groups.length ? (
          <div className="cp-empty">
            {projects.length ? (
              <>No projects match your filters. <button type="button" onClick={resetFilters}>Clear filters</button></>
            ) : (
              <>No projects yet. Use “Create New Project” to add the first one.</>
            )}
          </div>
        ) : view === 'cards' ? (
          <div className="cp-cards">
            {groups.map((g, i) => (
              <CollegeCard key={g.key} group={g} index={i} stats={stats}
                open={!!expanded[g.key]} onToggle={() => toggle(g.key)} />
            ))}
          </div>
        ) : (
          <div className="cp-list">
            {groups.map((g, i) => (
              <CollegeAccordion key={g.key} group={g} index={i} stats={stats}
                open={!!expanded[g.key]} onToggle={() => toggle(g.key)} />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

/* ======================================================================
   Styles
   ====================================================================== */

const CSS = `
/* ================= overall dashboard ================= */
.dash{
  --ind:#4f46e5; --blue:#2563eb; --emerald:#059669; --rose:#e11d48;
  width:100%;max-width:none;
}

/* hero */
.dash-hero{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;
  padding:26px 28px;margin-bottom:22px;border-radius:20px;color:#fff;
  background:linear-gradient(120deg,#1e3a8a 0%,#4338ca 52%,#7c3aed 100%);
  box-shadow:0 18px 40px -18px rgba(67,56,202,.7)}
.dash-hero::before,.dash-hero::after{content:'';position:absolute;border-radius:50%;pointer-events:none}
.dash-hero::before{width:260px;height:260px;right:-60px;top:-110px;background:radial-gradient(circle,rgba(255,255,255,.22),transparent 70%)}
.dash-hero::after{width:200px;height:200px;left:38%;bottom:-120px;background:radial-gradient(circle,rgba(56,189,248,.35),transparent 70%)}
.dash-hero > *{position:relative;z-index:1}
.dash-hero-title{font-size:28px;font-weight:800;letter-spacing:-.02em;margin:0;color:#fff}
.dash-hero-sub{color:rgba(255,255,255,.82);font-size:14.5px;margin-top:2px}
.dash-hero-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.dash-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.25);padding:5px 12px;border-radius:999px;font-size:12.5px;font-weight:600;backdrop-filter:blur(4px)}
.dash-hero-actions{display:flex;gap:10px;flex-wrap:wrap}
.dash-btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:14px;padding:10px 18px;border-radius:12px;border:1px solid transparent;cursor:pointer;transition:transform .15s,background .15s}
.dash-btn:hover{transform:translateY(-1px)}
.dash-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.dash-btn-solid{background:#fff;color:#3730a3}
.dash-btn-solid:hover{background:#eef2ff}
.dash-btn-ghost{background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.35)}
.dash-btn-ghost:hover{background:rgba(255,255,255,.24)}

/* colourful stat tiles */
.dash .stat{position:relative;display:flex;align-items:center;gap:14px;overflow:hidden;padding:16px 18px;border-radius:16px;
  border:0!important;background:var(--tile-bg)!important;box-shadow:0 12px 24px -14px var(--tile-shadow)!important;color:#fff!important;
  transition:transform .18s ease}
.dash .stat:hover{transform:translateY(-2px)}
.dash .stat::after{content:'';position:absolute;right:-26px;top:-30px;width:104px;height:104px;border-radius:50%;background:rgba(255,255,255,.15)}
.dash .stat .ico{position:relative;z-index:1;flex:none;width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.22)!important;color:#fff!important;font-size:22px}
.dash .stat .val{font-size:24px;font-weight:800;line-height:1.1;color:#fff!important;letter-spacing:-.01em}
.dash .stat .lbl{font-size:13px;color:rgba(255,255,255,.88)!important;margin-top:2px}
.dash .stat.t-indigo{--tile-bg:linear-gradient(135deg,#6366f1,#4338ca);--tile-shadow:rgba(67,56,202,.75)}
.dash .stat.t-green{--tile-bg:linear-gradient(135deg,#34d399,#059669);--tile-shadow:rgba(5,150,105,.7)}
.dash .stat.t-sky{--tile-bg:linear-gradient(135deg,#38bdf8,#0284c7);--tile-shadow:rgba(2,132,199,.7)}
.dash .stat.t-violet{--tile-bg:linear-gradient(135deg,#a78bfa,#7c3aed);--tile-shadow:rgba(124,58,237,.7)}
.dash .stat.t-teal{--tile-bg:linear-gradient(135deg,#2dd4bf,#0f766e);--tile-shadow:rgba(15,118,110,.7)}
.dash .stat.t-amber{--tile-bg:linear-gradient(135deg,#fbbf24,#d97706);--tile-shadow:rgba(217,119,6,.7)}
.dash .stat.t-rose{--tile-bg:linear-gradient(135deg,#fb7185,#e11d48);--tile-shadow:rgba(225,29,72,.7)}

/* coloured panels */
.dash .chart-card.dash-panel{position:relative;overflow:hidden;border:1px solid #e6ebf5;border-radius:18px;
  background:linear-gradient(180deg,color-mix(in srgb,var(--pc) 6%,#fff) 0,#fff 90px);
  box-shadow:0 10px 26px -18px rgba(15,23,42,.35)}
.dash .dash-panel::before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:var(--pc)}
.dash-panel-title{display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;color:#0f172a}
.dash-panel-ico{width:32px;height:32px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;
  background:color-mix(in srgb,var(--pc) 15%,#fff);color:var(--pc)}

/* ================= college section ================= */
.cp-wrap{
  --ink:#0b1220; --ink-2:#334155; --muted:#64748b; --faint:#94a3b8;
  --line:#e2e8f0; --line-2:#eef2f7; --surface:#fff; --surface-2:#f8fafc;
  --accent:#4f46e5; --accent-2:#6366f1; --accent-soft:#eef2ff; --accent-line:#c7d2fe;
  --emp:#2563eb; --exp:#059669; --bill:#e11d48;
  color:var(--ink); font-size:14px; margin-top:8px;
}
.cp-wrap *{box-sizing:border-box}
.cp-wrap svg{flex:none}
.cp-wrap button:focus-visible,.cp-wrap a:focus-visible,.cp-wrap select:focus-visible{outline:2px solid var(--accent-2);outline-offset:2px}
.cp-scroll{max-height:190px;overflow-y:auto}

/* shared metric colours */
.is-emp{--mc:var(--emp)} .is-exp{--mc:var(--exp)} .is-bill{--mc:var(--bill)}

/* ---------- header ---------- */
.cp-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.cp-head-left{display:flex;align-items:center;gap:14px}
.cp-head-ico{width:50px;height:50px;border-radius:15px;display:inline-flex;align-items:center;justify-content:center;font-size:26px;color:#fff;
  background:linear-gradient(135deg,#4f46e5,#2563eb);box-shadow:0 10px 20px -8px rgba(79,70,229,.7)}
.cp-title{font-size:24px;font-weight:800;margin:0;letter-spacing:-.02em;line-height:1.15}
.cp-sub{color:var(--ink-2);font-size:14.5px;margin-top:3px}
.cp-create{display:inline-flex;align-items:center;gap:8px;color:#fff;font-weight:600;font-size:15px;padding:12px 22px;border-radius:12px;text-decoration:none;
  background:linear-gradient(135deg,#4f46e5,#2563eb);box-shadow:0 10px 20px -10px rgba(79,70,229,.8);transition:transform .15s,box-shadow .15s}
.cp-create:hover{color:#fff;transform:translateY(-1px);box-shadow:0 14px 24px -10px rgba(79,70,229,.9)}

/* ---------- filters ---------- */
.cp-filters{display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr;gap:14px;align-items:end;margin-bottom:18px;
  padding:14px;background:linear-gradient(135deg,#f5f7ff,#fff);border:1px solid var(--accent-line);border-radius:16px}
.cp-search{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:0 16px;height:46px;color:var(--accent)}
.cp-search:focus-within{border-color:var(--accent-2);box-shadow:0 0 0 3px rgba(99,102,241,.18)}
.cp-search svg{font-size:18px}
.cp-search input{border:0;outline:0!important;width:100%;background:transparent;font-size:14.5px;color:var(--ink)}
.cp-field{display:flex;flex-direction:column;gap:6px;margin:0}
.cp-field span{font-size:13px;color:var(--muted);font-weight:600}
.cp-field select{height:44px;border:1px solid var(--line);border-radius:10px;padding:0 12px;background:var(--surface);font-size:14.5px;color:var(--ink);cursor:pointer}
.cp-field select:focus{border-color:var(--accent-2);box-shadow:0 0 0 3px rgba(99,102,241,.18)}

.cp-filter-note{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted);margin:-6px 2px 14px}
.cp-filter-note button,.cp-empty button{display:inline-flex;align-items:center;gap:4px;border:0;background:none;color:var(--accent);font-weight:600;cursor:pointer;padding:0}
.cp-filter-note button:hover,.cp-empty button:hover{text-decoration:underline}
.cp-empty{background:var(--surface);border:1px dashed #cbd5e1;border-radius:14px;padding:40px;text-align:center;color:var(--muted)}

/* ---------- college accordion ---------- */
.cp-list{display:flex;flex-direction:column;gap:12px}
.cp-acc{background:var(--surface);border:1px solid var(--line);border-left:5px solid var(--tc,#4f46e5);border-radius:16px;overflow:hidden;transition:box-shadow .2s,border-color .2s}
.cp-acc:hover{box-shadow:0 12px 28px -18px rgba(15,23,42,.45)}
.cp-acc.is-open{box-shadow:0 16px 34px -20px var(--tc)}

.cp-acc-head{display:grid;grid-template-columns:56px minmax(200px,1.5fr) auto repeat(3,minmax(120px,1fr)) 24px;align-items:center;gap:18px;width:100%;padding:18px 24px;border:0;background:transparent;text-align:left;cursor:pointer;transition:background .15s}
.cp-acc-head:hover{background:var(--surface-2)}
.cp-acc.is-open .cp-acc-head{background:linear-gradient(90deg,var(--tb,#eef2ff) 0%,#fff 85%)}

.cp-avatar{width:56px;height:56px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2px rgba(255,255,255,.7)}
.cp-acc-main{display:flex;flex-direction:column;min-width:0;gap:2px}
.cp-acc-name{font-size:18px;font-weight:700;line-height:1.25;letter-spacing:-.01em}
.cp-acc-loc{color:var(--ink-2);font-size:14px}
.cp-chip{padding:5px 12px;border-radius:8px;font-weight:700;font-size:13px;white-space:nowrap;justify-self:start}

.cp-acc-metrics{display:contents}
.cp-metric{display:flex;flex-direction:column;gap:5px;min-width:0}
.cp-metric-lbl{font-size:13.5px;color:var(--muted)}
.cp-metric-val{display:inline-flex;align-items:center;gap:9px;font-size:18px;font-weight:800;white-space:nowrap}
.cp-metric-ico{width:28px;height:28px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:15px;
  color:var(--mc);background:color-mix(in srgb,var(--mc) 13%,#fff)}

.cp-chev{font-size:20px;color:var(--tc,#334155);justify-self:end;transition:transform .2s ease}
.is-flipped{transform:rotate(180deg)}

/* ---------- expanded projects ---------- */
.cp-projects{margin:0 16px 16px;padding:14px;background:linear-gradient(180deg,#f5f7ff,#f8fafc);border:1px solid var(--line-2);border-radius:14px}
.cp-projects-head{display:flex;justify-content:space-between;align-items:center;padding:2px 2px 12px;gap:8px;flex-wrap:wrap}
.cp-projects-title{font-size:16px;font-weight:700}
.cp-add{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--accent);color:var(--accent);background:var(--surface);border-radius:9px;padding:7px 14px;font-weight:600;font-size:13.5px;text-decoration:none;transition:background .15s,color .15s}
.cp-add:hover{background:var(--accent);color:#fff}

.cp-row{display:grid;grid-template-columns:40px minmax(190px,1.7fr) 110px repeat(3,minmax(120px,1fr)) 118px 24px;align-items:center;gap:16px;background:var(--surface);border:1px solid var(--line-2);border-left:4px solid var(--tc,#4f46e5);border-radius:12px;padding:14px 18px;margin-bottom:10px;transition:box-shadow .15s}
.cp-row:hover{box-shadow:0 8px 20px -14px rgba(15,23,42,.5)}
.cp-row:last-child{margin-bottom:0}
.cp-num{width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}
.cp-row-main{min-width:0}
.cp-row-name{font-size:17px;font-weight:700;line-height:1.3}
.cp-row-meta{display:flex;align-items:center;gap:8px;color:var(--ink-2);font-size:14px;margin-top:4px}
.cp-row-meta svg{color:var(--tc,var(--muted))}

.cp-status{padding:5px 14px;border-radius:999px;font-weight:700;font-size:13px;text-align:center;justify-self:center;white-space:nowrap}
.st-open{background:#dbeafe;color:#1d4ed8}
.st-closed{background:#fef3c7;color:#b45309}
.st-completed{background:#d1fae5;color:#047857}
.st-locked{background:#ffe4e6;color:#be123c}

.cp-stat-top{display:flex;align-items:center;gap:8px;font-size:15px;white-space:nowrap}
.cp-stat-top svg{color:var(--mc,var(--muted));font-size:15px}
.cp-stat-lbl{color:var(--muted);font-size:13.5px;margin-top:2px}

.cp-view{border:1px solid var(--accent);color:var(--accent);background:var(--surface);border-radius:9px;padding:9px 14px;font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap;text-align:center;transition:background .15s,color .15s}
.cp-view:hover{background:var(--accent);color:#fff}

.cp-menu{position:relative;justify-self:end}
.cp-kebab{border:0;background:transparent;font-size:18px;padding:4px;cursor:pointer;color:var(--ink);line-height:1;border-radius:6px}
.cp-kebab:hover{background:#eef2ff}
.cp-menu-list{position:absolute;right:0;top:100%;z-index:20;background:var(--surface);border:1px solid var(--line);border-radius:8px;box-shadow:0 8px 20px rgba(15,23,42,.12);min-width:150px;padding:4px}
.cp-menu-list a{display:flex;align-items:center;gap:8px;padding:8px 10px;color:var(--ink);text-decoration:none;border-radius:6px;font-size:13px}
.cp-menu-list a:hover{background:#eef2ff}

/* ---------- view switch ---------- */
.cp-head-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.cp-seg{display:inline-flex;background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:3px;gap:2px}
.cp-seg-btn{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:var(--ink-2);font-weight:600;font-size:14px;padding:9px 16px;border-radius:9px;cursor:pointer;transition:background .15s,color .15s}
.cp-seg-btn:hover{background:var(--accent-soft)}
.cp-seg-btn.is-active{background:linear-gradient(135deg,#4f46e5,#2563eb);color:#fff;box-shadow:0 6px 14px -6px rgba(79,70,229,.8)}

/* ---------- cards view ---------- */
.cp-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px;align-items:start}
.cp-card{position:relative;overflow:hidden;background:linear-gradient(180deg,var(--tb,#eef2ff) 0,#fff 120px);border:1px solid var(--line);border-radius:18px;padding:22px 20px 20px;transition:box-shadow .2s,transform .2s}
.cp-card::before{content:'';position:absolute;left:0;right:0;top:0;height:5px;background:var(--tc,#4f46e5)}
.cp-card:hover{box-shadow:0 18px 36px -22px var(--tc);transform:translateY(-2px)}
.cp-card-top{display:flex;align-items:flex-start;gap:14px;margin-bottom:16px}
.cp-card-top .cp-avatar{width:52px;height:52px;background:#fff!important;box-shadow:0 6px 14px -8px var(--tc)}
.cp-card-heading{flex:1;min-width:0}
.cp-card-name{font-size:17px;font-weight:700;margin:0 0 2px;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

.cp-kpis{display:grid;grid-template-columns:repeat(3,1fr);margin:0 0 16px;background:#fff;border:1px solid var(--line-2);border-radius:12px;box-shadow:0 6px 16px -14px rgba(15,23,42,.5)}
.cp-kpis > div{padding:10px 12px;min-width:0}
.cp-kpis > div + div{border-left:1px solid var(--line-2)}
.cp-kpis dt{font-size:12px;font-weight:500;color:var(--muted);margin:0 0 3px}
.cp-kpis dd{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:800;margin:0;white-space:nowrap}
.cp-kpis dd svg{color:var(--mc);font-size:14px}

.cp-progress-wrap{margin-bottom:14px}
.cp-progress-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-size:12.5px;color:var(--muted)}
.cp-progress-row span:first-child{font-weight:700;color:var(--ink-2)}
.cp-progress{height:9px;background:#e8edf7;border-radius:999px;overflow:hidden}
.cp-progress-fill{height:100%;border-radius:999px;transition:width .5s cubic-bezier(.2,.8,.2,1)}

.cp-toggle{width:100%;border:1px solid var(--tc,var(--accent-line));background:#fff;color:var(--tc,var(--accent));font-weight:700;font-size:14px;padding:10px;border-radius:11px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:background .15s,color .15s}
.cp-toggle:hover{background:var(--tc,var(--accent));color:#fff}
.cp-toggle svg{transition:transform .2s ease}
.cp-card-projects{margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);display:flex;flex-direction:column;gap:8px}
.cp-card-projects .cp-row{margin-bottom:0}
.cp-add-block{justify-content:center;width:100%;margin-top:2px}

.cp-row.is-compact{grid-template-columns:30px minmax(0,1fr) auto 26px 24px;gap:10px;padding:10px 12px;background:#fff}
.cp-row.is-compact .cp-num{width:28px;height:28px;font-size:13px}
.cp-row.is-compact .cp-row-name{font-size:14.5px}
.cp-row.is-compact .cp-row-meta{font-size:12.5px;margin-top:2px}
.cp-row.is-compact .cp-status{font-size:12px;padding:3px 10px}
.cp-dot{color:#cbd5e1}
.cp-icon-link{color:var(--ink-2);display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;transition:background .15s,color .15s}
.cp-icon-link:hover{background:var(--accent);color:#fff}

/* ---------- responsive ---------- */
@media (max-width:1100px){
  .cp-acc-head{grid-template-columns:56px 1fr auto 24px;row-gap:14px;padding:16px 18px}
  .cp-acc-metrics{display:grid;grid-column:1/-1;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .cp-row:not(.is-compact){display:flex;flex-wrap:wrap;gap:12px 18px}
  .cp-row:not(.is-compact) .cp-row-main{flex:1 1 220px}
}
@media (max-width:800px){
  .dash-hero{padding:20px}
  .dash-hero-title{font-size:23px}
  .dash-hero-actions{width:100%}
  .dash-btn{flex:1;justify-content:center}
  .cp-filters{grid-template-columns:1fr 1fr}
  .cp-search{grid-column:1/-1}
  .cp-head-actions{width:100%}
  .cp-create{flex:1;justify-content:center}
  .cp-cards{grid-template-columns:1fr}
  .cp-acc-name{font-size:16px}
  .cp-metric-val{font-size:15px}
  .cp-acc-metrics{grid-template-columns:1fr 1fr}
}
@media (prefers-reduced-motion:reduce){
  .dash *,.cp-wrap *{transition:none!important}
  .dash .stat:hover,.cp-card:hover,.dash-btn:hover,.cp-create:hover{transform:none}
}
`;
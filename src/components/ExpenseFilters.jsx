import { FiSearch } from 'react-icons/fi';
import { STATUS_LABEL } from './ExpenseTable.jsx';
const CLEAR = { emp: '', from: '', to: '', reason: '', min: '', max: '', status: '' };
export default function ExpenseFilters({ f, setF, employees, shown, total }) {
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const active = Object.values(f).some(Boolean);
  return (
    <div className="border rounded p-2 mb-3" style={{ background: '#f8fafc' }}>
      <div className="row g-2">
        <div className="col-md-3"><select className="form-select form-select-sm" value={f.emp} onChange={set('emp')}>
          <option value="">All employees</option>{employees.map(e => <option key={e._id} value={e.email}>{e.name || e.email}</option>)}</select></div>
        <div className="col-6 col-md-2"><input type="date" className="form-control form-control-sm" title="From date" value={f.from} onChange={set('from')} /></div>
        <div className="col-6 col-md-2"><input type="date" className="form-control form-control-sm" title="To date" value={f.to} onChange={set('to')} /></div>
        <div className="col-md-3"><div className="input-group input-group-sm"><span className="input-group-text bg-white"><FiSearch /></span>
          <input className="form-control" placeholder="Search reason" value={f.reason} onChange={set('reason')} /></div></div>
        <div className="col-6 col-md-1"><input type="number" min="0" className="form-control form-control-sm" placeholder="Min ₹" value={f.min} onChange={set('min')} /></div>
        <div className="col-6 col-md-1"><input type="number" min="0" className="form-control form-control-sm" placeholder="Max ₹" value={f.max} onChange={set('max')} /></div>
        <div className="col-md-3"><select className="form-select form-select-sm" value={f.status || ''} onChange={set('status')}>
          <option value="">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </div>
      <div className="small text-muted mt-2">Showing {shown} of {total} bills. Filters only change this view, not the Excel or proof downloads.
        {active && <button className="btn btn-link btn-sm p-0 ms-2" onClick={() => setF(CLEAR)}>Clear filters</button>}</div>
    </div>
  );
}
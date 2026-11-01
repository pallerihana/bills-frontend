import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiLock, FiShield } from 'react-icons/fi';
import api, { errMsg, fmtDate, fmtSpan } from '../services/api';
import EmployeeMultiSelect from '../components/EmployeeMultiSelect.jsx';

const Shell = ({ children }) => <div className="bg-light min-vh-100 py-3"><div className="container" style={{ maxWidth: 560 }}>{children}</div></div>;

export default function SharedFormGate() {
  const { shareToken } = useParams(), nav = useNavigate();
  const [info, setInfo] = useState(null), [fatal, setFatal] = useState(''), [who, setWho] = useState([]);
  const [f, setF] = useState({ employeeId: '', email: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { api.get(`/forms/shared/${shareToken}`).then(r => setInfo(r.data)).catch(e => setFatal(errMsg(e))); }, [shareToken]);

  const submit = async e => {
    e.preventDefault(); if (busy) return;
    if (!who.length) return setErr('Select your name');
    if (!f.employeeId.trim()) return setErr('Enter your Employee ID');
    if (!f.email.trim()) return setErr('Enter your registered email');
    setBusy(true); setErr('');
    try {
      const { data } = await api.post(`/forms/shared/${shareToken}/verify`, { peId: who[0].key, employeeId: f.employeeId, email: f.email });
      nav(`/expense-form/${data.token}`, { replace: true });   // continue on the employee's own secure link
    } catch (x) { setErr(errMsg(x)); setBusy(false); }
  };

  if (fatal) return <Shell><div className="alert alert-danger">{fatal}</div></Shell>;
  if (!info) return <Shell><p>Loading…</p></Shell>;
  const p = info.project;
  return (
    <Shell>
      <div className="card shadow-sm mb-3"><div className="card-body">
        <h5 className="mb-1">Project Expense Form</h5><div>{p.collegeName}</div>
        <div className="small text-muted">{fmtSpan(p.startDate, p.endDate)}{p.subject && ` · ${p.subject}`}</div>
        {info.closesOn && !info.closed && <div className="small text-danger fw-semibold mt-1">Please submit before {fmtDate(info.closesOn)}</div>}
      </div></div>
      {info.closed && <div className="alert alert-warning"><div className="fw-semibold"><FiLock /> Expense Submission Closed</div>
        New bills are no longer accepted. You can still verify below to view the bills you already submitted.</div>}
      <form onSubmit={submit} className="card shadow-sm" autoComplete="off"><div className="card-body">
        {err && <div className="alert alert-danger">{err}</div>}
        <label className="form-label fw-semibold">Select Your Name *</label>
        <div className="mb-3"><EmployeeMultiSelect multiple={false} showSelectAll={false} value={who} onChange={setWho}
          options={info.employees.map(e => ({ key: e.id, name: e.name }))} placeholder="Search your name" /></div>
        <div className="small text-muted mb-2"><FiShield /> To confirm it is you, enter the details registered with the company.</div>
        <label className="form-label fw-semibold">Employee ID *</label>
        <input required className="form-control form-control-lg mb-3" autoComplete="off" value={f.employeeId} onChange={e => setF({ ...f, employeeId: e.target.value })} />
        <label className="form-label fw-semibold">Registered email *</label>
        <input required type="email" className="form-control form-control-lg mb-3" autoComplete="off" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <div className="d-grid"><button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button></div>
        <div className="small text-muted mt-2">You will continue on your own secure link. Bookmark it to come back later.</div>
      </div></form>
    </Shell>
  );
}
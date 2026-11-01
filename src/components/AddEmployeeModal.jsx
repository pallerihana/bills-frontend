import { useState } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api, { errMsg } from '../services/api';
import ManageIcons from './ManageIcons.jsx';
import PickList from './PickList.jsx';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loadEmployees = q => api.get('/employees', { params: { q, limit: 100, includeInactive: 1 } }).then(r => r.data.items);
const row = e => (
  <div className="d-flex justify-content-between align-items-center">
    <div><div className="fw-semibold">{e.name}</div><div className="small text-muted">{e.employeeId} — {e.email}</div></div>
    {!e.active && <span className="badge bg-secondary-subtle text-secondary-emphasis">Inactive</span>}
  </div>
);
const TITLES = { add: [FiUserPlus, 'Add New Employee', undefined], edit: [FiEdit2, 'Update Employee', '#b88700'], delete: [FiTrash2, 'Delete Employee', '#dc2626'] };

export default function AddEmployeeModal({ onClose, onAdded }) {
  const [mode, setMode] = useState('add'), [step, setStep] = useState('edit');
  const [f, setF] = useState({ name: '', employeeId: '', email: '' });
  const [picked, setPicked] = useState(null), [ef, setEf] = useState({ name: '', email: '', active: true });
  const [err, setErr] = useState(''), [ok, setOk] = useState(''), [busy, setBusy] = useState(false), [inUse, setInUse] = useState(false), [version, setVersion] = useState(0);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const clean = { name: f.name.trim().replace(/\s+/g, ' '), employeeId: f.employeeId.trim().toUpperCase(), email: f.email.trim().toLowerCase() };
  const go = m => { setMode(m); setStep('edit'); setPicked(null); setErr(''); setOk(''); setInUse(false); };
  const back = () => { setPicked(null); setErr(''); setInUse(false); };
  const done = msg => { setOk(msg); setPicked(null); setErr(''); setInUse(false); setVersion(v => v + 1); };

  // ----- add -----
  const review = e => {
    e.preventDefault();
    if (!clean.name) return setErr('Name is required');
    if (!clean.employeeId) return setErr('Employee ID is required');
    if (/\s/.test(clean.employeeId)) return setErr('Employee ID cannot contain spaces');
    if (!EMAIL.test(clean.email)) return setErr('Enter a valid email address');
    setErr(''); setStep('review');
  };
  const submit = async () => {
    if (busy) return; setBusy(true); setErr('');
    try { const { data } = await api.post('/employees', clean); onAdded(data); }
    catch (x) { setErr(errMsg(x)); setStep('edit'); setBusy(false); }
  };

  // ----- update -----
  const pickEdit = e => { setPicked(e); setEf({ name: e.name, email: e.email, active: e.active }); setErr(''); setOk(''); };
  const save = async e => {
    e.preventDefault();
    const name = ef.name.trim().replace(/\s+/g, ' '), email = ef.email.trim().toLowerCase();
    if (!name) return setErr('Name is required');
    if (!EMAIL.test(email)) return setErr('Enter a valid email address');
    setBusy(true); setErr('');
    try { await api.put(`/employees/${picked._id}`, { name, email, active: ef.active }); done(`${name} was updated.`); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  // ----- delete -----
  const remove = async () => {
    setBusy(true); setErr(''); setInUse(false);
    try { await api.delete(`/employees/${picked._id}`); done(`${picked.name} was deleted.`); }
    catch (x) { setErr(errMsg(x)); setInUse(!!x.response?.data?.inUse); } finally { setBusy(false); }
  };
  const deactivate = async () => {
    setBusy(true); setErr('');
    try { await api.put(`/employees/${picked._id}`, { name: picked.name, email: picked.email, active: false }); done(`${picked.name} was marked inactive and hidden from new selections.`); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  const [Icon, title, color] = TITLES[mode];
  const Msg = () => (<>{ok && <div className="alert alert-success py-2">{ok}</div>}{err && <div className="alert alert-danger py-2">{err}</div>}</>);

  let body;
  if (mode === 'add' && step === 'edit') body = (
    <form onSubmit={review}>
      <div className="modal-body">
        <Msg />
        <label className="form-label small fw-semibold">Name *</label>
        <input autoFocus required className="form-control mb-3" value={f.name} onChange={set('name')} placeholder="Enter Name" />
        <label className="form-label small fw-semibold">Employee ID *</label>
        <input required className="form-control mb-3" value={f.employeeId} onChange={set('employeeId')} placeholder="Enter ID" />
        <label className="form-label small fw-semibold">Email *</label>
        <input required type="email" className="form-control" value={f.email} onChange={set('email')} placeholder="name@company.com" />
        <div className="small text-muted mt-2">After adding, the employee appears in every employee dropdown straight away.</div>
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary">Review</button></div>
    </form>
  );
  else if (mode === 'add') body = (<>
    <div className="modal-body">
      <Msg />
      <p className="small text-muted mb-2">Please check the details before adding.</p>
      <dl className="mb-0"><dt className="small text-muted">Name</dt><dd>{clean.name}</dd><dt className="small text-muted">Employee ID</dt><dd>{clean.employeeId}</dd><dt className="small text-muted">Email</dt><dd className="mb-0">{clean.email}</dd></dl>
    </div>
    <div className="modal-footer"><button type="button" className="btn btn-light" disabled={busy} onClick={() => setStep('edit')}>Edit</button>
      <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Adding…' : 'Confirm and add'}</button></div>
  </>);
  else if (!picked) body = (<>
    <div className="modal-body"><Msg />
      <p className="small text-muted">{mode === 'edit' ? 'Choose the employee to update.' : 'Choose the employee to delete.'}</p>
      <PickList load={loadEmployees} version={version} keyOf={e => e._id} render={row} onPick={mode === 'edit' ? pickEdit : e => { setPicked(e); setErr(''); setOk(''); setInUse(false); }}
        placeholder="Search by name, ID or email" emptyText="No employees yet." /></div>
    <div className="modal-footer"><button type="button" className="btn btn-light" onClick={() => go('add')}>Back</button></div>
  </>);
  else if (mode === 'edit') body = (
    <form onSubmit={save}>
      <div className="modal-body">
        <Msg />
        <label className="form-label small fw-semibold">Employee ID</label>
        <input disabled className="form-control mb-1" value={picked.employeeId} />
        <div className="small text-muted mb-3">The ID cannot be changed because projects and bills refer to it.</div>
        <label className="form-label small fw-semibold">Name *</label>
        <input required className="form-control mb-3" value={ef.name} onChange={e => setEf({ ...ef, name: e.target.value })} />
        <label className="form-label small fw-semibold">Email *</label>
        <input required type="email" className="form-control mb-3" value={ef.email} onChange={e => setEf({ ...ef, email: e.target.value })} />
        <div className="form-check"><input className="form-check-input" type="checkbox" id="emp-active" checked={ef.active} onChange={e => setEf({ ...ef, active: e.target.checked })} />
          <label className="form-check-label small" htmlFor="emp-active">Active (can be selected for new projects and bills)</label></div>
        <div className="small text-muted mt-2">Existing projects and bills keep the details they already have.</div>
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-light" disabled={busy} onClick={back}>Back</button><button className="btn btn-warning" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  );
  else body = (<>
    <div className="modal-body">
      <Msg />
      <p className="mb-2">Delete this employee?</p>
      <dl className="mb-0"><dt className="small text-muted">Name</dt><dd>{picked.name}</dd><dt className="small text-muted">Employee ID</dt><dd>{picked.employeeId}</dd><dt className="small text-muted">Email</dt><dd className="mb-0">{picked.email}</dd></dl>
      {inUse && picked.active && <button type="button" className="btn btn-outline-warning btn-sm mt-3" disabled={busy} onClick={deactivate}>Mark inactive instead</button>}
    </div>
    <div className="modal-footer"><button type="button" className="btn btn-light" disabled={busy} onClick={back}>Back</button>
      <button className="btn btn-danger" disabled={busy || inUse} onClick={remove}>{busy ? 'Deleting…' : 'Delete employee'}</button></div>
  </>);

  return (
    <div className="modal d-block" style={{ background: 'rgba(15,23,42,.45)' }} onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
        <div className="modal-header">
          <h6 className="modal-title d-flex align-items-center gap-2" style={{ color }}><Icon /> {title}</h6>
          <ManageIcons mode={mode} setMode={go} onClose={onClose} busy={busy} what="employee" />
        </div>
        {body}
      </div></div>
    </div>
  );
}
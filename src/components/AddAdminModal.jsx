import { useState } from 'react';
import { FiShield, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import api, { errMsg } from '../services/api';
import ManageIcons from './ManageIcons.jsx';
import PickList from './PickList.jsx';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loadAdmins = q => api.get('/auth/admins', { params: { q } }).then(r => r.data.items);
const row = a => (
  <div className="d-flex justify-content-between align-items-center">
    <div><div className="fw-semibold">{a.name}</div><div className="small text-muted">{a.email}</div></div>
    {a.isYou && <span className="badge bg-primary-subtle text-primary-emphasis">You</span>}
  </div>
);
const TITLES = { add: [FiShield, 'Add Admin', undefined], edit: [FiEdit2, 'Update Admin', '#b88700'], delete: [FiTrash2, 'Delete Admin', '#dc2626'] };

export default function AddAdminModal({ onClose, onCreated }) {
  const [mode, setMode] = useState('add'), [show, setShow] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const [picked, setPicked] = useState(null), [ef, setEf] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(''), [ok, setOk] = useState(''), [busy, setBusy] = useState(false), [need, setNeed] = useState(0), [version, setVersion] = useState(0);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const go = m => { setMode(m); setPicked(null); setErr(''); setOk(''); setNeed(0); };
  const back = () => { setPicked(null); setErr(''); setNeed(0); };
  const done = msg => { setOk(msg); setPicked(null); setErr(''); setNeed(0); setVersion(v => v + 1); };
  const Eye = () => <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <FiEyeOff /> : <FiEye />}</button>;

  // ----- add -----
  const create = async e => {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Name is required');
    if (!EMAIL.test(f.email.trim())) return setErr('Enter a valid email address');
    if (f.password.length < 8) return setErr('Password must be at least 8 characters');
    if (f.password !== f.confirm) return setErr('The two passwords do not match');
    setBusy(true); setErr('');
    try { const { data } = await api.post('/auth/admins', { name: f.name, email: f.email, password: f.password }); onCreated(data); }
    catch (x) { setErr(errMsg(x)); setBusy(false); }
  };

  // ----- update -----
  const pickEdit = a => { setPicked(a); setEf({ name: a.name, email: a.email, password: '' }); setErr(''); setOk(''); };
  const save = async e => {
    e.preventDefault();
    if (!ef.name.trim()) return setErr('Name is required');
    if (!EMAIL.test(ef.email.trim())) return setErr('Enter a valid email address');
    if (ef.password && ef.password.length < 8) return setErr('New password must be at least 8 characters');
    setBusy(true); setErr('');
    try { await api.put(`/auth/admins/${picked._id}`, { name: ef.name, email: ef.email, password: ef.password }); done(`${ef.name.trim()} was updated.`); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  // ----- delete -----
  const pickDelete = a => {
    if (a.isYou) { setErr('You cannot delete the account you are logged in with.'); return; }
    setPicked(a); setErr(''); setOk(''); setNeed(0);
  };
  const remove = async transfer => {
    setBusy(true); setErr('');
    try {
      const { data } = await api.delete(`/auth/admins/${picked._id}`, { params: transfer ? { transfer: 1 } : {} });
      done(`${picked.name} was deleted${data.transferred ? ` and ${data.transferred} project(s) moved to you. Refresh the dashboard to see them` : ''}.`);
    } catch (x) { setErr(errMsg(x)); setNeed(x.response?.data?.needsTransfer ? x.response.data.projects : 0); } finally { setBusy(false); }
  };

  const [Icon, title, color] = TITLES[mode];
  const Msg = () => (<>{ok && <div className="alert alert-success py-2">{ok}</div>}{err && <div className="alert alert-danger py-2">{err}</div>}</>);

  let body;
  if (mode === 'add') body = (
    <form onSubmit={create} autoComplete="off">
      <div className="modal-body">
        <Msg />
        <label className="form-label small fw-semibold">Name *</label>
        <input autoFocus required className="form-control mb-3" autoComplete="off" value={f.name} onChange={set('name')} />
        <label className="form-label small fw-semibold">Email *</label>
        <input required type="email" className="form-control mb-3" autoComplete="off" value={f.email} onChange={set('email')} placeholder="admin@company.com" />
        <label className="form-label small fw-semibold">Password * <span className="text-muted fw-normal">(at least 8 characters)</span></label>
        <div className="input-group mb-3"><input required type={show ? 'text' : 'password'} className="form-control" autoComplete="new-password" value={f.password} onChange={set('password')} /><Eye /></div>
        <label className="form-label small fw-semibold">Confirm password *</label>
        <input required type={show ? 'text' : 'password'} className="form-control" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} />
        <div className="small text-muted mt-2">The new admin signs in with this email and password and gets their own workspace. The password cannot be viewed again after saving.</div>
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-light" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create admin'}</button></div>
    </form>
  );
  else if (!picked) body = (<>
    <div className="modal-body"><Msg />
      <p className="small text-muted">{mode === 'edit' ? 'Choose the admin to update.' : 'Choose the admin to delete.'}</p>
      <PickList load={loadAdmins} version={version} keyOf={a => a._id} render={row} onPick={mode === 'edit' ? pickEdit : pickDelete} placeholder="Search by name or email" emptyText="No admins found." /></div>
    <div className="modal-footer"><button type="button" className="btn btn-light" onClick={() => go('add')}>Back</button></div>
  </>);
  else if (mode === 'edit') body = (
    <form onSubmit={save} autoComplete="off">
      <div className="modal-body">
        <Msg />
        <label className="form-label small fw-semibold">Name *</label>
        <input required className="form-control mb-3" autoComplete="off" value={ef.name} onChange={e => setEf({ ...ef, name: e.target.value })} />
        <label className="form-label small fw-semibold">Email *</label>
        <input required type="email" className="form-control mb-3" autoComplete="off" value={ef.email} onChange={e => setEf({ ...ef, email: e.target.value })} />
        <label className="form-label small fw-semibold">New password <span className="text-muted fw-normal">(leave empty to keep the current one)</span></label>
        <div className="input-group"><input type={show ? 'text' : 'password'} className="form-control" autoComplete="new-password" value={ef.password} onChange={e => setEf({ ...ef, password: e.target.value })} /><Eye /></div>
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-light" disabled={busy} onClick={back}>Back</button><button className="btn btn-warning" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  );
  else body = (<>
    <div className="modal-body">
      <Msg />
      <p className="mb-2">Delete this admin? They will no longer be able to log in.</p>
      <dl className="mb-0"><dt className="small text-muted">Name</dt><dd>{picked.name}</dd><dt className="small text-muted">Email</dt><dd className="mb-0">{picked.email}</dd></dl>
    </div>
    <div className="modal-footer"><button type="button" className="btn btn-light" disabled={busy} onClick={back}>Back</button>
      {need > 0 ? <button className="btn btn-danger" disabled={busy} onClick={() => remove(true)}>{busy ? 'Working…' : `Transfer ${need} project${need === 1 ? '' : 's'} and delete`}</button>
        : <button className="btn btn-danger" disabled={busy} onClick={() => remove(false)}>{busy ? 'Deleting…' : 'Delete admin'}</button>}</div>
  </>);

  return (
    <div className="modal d-block" style={{ background: 'rgba(15,23,42,.45)' }} onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
        <div className="modal-header">
          <h6 className="modal-title d-flex align-items-center gap-2" style={{ color }}><Icon /> {title}</h6>
          <ManageIcons mode={mode} setMode={go} onClose={onClose} busy={busy} what="admin" />
        </div>
        {body}
      </div></div>
    </div>
  );
}
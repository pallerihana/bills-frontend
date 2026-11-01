import { useState } from 'react';
import api, { errMsg, inr, proofList } from '../services/api';
import ProofUploads from './ProofUploads.jsx';
import ExistingProofs from './ExistingProofs.jsx';
import EmployeeMultiSelect from './EmployeeMultiSelect.jsx';
export default function CompanyBillModal({ projectId, employees, bill, onClose, onSaved }) {
  const edit = !!bill;
  const [f, setF] = useState({ date: bill ? bill.date.slice(0, 10) : '', reason: bill?.reason || '', paidBy: bill?.paidBy || 'Company', amount: bill?.amount ?? '' });
  // Only employees of THIS project, plus anyone already on this bill who was removed from the project later
  const options = [...employees.map(e => ({ key: e.email, name: e.name || e.email, employeeId: e.employeeId, email: e.email })),
    ...(bill?.memberEmails || []).filter(m => !employees.some(e => e.email === m)).map(m => ({ key: m, name: bill.members[bill.memberEmails.indexOf(m)] || m, email: m }))];
  const [sel, setSel] = useState(() => options.filter(o => (bill?.memberEmails || []).includes(o.key)));
  const [files, setFiles] = useState([]), [removed, setRemoved] = useState(() => new Set()), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const existing = edit ? proofList(bill) : [], aliveKept = existing.filter(p => !p.deleted && !removed.has(p.id)).length;
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const each = sel.length && Number(f.amount) > 0 ? Number(f.amount) / sel.length : null;
  const save = async e => {
    e.preventDefault(); setErr('');
    if (!sel.length) return setErr('Select at least one member');
    if (!edit && !files.length) return setErr('Upload at least one proof file');
    if (existing.some(p => !p.deleted && removed.has(p.id)) && aliveKept + files.length < 1) return setErr('A bill must keep at least one proof. Add a new file before removing the last one.');
    setBusy(true);
    const fd = new FormData();
    ['date', 'reason', 'paidBy', 'amount'].forEach(k => fd.append(k, f[k]));
    fd.append('memberEmails', JSON.stringify(sel.map(x => x.key)));
    if (edit) fd.append('removeProofs', JSON.stringify([...removed]));
    files.forEach(x => fd.append('proof', x));
    try { edit ? await api.put(`/projects/${projectId}/company-bills/${bill._id}`, fd) : await api.post(`/projects/${projectId}/company-bills`, fd); onSaved(); }
    catch (x) { setErr(errMsg(x)); setBusy(false); }
  };
  return (
    <div className="modal d-block" style={{ background: 'rgba(15,23,42,.45)' }}><div className="modal-dialog modal-dialog-centered modal-dialog-scrollable"><form className="modal-content" onSubmit={save}>
      <div className="modal-header" style={{ background: '#fef2f2' }}>
        <h6 className="modal-title" style={{ color: '#b91c1c' }}><span className="badge me-2" style={{ background: '#dc2626' }}>COMPANY BILL</span>{edit ? `Edit ${bill.billLabel}` : 'New Company Bill'}</h6>
        <button type="button" className="btn-close" onClick={onClose} /></div>
      <div className="modal-body" style={{ minHeight: 420 }}>
        {err && <div className="alert alert-danger py-2">{err}</div>}
        <div className="row g-2">
          <div className="col-6"><label className="form-label small fw-semibold">Date *</label><input type="date" required className="form-control" value={f.date} onChange={set('date')} /></div>
          <div className="col-6"><label className="form-label small fw-semibold">Amount (₹) *</label><input type="number" required min="0.01" step="0.01" className="form-control" value={f.amount} onChange={set('amount')} /></div>
          <div className="col-12"><label className="form-label small fw-semibold">Reason *</label><input required className="form-control" placeholder="Bus booking from Company to College" value={f.reason} onChange={set('reason')} /></div>
          <div className="col-12"><label className="form-label small fw-semibold">Members *</label>
            <EmployeeMultiSelect options={options} value={sel} onChange={setSel} placeholder="Search project employees" />
            {each && <div className="small text-muted mt-1">About {inr(each.toFixed(2))} per member. The bill total stays {inr(f.amount)} and is counted once.</div>}</div>
          <div className="col-12"><label className="form-label small fw-semibold">Paid By *</label>
            <input required list="paidby" className="form-control" value={f.paidBy} onChange={set('paidBy')} />
            <datalist id="paidby"><option value="Company" />{employees.map(e => <option key={e._id} value={e.name || e.email} />)}</datalist></div>
          <div className="col-12">
            <label className="form-label small fw-semibold">Proofs *</label>
            {edit && <><ExistingProofs bill={bill} projectId={projectId} removed={removed} setRemoved={setRemoved} /><div className="small text-muted mt-2 mb-1">Add more proof files to this same bill:</div></>}
            <ProofUploads files={files} onChange={setFiles} existingCount={aliveKept} />
          </div>
        </div>
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
        <button className="btn text-white" style={{ background: '#dc2626' }} disabled={busy}>{busy ? 'Saving…' : edit ? 'Save changes' : 'Save Company Bill'}</button></div>
    </form></div></div>
  );
}
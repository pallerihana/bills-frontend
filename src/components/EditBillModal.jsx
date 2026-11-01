import { useMemo, useState } from 'react';
import api, { errMsg, proofList } from '../services/api';
import ProofUploads from './ProofUploads.jsx';
import ExistingProofs from './ExistingProofs.jsx';
import EmployeeMultiSelect from './EmployeeMultiSelect.jsx';
export default function EditBillModal({ projectId, bill, project, onClose, onSaved }) {
  const refs = project?.formMemberRefs || [], useRefs = refs.length > 0, ids = bill.memberIds || [];
  const [f, setF] = useState({ date: bill.date.slice(0, 10), reason: bill.reason, paidBy: bill.paidBy, amount: bill.amount, members: bill.members.join(', ') });
  const { options, initial } = useMemo(() => {
    const m = new Map();
    refs.forEach(r => m.set(r.employeeId, { key: r.employeeId, name: r.name, employeeId: r.employeeId }));
    ids.forEach((id, i) => { if (!m.has(id)) m.set(id, { key: id, name: bill.members[i] || id, employeeId: id }); });    // on the bill, but no longer on the form list
    bill.members.slice(ids.length).forEach(n => m.set(`legacy:${n}`, { key: `legacy:${n}`, name: n, hint: 'typed name' })); // names saved before the directory existed
    const options = [...m.values()];
    return { options, initial: options.filter(o => ids.includes(o.key) || o.key.startsWith('legacy:')) };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState(initial), [files, setFiles] = useState([]), [removed, setRemoved] = useState(() => new Set());
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const existing = proofList(bill), aliveKept = existing.filter(p => !p.deleted && !removed.has(p.id)).length;
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const save = async e => {
    e.preventDefault(); setErr('');
    if (useRefs && !sel.length) return setErr('Select at least one member');
    if (existing.some(p => !p.deleted && removed.has(p.id)) && aliveKept + files.length < 1) return setErr('A bill must keep at least one proof. Add a new file before removing the last one.');
    setBusy(true);
    const fd = new FormData();
    ['date', 'reason', 'paidBy', 'amount'].forEach(k => fd.append(k, f[k]));
    if (useRefs) {
      fd.append('members', JSON.stringify(sel.map(x => x.name)));
      fd.append('memberIds', JSON.stringify(sel.filter(x => !x.key.startsWith('legacy:')).map(x => x.employeeId)));
    } else fd.append('members', JSON.stringify(f.members.split(',').map(m => m.trim()).filter(Boolean)));
    fd.append('removeProofs', JSON.stringify([...removed]));
    files.forEach(x => fd.append('proof', x));
    try { await api.put(`/projects/${projectId}/expenses/${bill._id}`, fd); onSaved(); } catch (x) { setErr(errMsg(x)); setBusy(false); }
  };
  return (
    <div className="modal d-block" style={{ background: 'rgba(15,23,42,.45)' }}><div className="modal-dialog modal-dialog-centered modal-dialog-scrollable"><form className="modal-content" onSubmit={save}>
      <div className="modal-header"><h6 className="modal-title">Edit Bill No. {bill.billNo}</h6><button type="button" className="btn-close" onClick={onClose} /></div>
      <div className="modal-body" style={{ minHeight: 380 }}>
        {err && <div className="alert alert-danger py-2">{err}</div>}
        <div className="row g-2">
          <div className="col-6"><label className="form-label small">Date</label><input type="date" required className="form-control" value={f.date} onChange={set('date')} /></div>
          <div className="col-6"><label className="form-label small">Amount (₹)</label><input type="number" required min="0.01" step="0.01" className="form-control" value={f.amount} onChange={set('amount')} /></div>
          <div className="col-12"><label className="form-label small">Reason</label><input required className="form-control" value={f.reason} onChange={set('reason')} /></div>
          <div className="col-12"><label className="form-label small">Members</label>
            {useRefs ? <EmployeeMultiSelect options={options} value={sel} onChange={setSel} placeholder="Search members" />
              : <input required className="form-control" placeholder="Comma separated names" value={f.members} onChange={set('members')} />}</div>
          <div className="col-12"><label className="form-label small">Paid By</label><input required className="form-control" value={f.paidBy} onChange={set('paidBy')} /></div>
          <div className="col-12">
            <label className="form-label small">Proofs</label>
            <ExistingProofs bill={bill} projectId={projectId} removed={removed} setRemoved={setRemoved} />
            <div className="small text-muted mt-2 mb-1">Add more proof files to this same bill:</div>
            <ProofUploads files={files} onChange={setFiles} existingCount={aliveKept} />
          </div>
        </div>
        <div className="small text-muted mt-2">The bill number stays {bill.billNo}. Proofs you remove are deleted when you save.</div>
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </form></div></div>
  );
}
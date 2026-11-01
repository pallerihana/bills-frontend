import { useState } from 'react';
export default function RejectModal({ bill, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal d-block" style={{ background: 'rgba(15,23,42,.45)' }}><div className="modal-dialog modal-dialog-centered"><form className="modal-content" onSubmit={e => { e.preventDefault(); onConfirm(reason.trim()); }}>
      <div className="modal-header"><h6 className="modal-title">Reject Bill #{bill.billNo}</h6><button type="button" className="btn-close" onClick={onClose} /></div>
      <div className="modal-body">
        <label className="form-label small fw-semibold">Rejection reason * <span className="text-muted fw-normal">(the employee will see this)</span></label>
        <textarea required autoFocus rows={3} maxLength={300} className="form-control" placeholder="Example: Receipt is not readable, please upload a clearer photo" value={reason} onChange={e => setReason(e.target.value)} />
        <div className="small text-muted mt-2">Rejected bills are not counted in totals, Excel or the proof document.</div>
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-danger" disabled={!reason.trim()}>Reject Bill</button></div>
    </form></div></div>
  );
}
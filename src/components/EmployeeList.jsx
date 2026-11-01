import { FiTrash2, FiBell } from 'react-icons/fi';
import { inr, fmtDate } from '../services/api';
export const badge = s => s === 'Submitted' ? 'bg-success' : s === 'No Bill' ? 'bg-secondary' : 'bg-warning text-dark';
export const Who = ({ name, email }) => <div><div className="fw-semibold">{name || email}</div>{name && <div className="text-muted small">{email}</div>}</div>;
export default function EmployeeList({ employees, onRemove, onSelect, selectedId, onRemind, remindOpen, locked }) {
  if (!employees.length) return <p className="text-muted mb-0">No employees added yet.</p>;
  return (
    <div className="table-responsive"><table className="table table-sm align-middle">
      <thead><tr><th>Employee</th><th>Status</th><th className="text-end">Bills</th><th className="text-end">Total Amount</th>{onRemind && <th>Reminder</th>}<th></th></tr></thead>
      <tbody>{employees.map(e => (
        <tr key={e._id} className={selectedId === e._id ? 'table-active' : ''}>
          <td>{onSelect ? <button className="btn btn-link p-0 text-start text-decoration-none" onClick={() => onSelect(e._id)}><Who name={e.name} email={e.email} /></button> : <Who name={e.name} email={e.email} />}</td>
          <td><span className={`badge ${badge(e.status)}`}>{e.status}</span></td>
          <td className="text-end">{e.bills}</td><td className="text-end">{inr(e.totalAmount)}</td>
          {onRemind && <td>{e.status === 'Pending' && <>
            <button className="btn btn-outline-warning btn-sm" disabled={!e.canRemind || locked} onClick={() => onRemind(e)}
              title={e.canRemind ? 'Send a reminder to this employee only' : !e.sentAt ? 'Send the form first' : remindOpen ? 'Not available' : 'Enabled in the last 2 days before the deadline'}><FiBell /> Send Reminder</button>
            {e.reminderCount > 0 && <div className="text-muted" style={{ fontSize: 11 }}>Reminded {e.reminderCount}× · last {fmtDate(e.lastReminderAt)}</div>}</>}</td>}
          <td className="text-end">{onRemove && !locked && e.bills === 0 && <button className="btn btn-sm text-danger" onClick={() => onRemove(e._id)} title="Remove"><FiTrash2 /></button>}</td></tr>
      ))}</tbody>
    </table></div>
  );
}
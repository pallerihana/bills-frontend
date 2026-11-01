import { FiEdit2, FiTrash2 } from 'react-icons/fi';
export default function ManageIcons({ mode, setMode, onClose, busy, what }) {
  const btn = (m, Icon, color, tint, label) => (
    <button type="button" disabled={busy} title={label} aria-label={label} aria-pressed={mode === m}
      className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
      style={{ width: 32, height: 32, color, background: mode === m ? tint : 'transparent' }}
      onClick={() => setMode(mode === m ? 'add' : m)}><Icon size={17} /></button>
  );
  return (
    <div className="d-flex align-items-center gap-1">
      {btn('edit', FiEdit2, '#d99a00', '#fef3c7', `Update ${what}`)}
      {btn('delete', FiTrash2, '#dc2626', '#fee2e2', `Delete ${what}`)}
      <button type="button" className="btn-close ms-1" aria-label="Close" onClick={onClose} disabled={busy} />
    </div>
  );
}
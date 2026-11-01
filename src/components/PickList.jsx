import { useCallback, useEffect, useRef, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { errMsg } from '../services/api';

// Searchable list. load(text) must return an array. It reloads when `version` changes (after a save or delete).
export default function PickList({ load, version = 0, onPick, keyOf, render, placeholder = 'Search', emptyText = 'Nothing found.' }) {
  const [q, setQ] = useState(''), [items, setItems] = useState([]), [loading, setLoading] = useState(true), [err, setErr] = useState('');
  const rid = useRef(0);
  const run = useCallback(async text => {
    const id = ++rid.current; setLoading(true); setErr('');
    try { const list = await load(text); if (id === rid.current) setItems(list); }
    catch (e) { if (id === rid.current) setErr(errMsg(e)); }
    finally { if (id === rid.current) setLoading(false); }
  }, [load]);
  useEffect(() => { const t = setTimeout(() => run(q.trim()), q ? 300 : 0); return () => clearTimeout(t); }, [q, version, run]);
  return (
    <div>
      <div className="input-group mb-2"><span className="input-group-text bg-white"><FiSearch /></span>
        <input autoFocus className="form-control" placeholder={placeholder} value={q} onChange={e => setQ(e.target.value)} autoComplete="off" /></div>
      <div className="list-group" style={{ maxHeight: 280, overflowY: 'auto' }}>
        {loading && <div className="list-group-item small text-muted"><span className="spinner-border spinner-border-sm me-2" />Loading…</div>}
        {err && <div className="list-group-item small text-danger">{err} <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={() => run(q.trim())}>Retry</button></div>}
        {!loading && !err && !items.length && <div className="list-group-item small text-muted">{q ? 'No matches.' : emptyText}</div>}
        {!err && items.map(it => <button type="button" key={keyOf(it)} className="list-group-item list-group-item-action" style={{ minHeight: 48 }} onClick={() => onPick(it)}>{render(it)}</button>)}
      </div>
    </div>
  );
}
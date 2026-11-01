import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiX, FiSearch, FiCheck, FiAlertCircle } from 'react-icons/fi';
import api, { errMsg } from '../services/api';

const label = it => [it.name, it.employeeId, it.email].filter(Boolean).join(' — '); // Employee Name — Employee ID — Email

// value: selected items [{ key, name, employeeId?, email? }]   onChange(items)
// options: local list (omit it to search the employee database)   isDisabled(item): text such as 'Already added', or false
export default function EmployeeMultiSelect({ value = [], onChange, options, multiple = true, isDisabled, disabled, placeholder = 'Search by name, ID or email', showSelectAll = true }) {
  const remote = !options;
  const [q, setQ] = useState(''), [open, setOpen] = useState(false), [hi, setHi] = useState(0);
  const [items, setItems] = useState([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(false), [err, setErr] = useState('');
  const box = useRef(null), input = useRef(null), rid = useRef(0);
  const sel = useMemo(() => new Set(value.map(v => v.key)), [value]);

  const fetchRemote = useCallback(async text => {
    const id = ++rid.current; setLoading(true); setErr('');
    try {
      const { data } = await api.get('/employees', { params: { q: text, limit: 100 } });
      if (id !== rid.current) return; // a newer search has started
      setItems(data.items.map(e => ({ key: e.employeeId, name: e.name, employeeId: e.employeeId, email: e.email, active: e.active }))); setTotal(data.total);
    } catch (e) { if (id === rid.current) setErr(errMsg(e)); }
    finally { if (id === rid.current) setLoading(false); }
  }, []);

  useEffect(() => { // search as you type, 300 ms after the last keystroke (immediately when opened)
    if (!remote || !open) return undefined;
    const t = setTimeout(() => fetchRemote(q.trim()), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, open, remote, fetchRemote]);
  useEffect(() => { setHi(0); }, [q, items]);
  useEffect(() => {
    const h = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const list = useMemo(() => {
    if (remote) return items;
    const t = q.trim().toLowerCase();
    return t ? options.filter(o => label(o).toLowerCase().includes(t)) : options;
  }, [remote, items, options, q]);

  const block = it => (it.disabled ? it.reason || 'Unavailable' : (isDisabled && isDisabled(it)) || (it.active === false ? 'Inactive' : ''));
  const toggle = it => {
    if (block(it)) return;
    if (sel.has(it.key)) onChange(value.filter(v => v.key !== it.key));           // choosing again removes it, so no duplicates
    else { onChange(multiple ? [...value, it] : [it]); if (!multiple) setOpen(false); }
    setQ(''); input.current?.focus();
  };
  const addable = list.filter(it => !block(it) && !sel.has(it.key));
  const onKey = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi(h => Math.min(h + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { if (open && list[hi]) { e.preventDefault(); toggle(list[hi]); } }
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Backspace' && !q && value.length) onChange(value.slice(0, -1));
  };

  return (
    <div ref={box} className="position-relative">
      {value.length > 0 && <div className="d-flex flex-wrap gap-1 mb-2">{value.map(v => (
        <span key={v.key} className="badge rounded-pill bg-primary-subtle text-primary-emphasis d-inline-flex align-items-center gap-1 fw-medium" style={{ fontSize: 13, padding: '6px 10px' }}>
          {v.name}{v.employeeId && <span className="opacity-75">· {v.employeeId}</span>}
          <button type="button" disabled={disabled} className="btn p-0 border-0 lh-1" aria-label={`Remove ${v.name}`} onClick={() => onChange(value.filter(x => x.key !== v.key))}><FiX /></button>
        </span>))}</div>}

      <div className="input-group">
        <span className="input-group-text bg-white"><FiSearch /></span>
        <input ref={input} className="form-control" role="combobox" aria-expanded={open} aria-autocomplete="list" autoComplete="off" disabled={disabled}
          placeholder={placeholder} value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey} />
      </div>
      <div className="d-flex justify-content-between small text-muted mt-1">
        <span>{value.length} selected</span>
        {multiple && showSelectAll && <span>
          <button type="button" className="btn btn-link btn-sm p-0" disabled={disabled || !addable.length} onClick={() => onChange([...value, ...addable])}>Select all shown</button>
          {' · '}<button type="button" className="btn btn-link btn-sm p-0" disabled={disabled || !value.length} onClick={() => onChange([])}>Clear</button></span>}
      </div>

      {open && !disabled && (
        <div className="border rounded bg-white shadow position-absolute w-100 mt-1" style={{ zIndex: 1050, maxHeight: 280, overflowY: 'auto' }} role="listbox" aria-multiselectable={multiple}>
          {loading && <div className="px-3 py-2 small text-muted"><span className="spinner-border spinner-border-sm me-2" />Loading employees…</div>}
          {err && <div className="px-3 py-2 small text-danger"><FiAlertCircle /> {err} <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={() => fetchRemote(q.trim())}>Retry</button></div>}
          {!loading && !err && !list.length && <div className="px-3 py-3 small text-muted">
            {q ? 'No employees match your search.' : remote ? 'No employees found. Add them to the seed file and run node seed.js.' : 'No employees available.'}</div>}
          {!err && list.map((it, i) => { const why = block(it), on = sel.has(it.key); return (
            <div key={it.key} role="option" aria-selected={on} aria-disabled={!!why} className={`d-flex align-items-center gap-2 px-3 py-2 ${i === hi ? 'bg-light' : ''} ${why ? 'text-muted' : ''}`}
              style={{ cursor: why ? 'not-allowed' : 'pointer', minHeight: 44 }} onMouseEnter={() => setHi(i)} onMouseDown={e => e.preventDefault()} onClick={() => toggle(it)}
              ref={el => { if (el && i === hi) el.scrollIntoView({ block: 'nearest' }); }}>
              <span style={{ width: 18, flex: 'none' }}>{on && <FiCheck className="text-success" />}</span>
              <span className="small flex-grow-1" style={{ overflowWrap: 'anywhere' }}>{label(it)}</span>
              {why ? <span className="badge bg-secondary-subtle text-secondary-emphasis">{why}</span>
                : it.hint && <span className="badge bg-warning-subtle text-warning-emphasis">{it.hint}</span>}
            </div>); })}
          {remote && !err && total > items.length && <div className="px-3 py-2 small text-muted border-top">Showing the first {items.length} of {total}. Keep typing to narrow the list.</div>}
        </div>)}
    </div>
  );
}
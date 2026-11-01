import { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
const MAX_TAGS = 15, MAX_LEN = 30;
const clean = s => s.trim().replace(/\s+/g, ' ');

export default function TagInput({ value, onChange, placeholder = 'Type a subject, then press Enter' }) {
  const [draft, setDraft] = useState(''), [note, setNote] = useState('');
  const add = text => {
    const parts = text.split(',').map(clean).filter(Boolean);        // a comma also ends a tag
    if (!parts.length) { setDraft(''); return; }
    const next = [...value]; let msg = '';
    for (const t of parts) {
      if (t.length > MAX_LEN) { msg = `A tag can be at most ${MAX_LEN} characters`; continue; }
      if (next.some(x => x.toLowerCase() === t.toLowerCase())) { msg = `"${t}" is already added`; continue; }
      if (next.length >= MAX_TAGS) { msg = `You can add up to ${MAX_TAGS} tags`; break; }
      next.push(t);
    }
    onChange(next); setNote(msg);
    setDraft(next.length === value.length && msg ? text : '');       // keep the text when nothing was added, so it can be fixed
  };
  return (
    <div>
      {value.length > 0 && <div className="d-flex flex-wrap gap-1 mb-2">{value.map(t => (
        <span key={t} className="badge rounded-pill bg-primary-subtle text-primary-emphasis d-inline-flex align-items-center gap-1 fw-medium" style={{ fontSize: 13, padding: '6px 10px' }}>
          {t}<button type="button" className="btn p-0 border-0 lh-1" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter(x => x !== t))}><FiX /></button>
        </span>))}</div>}
      <div className="input-group">
        <input className="form-control" maxLength={MAX_LEN + 1} placeholder={placeholder} value={draft}
          onChange={e => (e.target.value.includes(',') ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); }                                  // Enter adds a tag, it does not submit the form
            else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => { if (draft.trim()) add(draft); }} />
        <button type="button" className="btn btn-outline-primary" onClick={() => add(draft)}><FiPlus /> Add</button>
      </div>
      <div className="small text-muted mt-1">{note ? <span className="text-danger">{note}</span> : 'Press Enter or comma after each subject, for example "Java DSA" and "Python".'} · {value.length}/{MAX_TAGS}</div>
    </div>
  );
}
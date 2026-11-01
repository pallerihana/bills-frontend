import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCamera, FiImage, FiFileText, FiEye, FiRefreshCw, FiTrash2 } from 'react-icons/fi';

export const MAX_PROOFS = 6;
const OK = ['application/pdf', 'image/jpeg', 'image/png'], MAX_FILE = 10 * 1024 * 1024, MAX_TOTAL = 40 * 1024 * 1024;
const same = (a, b) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
const kb = n => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function Row({ file, index, disabled, onPreview, onReplace, onRemove }) {
  const isImg = file.type.startsWith('image/');
  const url = useMemo(() => (isImg ? URL.createObjectURL(file) : null), [file, isImg]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return (
    <div className="d-flex align-items-center gap-2 border rounded p-2 mb-2 bg-white">
      <div className="d-flex align-items-center justify-content-center rounded bg-light" style={{ width: 54, height: 54, flex: 'none', overflow: 'hidden' }}>
        {isImg ? <img src={url} alt="" style={{ width: 54, height: 54, objectFit: 'cover' }} /> : <FiFileText size={26} className="text-secondary" />}
      </div>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <div className="fw-semibold small">Proof File {index + 1}</div>
        <div className="small text-muted text-truncate" title={file.name}>{file.name} · {kb(file.size)}</div>
        <div className="d-flex flex-wrap gap-1 mt-1">
          <button type="button" className="btn btn-outline-secondary btn-sm py-0" onClick={() => onPreview(file)}><FiEye /> Preview</button>
          <button type="button" className="btn btn-outline-secondary btn-sm py-0" disabled={disabled} onClick={() => onReplace(index)}><FiRefreshCw /> Replace</button>
          <button type="button" className="btn btn-outline-danger btn-sm py-0" disabled={disabled} onClick={() => onRemove(index)}><FiTrash2 /> Remove</button>
        </div>
      </div>
    </div>
  );
}

// Several proof files for ONE bill. files: File[]   existingCount: proofs already saved on the bill (when editing)
export default function ProofUploads({ files, onChange, disabled, existingCount = 0, max = MAX_PROOFS }) {
  const [error, setError] = useState('');
  const cam = useRef(null), gal = useRef(null), pdf = useRef(null), repl = useRef(null), replIndex = useRef(-1);
  const total = files.length + existingCount, room = max - total;

  const validate = f => (!OK.includes(f.type) ? `"${f.name}": only PDF, JPG, JPEG or PNG files are allowed` : f.size > MAX_FILE ? `"${f.name}" is over 10 MB` : '');

  const add = list => {
    const next = [...files]; let msg = '';
    for (const f of list) {
      const bad = validate(f);
      if (bad) { msg = bad; continue; }
      if (next.some(x => same(x, f))) { msg = `"${f.name}" is already added`; continue; }
      if (next.length + existingCount >= max) { msg = `You can attach at most ${max} proof files to one bill`; break; }
      if (next.reduce((s, x) => s + x.size, 0) + f.size > MAX_TOTAL) { msg = 'The files are too large together (40 MB at most)'; break; }
      next.push(f);
    }
    setError(msg); onChange(next);
  };
  const onPick = e => { const list = Array.from(e.target.files || []); e.target.value = ''; if (list.length) add(list); };   // reset so the same photo can be chosen again
  const startReplace = i => { replIndex.current = i; repl.current.click(); };
  const onReplacePick = e => {
    const f = e.target.files[0], i = replIndex.current; e.target.value = '';
    if (!f || i < 0) return;
    const bad = validate(f);
    if (bad) return setError(bad);
    if (files.some((x, k) => k !== i && same(x, f))) return setError(`"${f.name}" is already added`);
    setError(''); onChange(files.map((x, k) => (k === i ? f : x)));
  };
  const preview = f => { const u = URL.createObjectURL(f); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); };

  return (
    <div>
      <input ref={cam} type="file" hidden accept="image/*" capture="environment" onChange={onPick} />
      <input ref={gal} type="file" hidden multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={onPick} />
      <input ref={pdf} type="file" hidden multiple accept="application/pdf,.pdf" onChange={onPick} />
      <input ref={repl} type="file" hidden accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" onChange={onReplacePick} />

      {files.map((f, i) => (
        <Row key={`${f.name}-${f.size}-${f.lastModified}-${i}`} file={f} index={existingCount + i} disabled={disabled}
          onPreview={preview} onReplace={startReplace} onRemove={k => { setError(''); onChange(files.filter((_, j) => j !== k)); }} />
      ))}

      {room > 0 && (
        <div className="d-grid gap-2">
          <button type="button" className="btn btn-primary btn-lg" disabled={disabled} onClick={() => cam.current.click()}><FiCamera /> {total ? 'Take Another Photo' : 'Take Photo'}</button>
          <button type="button" className="btn btn-outline-primary btn-lg" disabled={disabled} onClick={() => gal.current.click()}><FiImage /> Choose from Gallery</button>
          <button type="button" className="btn btn-outline-secondary" disabled={disabled} onClick={() => pdf.current.click()}><FiFileText /> Choose PDF</button>
        </div>
      )}
      <div className="small text-muted mt-2">
        {total} of {max} files{room <= 0 && ' (limit reached)'}. All files belong to this one bill, for example a handwritten note and the UPI payment screenshot.
      </div>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}
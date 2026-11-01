import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCamera, FiImage, FiFileText } from 'react-icons/fi';
const OK = ['application/pdf', 'image/jpeg', 'image/png'], MAX = 10 * 1024 * 1024;

export default function ProofUpload({ file, onChange, disabled }) {
  const [error, setError] = useState('');
  const cam = useRef(), gal = useRef(), pdf = useRef();
  const isImg = !!file && file.type.startsWith('image/');
  const url = useMemo(() => (isImg ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const pick = e => {
    const f = e.target.files[0]; e.target.value = ''; // lets the same photo be picked again after a retake
    if (!f) return;
    if (!OK.includes(f.type)) { setError('Only PDF, JPG, JPEG or PNG files are allowed'); return; }
    if (f.size > MAX) { setError('File must be under 10 MB'); return; }
    setError(''); onChange(f);
  };

  return (
    <div>
      {/* hidden inputs: camera (rear camera on phones, plain file picker on desktop), gallery, PDF */}
      <input ref={cam} type="file" hidden accept="image/*" capture="environment" onChange={pick} />
      <input ref={gal} type="file" hidden accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={pick} />
      <input ref={pdf} type="file" hidden accept="application/pdf,.pdf" onChange={pick} />

      {!file ? (
        <div className="d-grid gap-2">
          <button type="button" className="btn btn-primary btn-lg" disabled={disabled} onClick={() => cam.current.click()}><FiCamera /> Take Photo</button>
          <button type="button" className="btn btn-outline-primary btn-lg" disabled={disabled} onClick={() => gal.current.click()}><FiImage /> Choose from Gallery</button>
          <button type="button" className="btn btn-outline-secondary" disabled={disabled} onClick={() => pdf.current.click()}><FiFileText /> Choose PDF</button>
        </div>
      ) : (
        <div className="border rounded p-2 text-center">
          {isImg ? <img src={url} alt="Proof preview" className="img-fluid rounded" style={{ maxHeight: 260 }} />
            : <div className="py-3"><FiFileText size={44} className="text-secondary" /></div>}
          <div className="small mt-2 text-break">{file.name} <span className="text-muted">({(file.size / 1024).toFixed(0)} KB)</span></div>
          <button type="button" className="btn btn-outline-secondary btn-sm mt-2" disabled={disabled} onClick={() => { setError(''); onChange(null); }}>{isImg ? 'Retake / Change' : 'Change File'}</button>
        </div>
      )}
      {error && <div className="text-danger small mt-2">{error}</div>}
    </div>
  );
}
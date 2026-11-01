import { useState } from 'react';
import { FiUpload } from 'react-icons/fi';
const OK = ['application/pdf', 'image/jpeg', 'image/png'], MAX = 10 * 1024 * 1024;
export default function FileUpload({ file, onChange }) {
  const [error, setError] = useState('');
  const pick = e => {
    const f = e.target.files[0]; if (!f) return;
    if (!OK.includes(f.type)) { setError('Only PDF, JPG, JPEG or PNG files are allowed'); onChange(null); return; }
    if (f.size > MAX) { setError('File must be under 10 MB'); onChange(null); return; }
    setError(''); onChange(f);
  };
  return (
    <div>
      <label className="btn btn-outline-primary btn-lg w-100"><FiUpload /> {file ? 'Change proof' : 'Upload proof'}
        <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*" onChange={pick} /></label>
      {file && <div className="mt-2 small text-success">Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)</div>}
      {file?.type.startsWith('image/') && <img alt="Proof preview" src={URL.createObjectURL(file)} className="img-thumbnail mt-2" style={{ maxHeight: 160 }} />}
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}

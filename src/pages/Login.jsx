import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';

export default function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [remember, setRemember] = useState(true);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  const passwordValid = f.password.length >= 6;
  const formValid = emailValid && passwordValid;

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formValid || busy) return;
      setBusy(true);
      setErr('');
      try {
        const { data } = await api.post('/auth/login', f);
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('token', data.token);
        if (data.user) storage.setItem('user', JSON.stringify(data.user));
        nav('/', { replace: true });
      } catch (x) {
        setErr(errMsg(x));
      } finally {
        setBusy(false);
      }
    },
    [f, formValid, busy, nav, remember]
  );

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !busy) submit(e);
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: linear-gradient(-45deg, #eef2ff, #e0e7ff, #f0f9ff, #ede9fe);
          background-size: 400% 400%;
          animation: gradientShift 18s ease infinite;
        }

        .login-card {
          width: 400px;
          max-width: 100%;
          border-radius: 16px;
          border: none;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px -12px rgba(79, 70, 229, 0.18),
                      0 4px 12px rgba(0, 0, 0, 0.04);
          animation: fadeInUp 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .login-card:hover {
          box-shadow: 0 24px 48px -12px rgba(79, 70, 229, 0.28),
                      0 6px 16px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }

        .login-icon {
          width: 56px;
          height: 56px;
          font-size: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 8px 20px -6px rgba(99, 102, 241, 0.55);
          animation: floatIcon 3.5s ease-in-out infinite;
          margin-bottom: 0.75rem;
        }

        .login-title {
          animation: fadeIn 0.6s ease 0.1s both;
        }
        .login-subtitle {
          animation: fadeIn 0.6s ease 0.2s both;
        }

        .form-row {
          animation: fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .form-row-1 { animation-delay: 0.15s; }
        .form-row-2 { animation-delay: 0.25s; }
        .form-row-3 { animation-delay: 0.35s; }
        .form-row-4 { animation-delay: 0.45s; }

        .form-control,
        .input-group-text,
        .btn {
          transition: all 0.22s ease;
        }
        .form-control:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
          transform: translateY(-1px);
        }
        .form-control:not(:focus):hover {
          border-color: #c7d2fe;
        }

        .login-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          font-weight: 600;
          letter-spacing: 0.3px;
          padding: 0.6rem 1rem;
          position: relative;
          overflow: hidden;
        }
        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          transform: translateY(-2px);
          box-shadow: 0 10px 22px -8px rgba(99, 102, 241, 0.6);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-btn:disabled {
          opacity: 0.75;
        }

        .alert-shake {
          animation: shake 0.45s ease, fadeIn 0.3s ease;
        }

        .toggle-pw {
          border-color: #dee2e6;
          background: #fff;
        }
        .toggle-pw:hover {
          background: #f8f9fa;
        }

        .link-hover {
          transition: color 0.2s ease;
        }
        .link-hover:hover {
          color: #4f46e5 !important;
        }
      `}</style>

      <div className="login-page">
        <form
          onSubmit={submit}
          onKeyDown={onKeyDown}
          className="login-card shadow-sm"
          noValidate
        >
          <div className="text-center mb-4">
            <div className="login-icon" aria-hidden="true">💼</div>
            <h4 className="login-title mb-1 fw-bold">CodeTantra Project Expenses</h4>
            <p className="login-subtitle text-muted small mb-0">
              Sign in to manage your bills
            </p>
          </div>

          {err && (
            <div
              key={err}
              className="alert alert-danger py-2 small d-flex align-items-center alert-shake"
              role="alert"
            >
              <span className="me-2">⚠️</span>
              <span>{err}</span>
            </div>
          )}

          <div className="mb-3 form-row form-row-1">
            <label htmlFor="email" className="form-label small fw-semibold">
              Email
            </label>
            <input
              id="email"
              name="email"
              className={`form-control ${touched.email && !emailValid ? 'is-invalid' : ''}`}
              type="email"
              autoComplete="email"
              autoFocus
              required
              placeholder="you@example.com"
              value={f.email}
              disabled={busy}
              onChange={(e) => setF({ ...f, email: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={touched.email && !emailValid}
            />
            {touched.email && !emailValid && (
              <div className="invalid-feedback">Please enter a valid email.</div>
            )}
          </div>

          <div className="mb-2 form-row form-row-2">
            <label htmlFor="password" className="form-label small fw-semibold">
              Password
            </label>
            <div className="input-group">
              <input
                id="password"
                name="password"
                className={`form-control ${touched.password && !passwordValid ? 'is-invalid' : ''}`}
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength={6}
                placeholder="••••••••"
                value={f.password}
                disabled={busy}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                aria-invalid={touched.password && !passwordValid}
              />
              <button
                type="button"
                className="btn btn-outline-secondary toggle-pw"
                onClick={() => setShowPw((s) => !s)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
              {touched.password && !passwordValid && (
                <div className="invalid-feedback">
                  Password must be correct.
                </div>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3 form-row form-row-3">
          
           
          </div>

          <button
            type="submit"
            className="btn login-btn text-white w-100 d-flex align-items-center justify-content-center gap-2 form-row form-row-4"
            disabled={busy || !formValid}
          >
            {busy && (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
            )}
            {busy ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </>
  );
}
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setTouched({ email: true, password: true });
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

  const emailBad = touched.email && !emailValid;
  const pwBad = touched.password && !passwordValid;

  return (
    <>
      <style>{`
        @property --angle {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }

        @keyframes spinAngle   { to { --angle: 360deg; } }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(60px, 40px) scale(1.15); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-70px, -30px) scale(1.2); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(40px, -60px) scale(0.9); }
        }
        @keyframes enter {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px); }
          40% { transform: translateX(7px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes btnFlow {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes shine {
          from { transform: translateX(-120%) skewX(-20deg); }
          to   { transform: translateX(260%) skewX(-20deg); }
        }
        @keyframes tick {
          from { stroke-dashoffset: 20; }
          to   { stroke-dashoffset: 0; }
        }

        .lg-page {
          --c1: #6366f1;
          --c2: #22d3ee;
          --c3: #f472b6;
          --c4: #a78bfa;
          --ink: #1e1b4b;
          --muted: #6b7280;
          --surface: #ffffff;
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          overflow: hidden;
          background:
            radial-gradient(1200px 600px at 15% 0%, #eef2ff 0%, transparent 60%),
            radial-gradient(900px 500px at 100% 100%, #fdf2f8 0%, transparent 60%),
            #f8faff;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }

        /* soft color orbs travelling behind the card */
        .lg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.28;
          pointer-events: none;
        }
        .lg-orb-1 { width: 380px; height: 380px; background: var(--c1); top: -90px; left: -80px;  animation: drift1 14s ease-in-out infinite; }
        .lg-orb-2 { width: 340px; height: 340px; background: var(--c3); bottom: -100px; right: -60px; animation: drift2 17s ease-in-out infinite; }
        .lg-orb-3 { width: 260px; height: 260px; background: var(--c2); top: 45%; left: 62%; opacity: 0.2; animation: drift3 20s ease-in-out infinite; }

        /* faint dotted grid */
        .lg-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(99,102,241,0.16) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
          pointer-events: none;
        }

        /* ---------- card with traveling gradient border ---------- */
        .lg-card-wrap {
          position: relative;
          width: 410px;
          max-width: 100%;
          padding: 2px;
          border-radius: 22px;
          background: conic-gradient(
            from var(--angle),
            var(--c1), var(--c2), var(--c3), var(--c4), var(--c1)
          );
          animation: spinAngle 6s linear infinite, enter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        /* glow that follows the same travelling colors */
        .lg-card-wrap::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 24px;
          background: inherit;
          filter: blur(22px);
          opacity: 0.35;
          z-index: -1;
        }

        .lg-card {
          position: relative;
          border-radius: 20px;
          padding: 2.1rem 1.9rem 1.8rem;
          background:
            linear-gradient(160deg, rgba(99,102,241,0.05), transparent 40%),
            var(--surface);
          color: var(--ink);
        }

        /* ---------- header ---------- */
        .lg-head { text-align: center; margin-bottom: 1.6rem; }

        .lg-icon {
          position: relative;
          width: 64px;
          height: 64px;
          margin: 0 auto 0.9rem;
          display: grid;
          place-items: center;
          font-size: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--c1), var(--c4));
          box-shadow: 0 10px 28px -6px rgba(99, 102, 241, 0.7);
          animation: float 3.6s ease-in-out infinite;
        }
        .lg-icon::after {
          content: '';
          position: absolute;
          inset: -7px;
          border-radius: 50%;
          border: 2px dashed transparent;
          border-top-color: var(--c2);
          border-right-color: var(--c3);
          animation: spin 3.2s linear infinite;
        }

        .lg-title {
          margin: 0 0 0.3rem;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          background: linear-gradient(90deg, #4338ca, #7c3aed, #db2777, #0891b2, #4338ca);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: btnFlow 7s linear infinite;
        }
        .lg-sub { margin: 0; font-size: 0.88rem; color: var(--muted); }

        .lg-in { animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .lg-in-1 { animation-delay: 0.30s; }
        .lg-in-2 { animation-delay: 0.40s; }
        .lg-in-3 { animation-delay: 0.50s; }
        .lg-in-4 { animation-delay: 0.60s; }

        /* ---------- fields ---------- */
        .lg-field { margin-bottom: 1.1rem; }
        .lg-label {
          display: block;
          margin-bottom: 0.4rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: #374151;
        }

        .lg-box {
          position: relative;
          padding: 1.5px;
          border-radius: 12px;
          background: #e2e8f0;
          transition: background 0.25s ease, box-shadow 0.25s ease;
        }
        .lg-box:hover { background: #c7d2fe; }
        .lg-box:focus-within {
          background: conic-gradient(
            from var(--angle),
            var(--c2), var(--c1), var(--c3), var(--c4), var(--c2)
          );
          animation: spinAngle 3s linear infinite;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.14), 0 8px 24px -10px rgba(34, 211, 238, 0.5);
        }
        .lg-box.bad { background: #f43f5e; }
        .lg-box.bad:focus-within { animation: none; background: #f43f5e; box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.18); }

        .lg-inner {
          display: flex;
          align-items: center;
          border-radius: 10.5px;
          background: #f8fafc;
        }
        .lg-lead {
          padding-left: 0.85rem;
          font-size: 1rem;
          opacity: 0.7;
          transition: opacity 0.2s, transform 0.2s;
        }
        .lg-box:focus-within .lg-lead { opacity: 1; transform: scale(1.12); }

        .lg-input {
          flex: 1;
          min-width: 0;
          width: 100%;
          padding: 0.72rem 0.85rem;
          border: 0;
          outline: 0;
          background: transparent;
          color: #111827;
          font-size: 0.95rem;
        }
        .lg-input::placeholder { color: #9ca3af; }
        .lg-input:disabled { opacity: 0.6; }
        .lg-input:-webkit-autofill {
          -webkit-text-fill-color: #111827;
          -webkit-box-shadow: 0 0 0 40px #f8fafc inset;
        }

        .lg-eye {
          border: 0;
          background: transparent;
          padding: 0 0.85rem;
          font-size: 1rem;
          cursor: pointer;
          opacity: 0.75;
          transition: opacity 0.2s, transform 0.2s;
        }
        .lg-eye:hover { opacity: 1; transform: scale(1.15); }

        .lg-msg { margin: 0.35rem 0 0 0.2rem; font-size: 0.78rem; color: #e11d48; animation: rise 0.25s ease both; }

        /* ---------- remember ---------- */
        .lg-remember {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          margin: 0.15rem 0 1.3rem;
          font-size: 0.85rem;
          color: var(--muted);
          cursor: pointer;
          user-select: none;
        }
        .lg-remember input { position: absolute; opacity: 0; pointer-events: none; }
        .lg-check {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          border: 1.5px solid #cbd5e1;
          background: #fff;
          transition: all 0.2s ease;
        }
        .lg-check svg { width: 12px; height: 12px; }
        .lg-check path {
          stroke: #fff;
          stroke-width: 2.4;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
        }
        .lg-remember input:checked + .lg-check {
          background: linear-gradient(135deg, var(--c1), var(--c4));
          border-color: transparent;
          box-shadow: 0 4px 12px -3px rgba(99, 102, 241, 0.7);
        }
        .lg-remember input:checked + .lg-check path { animation: tick 0.3s ease forwards; }
        .lg-remember input:focus-visible + .lg-check { outline: 2px solid var(--c2); outline-offset: 2px; }
        .lg-remember:hover { color: #374151; }

        /* ---------- error ---------- */
        .lg-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.6rem 0.8rem;
          border-radius: 10px;
          font-size: 0.84rem;
          color: #be123c;
          background: #fff1f2;
          border: 1px solid rgba(244, 63, 94, 0.4);
          animation: shake 0.45s ease, rise 0.3s ease;
        }

        /* ---------- button ---------- */
        .lg-btn {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          padding: 0.8rem 1rem;
          border: 0;
          border-radius: 12px;
          overflow: hidden;
          color: #fff;
          font-size: 0.98rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          background: linear-gradient(90deg, var(--c1), var(--c4), var(--c3), var(--c2), var(--c1));
          background-size: 200% 100%;
          animation: btnFlow 5s linear infinite;
          box-shadow: 0 12px 26px -10px rgba(99, 102, 241, 0.8);
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }
        .lg-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: translateX(-120%) skewX(-20deg);
        }
        .lg-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 18px 32px -10px rgba(139, 92, 246, 0.85);
        }
        .lg-btn:hover:not(:disabled)::after { animation: shine 0.9s ease; }
        .lg-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
        .lg-btn:disabled { opacity: 0.55; cursor: not-allowed; animation-play-state: paused; }
        .lg-btn:focus-visible { outline: 2px solid #4f46e5; outline-offset: 3px; }

        .lg-spin {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }

        @media (max-width: 440px) {
          .lg-card { padding: 1.7rem 1.3rem 1.5rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lg-page *, .lg-page *::before, .lg-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="lg-page">
        <span className="lg-orb lg-orb-1" aria-hidden="true" />
        <span className="lg-orb lg-orb-2" aria-hidden="true" />
        <span className="lg-orb lg-orb-3" aria-hidden="true" />

        <div className="lg-card-wrap">
          <form onSubmit={submit} className="lg-card" noValidate>
            <div className="lg-head">
              <div className="lg-icon" aria-hidden="true">💼</div>
              <h1 className="lg-title">CodeTantra Project Expenses</h1>
              <p className="lg-sub">Sign in to manage your bills</p>
            </div>

            {err && (
              <div key={err} className="lg-alert" role="alert">
                <span aria-hidden="true">⚠️</span>
                <span>{err}</span>
              </div>
            )}

            <div className="lg-field lg-in lg-in-1">
              <label htmlFor="email" className="lg-label">Email</label>
              <div className={`lg-box ${emailBad ? 'bad' : ''}`}>
                <div className="lg-inner">
                  <span className="lg-lead" aria-hidden="true">✉️</span>
                  <input
                    id="email"
                    name="email"
                    className="lg-input"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    placeholder="you@example.com"
                    value={f.email}
                    disabled={busy}
                    onChange={(e) => setF({ ...f, email: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    aria-invalid={emailBad}
                  />
                </div>
              </div>
              {emailBad && <div className="lg-msg">Enter a valid email address.</div>}
            </div>

            <div className="lg-field lg-in lg-in-2">
              <label htmlFor="password" className="lg-label">Password</label>
              <div className={`lg-box ${pwBad ? 'bad' : ''}`}>
                <div className="lg-inner">
                  <span className="lg-lead" aria-hidden="true">🔒</span>
                  <input
                    id="password"
                    name="password"
                    className="lg-input"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={f.password}
                    disabled={busy}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    aria-invalid={pwBad}
                  />
                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setShowPw((s) => !s)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              {pwBad && <div className="lg-msg">Password must be at least 6 characters.</div>}
            </div>

            <div className="lg-in lg-in-3">
              <label className="lg-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="lg-check" aria-hidden="true">
                  <svg viewBox="0 0 12 12"><path d="M2 6.5l2.6 2.6L10 3.4" /></svg>
                </span>
                Keep me signed in
              </label>
            </div>

            <div className="lg-in lg-in-4">
              <button type="submit" className="lg-btn" disabled={busy || !formValid}>
                {busy && <span className="lg-spin" role="status" aria-hidden="true" />}
                {busy ? 'Logging in…' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

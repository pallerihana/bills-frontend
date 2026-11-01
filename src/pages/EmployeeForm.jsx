
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  FiPlus,
  FiX,
  FiCheckCircle,
  FiPaperclip,
  FiLock
} from 'react-icons/fi';

import api, {
  errMsg,
  blobError,
  fmtDate,
  fmtSpan,
  inr
} from '../services/api';

import ProofUploads from '../components/ProofUploads.jsx';
import EmployeeMultiSelect from '../components/EmployeeMultiSelect.jsx';

const ST = {
  SUBMITTED: ['Submitted', 'secondary'],
  UNDER_REVIEW: ['Under Review', 'info'],
  APPROVED: ['Approved', 'success'],
  REJECTED: ['Rejected', 'danger'],
  REIMBURSED: ['Reimbursed', 'primary']
};

const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

// Defined outside the component to prevent input focus loss.
const Shell = ({ children }) => (
  <div className="bg-light min-vh-100 py-3">
    <div className="container" style={{ maxWidth: 560 }}>
      {children}
    </div>
  </div>
);

const Header = ({ info }) => {
  const p = info.project;

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <h5 className="mb-1">Project Expense Form</h5>
        <div>{p.collegeName}</div>
        <div className="small text-muted">
          {fmtSpan(p.startDate, p.endDate)}
          {p.subject && ` · ${p.subject}`}
        </div>

        {info.closesOn && !info.closed && (
          <div className="small text-danger fw-semibold mt-1">
            Please submit before {fmtDate(info.closesOn)}
          </div>
        )}
      </div>
    </div>
  );
};

function MyBills({ info, flash, onDismiss, onAdd, onView }) {
  const { bills, closed } = info;

  const total = bills
    .filter(b => b.status !== 'REJECTED')
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  return (
    <>
      <Header info={info} />

      {closed && (
        <div className="alert alert-danger">
          <h5 className="mb-1">
            <FiLock /> Expense Submission Closed
          </h5>
          <div>
            The form submission deadline has passed. New expense submissions
            are no longer accepted.
          </div>
        </div>
      )}

      {flash && (
        <div className="alert alert-success d-flex justify-content-between align-items-start">
          <div>
            <div className="fw-semibold">
              <FiCheckCircle /> Bill submitted successfully
            </div>
            Bill Number: #{flash.billNo} · Amount: {inr(flash.amount)}
          </div>

          <button
            className="btn-close"
            onClick={onDismiss}
            aria-label="Close"
          />
        </div>
      )}

      {bills.length ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">My Submitted Bills</h6>
            <span className="small text-muted">
              {bills.length} bill{bills.length === 1 ? '' : 's'} · {inr(total)}
            </span>
          </div>

          {bills.map(b => {
            // Support the new proofs array and legacy single-proof fields.
            const proofs = Array.isArray(b.proofs) && b.proofs.length
              ? b.proofs
              : b.proofAvailable
                ? [{
                    available: b.proofAvailable,
                    name: b.proofOriginalName || b.proofFile || 'Proof'
                  }]
                : [];

            return (
              <div className="card shadow-sm mb-2" key={b._id}>
                <div className="card-body py-3">
                  <div className="d-flex justify-content-between">
                    <strong>Bill #{b.billNo}</strong>
                    <strong>{inr(b.amount)}</strong>
                  </div>

                  <div className="mt-1">
                    <span
                      className={`badge bg-${(ST[b.status] || ST.SUBMITTED)[1]}-subtle text-${(ST[b.status] || ST.SUBMITTED)[1]}-emphasis rounded-pill`}
                    >
                      {(ST[b.status] || ST.SUBMITTED)[0]}
                    </span>
                  </div>

                  {b.status === 'REJECTED' && b.rejectionReason && (
                    <div className="small text-danger mt-1">
                      Reason: {b.rejectionReason}
                    </div>
                  )}

                  <div className="small mt-1">
                    Date: {fmtDate(b.date)}
                  </div>
                  <div className="small">Reason: {b.reason}</div>
                  <div className="small">Paid By: {b.paidBy}</div>
                  <div className="small text-muted">
                    Members ({b.totalMembers}): {(b.members || []).join(', ')}
                  </div>

                  <div className="mt-2">
                    <div className="small mb-1">
                      Proofs ({proofs.length}):
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      {proofs.length ? (
                        proofs.map((q, i) => (
                          <button
                            key={q._id || i}
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            disabled={q.available === false}
                            title={q.name || `Proof ${i + 1}`}
                            onClick={() => onView(b, i)}
                          >
                            <FiPaperclip />{' '}
                            {q.available === false
                              ? `Proof ${i + 1} (no longer available)`
                              : `Proof ${i + 1}`}
                          </button>
                        ))
                      ) : (
                        <span className="small text-muted">
                          No longer available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        !closed && (
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>No bills submitted yet.</h6>
              <p className="text-muted mb-0">
                If you have project-related expenses, submit your first bill
                below.
              </p>
            </div>
          </div>
        )
      )}

      {!closed && (
        <div className="d-grid mt-3">
          <button className="btn btn-primary btn-lg" onClick={onAdd}>
            <FiPlus /> {bills.length ? 'ADD NEW BILL' : 'ADD BILL'}
          </button>
        </div>
      )}
    </>
  );
}

const asItems = i =>
  (i.memberOptions || []).map(o => ({
    key: o.id,
    name: o.name,
    employeeId: o.id
  }));

export default function EmployeeForm() {
  const { token } = useParams();
  const [sp] = useSearchParams();
  const answer = sp.get('answer');

  const [info, setInfo] = useState(null);
  const [fatal, setFatal] = useState('');
  const [view, setView] = useState('loading');
  const [flash, setFlash] = useState(null);

  const [f, setF] = useState({
    date: '',
    reason: '',
    paidBy: '',
    amount: ''
  });

  const [members, setMembers] = useState(['']);
  const [picked, setPicked] = useState([]);
  const [files, setFiles] = useState([]);

  const [step, setStep] = useState('edit');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(uid);

  const fetchInfo = async () => {
    const { data } = await api.get(`/forms/${token}`);
    setInfo(data);
    return data;
  };

  const goClosed = async () => {
    try {
      const i = await fetchInfo();
      setInfo({ ...i, closed: true });
    } catch {
      setInfo(i => (i ? { ...i, closed: true } : i));
    }
    setView('closed');
  };

  const resetForm = () => {
    setF({
      date: '',
      reason: '',
      paidBy: '',
      amount: ''
    });

    setMembers(info?.members?.length ? info.members : ['']);
    setPicked(asItems(info || {}));

    // Fixed: use the declared setFiles state setter.
    setFiles([]);

    setStep('edit');
    setErr('');
    setRequestId(uid());
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const i = await api.get(`/forms/${token}`).then(r => r.data);
        if (!active) return;

        setInfo(i);
        setMembers(i.members?.length ? i.members : ['']);
        setPicked(asItems(i));

        if (i.closed) {
          setView('closed');
          return;
        }

        if (i.bills?.length) {
          setView('mybills');
          return;
        }

        if (answer === 'no') {
          await api.post(`/forms/${token}/respond`, { answer: 'no' });
          if (active) setView('nobill');
          return;
        }

        if (answer === 'yes' || i.status === 'Submitted') {
          setView('form');
          return;
        }

        setView('ask');
      } catch (e) {
        if (!active) return;

        if (e.response?.status === 410) {
          await goClosed();
        } else {
          setFatal(errMsg(e));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const sayNo = async () => {
    setErr('');

    try {
      await api.post(`/forms/${token}/respond`, { answer: 'no' });
      setView('nobill');
    } catch (e) {
      if (e.response?.status === 410) {
        await goClosed();
      } else {
        setErr(errMsg(e));
      }
    }
  };

  const addNew = () => {
    resetForm();
    setFlash(null);
    setView('form');
    window.scrollTo(0, 0);
  };

  const viewProof = async (b, i = 0) => {
    const w = window.open('', '_blank');

    try {
      const r = await api.get(
        `/forms/${token}/bills/${b._id}/proof?i=${i}`,
        { responseType: 'blob' }
      );

      const url = URL.createObjectURL(r.data);

      if (w) {
        w.location.href = url;
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = b.proofs?.[i]?.name || 'proof';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // Revoke the URL after the browser has had time to open/download it.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      if (w) w.close();
      window.alert(await blobError(e));
    }
  };

  const set = k => e =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const useRefs = !!info?.memberOptions?.length;

  const names = useRefs
    ? picked.map(x => x.name)
    : members.map(m => m.trim()).filter(Boolean);

  const review = e => {
    e.preventDefault();

    if (!names.length) {
      setErr('Add at least one member');
      return;
    }

    if (!files.length) {
      setErr(
        'Add at least one proof: take a photo, choose from the gallery, or choose a PDF'
      );
      return;
    }

    if (!(Number(f.amount) > 0)) {
      setErr('Amount must be greater than zero');
      return;
    }

    setErr('');
    setStep('preview');
  };

  const submit = async () => {
    if (busy) return;

    setBusy(true);
    setErr('');

    const fd = new FormData();

    Object.entries(f).forEach(([k, v]) => fd.append(k, v));

    fd.append('members', JSON.stringify(names));

    if (useRefs) {
      fd.append(
        'memberIds',
        JSON.stringify(picked.map(x => x.employeeId))
      );
    }

    files.forEach(file => fd.append('proof', file));
    fd.append('requestId', requestId);

    try {
      const r = await api.post(`/forms/${token}`, fd);

      setFlash({
        billNo: r.data.billNo,
        amount: r.data.amount ?? Number(f.amount)
      });

      // Refresh bills and project information after submission.
      const updated = await fetchInfo().catch(() => null);

      if (updated) {
        setInfo(updated);
      }

      setFiles([]);
      setRequestId(uid());
      setView('mybills');
      window.scrollTo(0, 0);
    } catch (e) {
      if (e.response?.status === 410) {
        await goClosed();
      } else {
        setErr(errMsg(e));
        setStep('edit');
      }
    } finally {
      setBusy(false);
    }
  };

  if (fatal) {
    return (
      <Shell>
        <div className="alert alert-danger">{fatal}</div>
      </Shell>
    );
  }

  if (!info) {
    return (
      <Shell>
        <p>Loading…</p>
      </Shell>
    );
  }

  if (view === 'mybills' || view === 'closed') {
    return (
      <Shell>
        <MyBills
          info={info}
          flash={flash}
          onDismiss={() => setFlash(null)}
          onAdd={addNew}
          onView={viewProof}
        />
      </Shell>
    );
  }

  if (view === 'ask') {
    return (
      <Shell>
        <Header info={info} />

        {err && <div className="alert alert-danger">{err}</div>}

        <div className="card shadow-sm">
          <div className="card-body text-center">
            <h5 className="mb-3">
              Do you have project-related bills to submit?
            </h5>

            <div className="d-grid gap-2">
              <button
                className="btn btn-success btn-lg"
                onClick={() => setView('form')}
              >
                YES, I HAVE BILLS
              </button>

              <button
                className="btn btn-outline-secondary btn-lg"
                onClick={sayNo}
              >
                NO, I DON'T HAVE BILLS
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (view === 'nobill') {
    return (
      <Shell>
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <h5>No Bill Submitted</h5>
            <p>Thank you. Your response has been recorded.</p>
            <p className="mb-3">
              Status: <strong>No Bill</strong>
            </p>

            <button className="btn btn-link" onClick={addNew}>
              I actually have a bill to submit
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (view === 'loading') {
    return (
      <Shell>
        <p>Loading…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header info={info} />

      {err && <div className="alert alert-danger">{err}</div>}

      {step === 'preview' ? (
        <div className="card shadow-sm">
          <div className="card-body">
            <h6>Check your details</h6>

            <dl className="mb-3">
              <dt>Name</dt>
              <dd>{info.name || info.email}</dd>

              <dt>Date</dt>
              <dd>{fmtDate(f.date)}</dd>

              <dt>Reason</dt>
              <dd>{f.reason}</dd>

              <dt>Members ({names.length})</dt>
              <dd>{names.join(', ')}</dd>

              <dt>Proofs ({files.length})</dt>
              <dd>{files.map(file => file.name).join(', ')}</dd>

              <dt>Paid By</dt>
              <dd>{f.paidBy}</dd>

              <dt>Amount</dt>
              <dd>₹{f.amount}</dd>
            </dl>

            <div className="d-grid gap-2">
              <button
                className="btn btn-success btn-lg"
                disabled={busy}
                onClick={submit}
              >
                {busy ? 'Submitting…' : 'Confirm and submit'}
              </button>

              <button
                className="btn btn-outline-secondary"
                disabled={busy}
                onClick={() => setStep('edit')}
              >
                Edit details
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={review} className="card shadow-sm">
          <div className="card-body">
            {info.bills?.length > 0 && (
              <button
                type="button"
                className="btn btn-link p-0 mb-3"
                onClick={() => setView('mybills')}
              >
                ← Back to My Bills
              </button>
            )}

            <label className="form-label fw-semibold">
              Select Your Name *
            </label>

            <div className="input-group input-group-lg mb-1">
              <span className="input-group-text bg-white">
                <FiLock />
              </span>

              <input
                className="form-control"
                value={info.name || info.email}
                disabled
                readOnly
                aria-readonly="true"
              />
            </div>

            <div className="small text-muted mb-3">
              Identified by your secure link. This cannot be changed.
            </div>

            <label className="form-label fw-semibold">Date *</label>

            <input
              type="date"
              required
              className="form-control form-control-lg mb-3"
              value={f.date}
              onChange={set('date')}
            />

            <label className="form-label fw-semibold">Reason *</label>

            <input
              required
              className="form-control form-control-lg mb-3"
              placeholder="Cab, Food, Bus ticket…"
              value={f.reason}
              onChange={set('reason')}
            />

            <label className="form-label fw-semibold">Members *</label>

            {useRefs ? (
              <div className="mb-3">
                <EmployeeMultiSelect
                  options={info.memberOptions.map(o => ({
                    key: o.id,
                    name: o.name,
                    employeeId: o.id
                  }))}
                  value={picked}
                  onChange={setPicked}
                  placeholder="Select members"
                />

                <div className="small text-muted mt-1">
                  Remove anyone who was not part of this expense.
                  Total Members: {names.length}
                </div>
              </div>
            ) : (
              <>
                {members.map((m, i) => (
                  <div className="input-group input-group-lg mb-2" key={i}>
                    <input
                      className="form-control"
                      placeholder={`Member ${i + 1}`}
                      value={m}
                      onChange={e =>
                        setMembers(prev =>
                          prev.map((x, j) =>
                            j === i ? e.target.value : x
                          )
                        )
                      }
                    />

                    {members.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() =>
                          setMembers(prev =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-link p-0 mb-1"
                  onClick={() => setMembers(prev => [...prev, ''])}
                >
                  <FiPlus /> Add Member
                </button>

                <div className="small text-muted mb-3">
                  Total Members: {names.length}
                </div>
              </>
            )}

            <label className="form-label fw-semibold">Proof *</label>

            <div className="mb-3">
              <ProofUploads files={files} onChange={setFiles} />
            </div>

            <label className="form-label fw-semibold">Paid By *</label>

            <input
              required
              className="form-control form-control-lg mb-3"
              value={f.paidBy}
              onChange={set('paidBy')}
            />

            <label className="form-label fw-semibold">Amount *</label>

            <div className="input-group input-group-lg mb-4">
              <span className="input-group-text">₹</span>

              <input
                required
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                className="form-control"
                value={f.amount}
                onChange={set('amount')}
              />
            </div>

            <div className="d-grid">
              <button className="btn btn-primary btn-lg">
                Review expense
              </button>
            </div>
          </div>
        </form>
      )}
    </Shell>
  );
}

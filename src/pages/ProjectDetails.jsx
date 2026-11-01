import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiInfo } from 'react-icons/fi';
import { FiPlus, FiMail, FiDownload, FiUsers, FiX, FiLock, FiUnlock, FiCopy } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api, { errMsg, blobError, fmtDate, fmtEnd, inr, openFile } from '../services/api';
import SubjectTags from '../components/SubjectTags.jsx';
import FormBuilder from '../components/FormBuilder.jsx';
import EmployeeList, { badge } from '../components/EmployeeList.jsx';
import ExpenseTable, { STATUS_LABEL, StatusBadge } from '../components/ExpenseTable.jsx';
import ActivityLog from '../components/ActivityLog.jsx';
import RejectModal from '../components/RejectModal.jsx';
import ExpenseFilters from '../components/ExpenseFilters.jsx';
import EditBillModal from '../components/EditBillModal.jsx';
import CompanyBillModal from '../components/CompanyBillModal.jsx';
import EmployeeMultiSelect from '../components/EmployeeMultiSelect.jsx';
import CompanyBills from '../components/CompanyBills.jsx';

const EMPTY = { emp: '', from: '', to: '', reason: '', min: '', max: '', status: '' };

export default function ProjectDetails() {
  const { id } = useParams();

  // All hooks stay here at the top, before any early return
  const [d, setD] = useState(null), [msg, setMsg] = useState(null);
  const [showPreview, setShowPreview] = useState(false), [selId, setSelId] = useState(null), [f, setF] = useState(EMPTY);
  const [edit, setEdit] = useState(null), [cb, setCb] = useState(null), [rej, setRej] = useState(null), [picked, setPicked] = useState([]);

  const load = () => api.get(`/projects/${id}`).then(r => setD(r.data)).catch(e => setMsg({ t: 'danger', m: errMsg(e) }));
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [id]);

  const run = async (fn, ok) => {
    setMsg(null);
    try { const r = await fn(); setMsg({ t: 'success', m: ok ? ok(r) : 'Done' }); load(); }
    catch (e) { setMsg({ t: 'danger', m: await blobError(e) }); }
  };

  if (!d) return msg ? <div className={`alert alert-${msg.t}`}>{msg.m}</div> : <p>Loading…</p>;

  const { project: p, stats: s, fill } = d, sel = d.employees.find(e => e._id === selId), locked = !!p.locked;

  const shown = d.expenses.filter(e => (!f.emp || e.employeeEmail === f.emp) && (!f.status || (e.status || 'SUBMITTED') === f.status)
    && (!f.from || e.date.slice(0, 10) >= f.from) && (!f.to || e.date.slice(0, 10) <= f.to)
    && (!f.reason || e.reason.toLowerCase().includes(f.reason.toLowerCase())) && (f.min === '' || e.amount >= +f.min) && (f.max === '' || e.amount <= +f.max));

  const daysLeft = fill.closesAt ? Math.ceil((new Date(fill.closesAt) - Date.now()) / 864e5) : null;

  const addSelected = () => run(() => api.post(`/projects/${id}/employees/bulk`, { employeeIds: picked.map(x => x.employeeId) }).then(r => { setPicked([]); return r; }),
    r => `${r.data.added} employee(s) added${r.data.skipped ? `, ${r.data.skipped} already in the project` : ''}`);
  const inProject = it => d.employees.some(e => (e.employeeId && e.employeeId === it.employeeId) || e.email === it.email);

  const del = x => window.confirm(`Delete Bill No. ${x.billNo}? Other bill numbers will not change.`)
    && run(() => api.delete(`/projects/${id}/expenses/${x._id}`), () => `Bill ${x.billNo} deleted`);

  const toggleLock = () => (locked || window.confirm('Lock this project? Employees can no longer submit, and you cannot edit or delete bills, add employees or change the form until you unlock it. Excel and proof downloads stay available.'))
    && run(() => api.post(`/projects/${id}/${locked ? 'unlock' : 'lock'}`), () => locked ? 'Project unlocked' : 'Project locked');

  const setStatus = (x, status) => status === 'REJECTED' ? setRej(x)
    : run(() => api.put(`/projects/${id}/expenses/${x._id}/status`, { status }), () => `Bill #${x.billNo}: ${STATUS_LABEL[status]}`);

  const actions = locked ? {} : { onEdit: setEdit, onDelete: del, onStatus: setStatus };

  const delCompany = x => window.confirm(`Delete company bill ${x.billLabel} (${inr(x.amount)})?`)
    && run(() => api.delete(`/projects/${id}/company-bills/${x._id}`), () => 'Company bill deleted');

  // Common link for the whole project, created by the server (shown when the page first loads)
  const formLink = d.shareUrl;

  const copyFormLink = async () => {
    setMsg(null);
    try {
      await navigator.clipboard.writeText(formLink);
      setMsg({ t: 'success', m: 'Form link copied successfully!' });
    } catch {
      let input;
      try {
        input = document.createElement('textarea');
        input.value = formLink;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        setMsg(copied
          ? { t: 'success', m: 'Form link copied successfully!' }
          : { t: 'danger', m: 'Unable to copy the form link. Please copy it manually.' });
      } catch {
        setMsg({ t: 'danger', m: 'Unable to copy the form link. Please copy it manually.' });
      } finally {
        if (input?.parentNode) input.parentNode.removeChild(input);
      }
    }
  };


 
const openWhatsApp = () => {
  const message = [
    `*Project: ${p.collegeName}*`,
    `*PROJECT EXPENSES & BILLS PORTAL*`,
    ``,
    `👋 Hello Team!`,
    ``,
    `Please submit your project-related expenses and bills using the link below.`,
    ``,
    `*PROJECT DETAILS*`,
  
    `> Start Date: ${fmtDate(p.startDate)}`,
    `> End Date: ${fmtEnd(p.endDate)}`,
    `> Submission Deadline: ${
      p.formEndDate ? fmtDate(p.formEndDate) : 'Not set'
    }`,
    ``,
    `*SUBMISSION LINK*`,
    formLink,
    ``,
    `*HOW TO SUBMIT*`,
    `> Open link → Select name → Enter ID & email → Upload bills.`,
    ``,
    `⚠️ *IMPORTANT:* Submit before deadline with clear proofs. No bills? Select No Bill.`,
    ``,
    `🙏 Thank you for your cooperation!`,
  ].join('\n');

  window.open(
    `whatsapp://send?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer'
  );
};


  return (<>
    <div className="card shadow-sm mb-3"><div className="card-body">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <h5 className="mb-1">{p.collegeName} {locked && <span className="badge bg-dark ms-1"><FiLock /> Locked</span>}</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-sm text-white" style={{ background: '#dc2626' }} disabled={locked} onClick={() => setCb({})}
            title={locked ? 'Unlock the project to add company bills' : 'Add a company bill'}><FiPlus /> Company Bills</button>
          <button className={`btn btn-sm ${locked ? 'btn-outline-secondary' : 'btn-outline-danger'}`} onClick={toggleLock}>
            {locked ? <><FiUnlock /> Unlock Project</> : <><FiLock /> Lock Project</>}</button>
        </div>
      </div>

      <div className="row small text-muted"><div className="col-sm-4">Start Date: {fmtDate(p.startDate)}</div><div className="col-sm-4"></div>End Date: {fmtEnd(p.endDate)}<div className="col-sm-4">Subjects: <SubjectTags project={p} /></div></div>

      {p.formCreated && p.formEndDate && <div className="small mt-2">Form Submission Last Date: <strong>{fmtDate(p.formEndDate)}</strong>{' '}
        {fill.expired ? <span className="badge bg-danger">Submissions closed</span>
          : <span className={`badge ${daysLeft <= 2 ? 'bg-warning text-dark' : 'bg-light text-dark border'}`}>{daysLeft} day{daysLeft === 1 ? '' : 's'} left</span>}</div>}

      {p.proofCleanupDate && <div className="small text-muted mt-1">{p.proofCleanupCompleted
        ? `Proof files were automatically removed on ${fmtDate(p.proofCleanupCompletedAt)}. Bill data and the final proof document are kept.`
        : `Proof files will be automatically removed on ${fmtDate(p.proofCleanupDate)} (7 days after the form last date). Bill data and the final proof document are kept.`}</div>}

      {locked && <div className="small text-muted mt-1">This project is locked: employees cannot submit and nothing can be changed, so the Excel and proof document stay final. Select Unlock Project to make changes.</div>}

      {!locked && fill.expired && <div className="small text-muted mt-1">The last date has passed, so employees can no longer submit. You can still view everything and download Excel and proofs. To accept bills again, extend the last date in the Expense Form.</div>}
    </div></div>

    {msg && <div className={`alert alert-${msg.t} py-2`}>{msg.m}</div>}

    <fieldset disabled={locked} className="border-0 p-0 m-0">
      <FormBuilder key={`${p.formCreated}-${p.formEndDate}`} saved={p.formCreated} initialRefs={p.formMemberRefs || []}
        legacyNames={p.formMemberRefs?.length ? [] : p.formMembers || []} initialEnd={p.formEndDate?.slice(0, 10)}
        onSave={(body, endDate) => run(() => api.put(`/projects/${id}/form`, { ...body, endDate }), () => 'Expense form saved')} />
    </fieldset>

    <div className="card shadow-sm mb-3"><div className="card-body">
      <h6>Add Employees</h6>
      {!p.formCreated && <div className="alert alert-warning py-2 small">Create the expense form above before adding employees.</div>}

      <div className="mb-3">
        <EmployeeMultiSelect value={picked} onChange={setPicked} disabled={!p.formCreated || locked}
          isDisabled={it => inProject(it) && 'Already added'} placeholder="Search employees by name, ID or email" />
        <button className="btn btn-outline-primary mt-2" disabled={!picked.length || !p.formCreated || locked} onClick={addSelected}><FiPlus /> Add selected ({picked.length})</button>
        <span className="small text-muted ms-2">Nothing is emailed until you press Send Mail.</span>
      </div>

      <EmployeeList employees={d.employees} locked={locked} remindOpen={fill.remindOpen}
        onRemove={eid => run(() => api.delete(`/projects/${id}/employees/${eid}`), () => 'Employee removed')}
        onRemind={e => run(() => api.post(`/projects/${id}/employees/${e._id}/remind`), () => `Reminder sent to ${e.name || e.email}`)} />

      <div className="d-flex flex-wrap align-items-center gap-2">
  <button
    type="button"
    className="btn btn-primary d-inline-flex align-items-center gap-2"
    disabled={!s.pending || !p.formCreated || fill.expired || locked}
    onClick={() =>
      run(
        () => api.post(`/projects/${id}/send`),
        r =>
          `Form sent to ${r.data.sent} employee(s)${
            r.data.failed ? `, ${r.data.failed} failed` : ''
          }`
      )
    }
  >
    <FiMail size={16} />
    <span>Send Mail</span>
  </button>

  <button
    type="button"
    className="btn btn-success d-inline-flex align-items-center gap-2"
    disabled={!p.formCreated || !formLink}
    onClick={openWhatsApp}
    title="Open WhatsApp with project details and the form link"
  >
    <FaWhatsapp size={16} />
    <span>WhatsApp</span>
  </button>

  <button
    type="button"
    className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
    disabled={!p.formCreated || !formLink}
    onClick={copyFormLink}
    title="Copy the employee expense form link"
  >
    <FiCopy size={16} />
    <span>Copy Form Link</span>
  </button>

  {/* Information tooltip */}
  <span
    className="d-inline-flex align-items-center justify-content-center rounded-circle text-secondary"
    title="Send Mail emails each employee their personal link, only to employees who have not responded. WhatsApp and Copy Form Link share one common link where employees select their name and confirm their Employee ID and registered email. The reminder button unlocks 2 days before the last date."
    style={{
      width: '28px',
      height: '28px',
      border: '1px solid #ced4da',
      backgroundColor: '#f8f9fa',
      cursor: 'help',
      flexShrink: 0
    }}
    aria-label="Information about employee form links"
    role="img"
  >
    <FiInfo size={16} />
  </span>
</div>
    </div></div>

     <div className="card shadow-sm mb-3 border-0" style={{ borderRadius: '14px' }}>
  <div className="card-body p-3">
    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
      <h6 className="mb-0 fw-semibold">Submitted Expenses</h6>

      <button
        className="btn btn-outline-primary btn-sm"
        onClick={() => setShowPreview(!showPreview)}
      >
        <FiUsers /> {showPreview ? 'Hide' : 'View'} Employee Submissions
      </button>
    </div>

    {(() => {
      const cards = [
        { label: 'Total Employees', value: s.employees, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
        { label: 'Submitted Employees', value: s.submitted, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
        { label: 'No Bill', value: s.noBill, bg: '#f5f3ff', border: '#ddd6fe', color: '#6d28d9' },
        { label: 'Pending', value: s.pending, bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
        { label: 'Total Bills Submitted', value: s.totalBills, bg: '#ecfeff', border: '#a5f3fc', color: '#0e7490' },
        { label: 'Employee Bills Total', value: inr(s.totalAmount), bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
        { label: 'Company Bills Total', value: inr(s.companyTotal), bg: '#fff1f2', border: '#fecdd3', color: '#be123c' },
        { label: 'Grand Total', value: inr(s.grandTotal), bg: '#f5f3ff', border: '#c4b5fd', color: '#5b21b6' },
      ];

      return (
        <div className="row g-3">
          {cards.map((card) => (
            <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={card.label}>
              <div
                className="h-100 p-3"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  borderRadius: '12px',
                  transition: 'transform 0.2s ease',
                }}
              >
                <div className="small mb-2" style={{ color: card.color }}>
                  {card.label}
                </div>
                <div
                  className="fs-5 fw-bold text-break"
                  style={{ color: card.color, lineHeight: 1.3 }}
                >
                  {card.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    })()}

    <div className="d-flex flex-wrap gap-3 mt-3 small align-items-center">
      <span className="text-muted">Bill review:</span>

      {[
        ['SUBMITTED', s.review.submitted],
        ['UNDER_REVIEW', s.review.underReview],
        ['APPROVED', s.review.approved],
        ['REJECTED', s.review.rejected],
        ['REIMBURSED', s.review.reimbursed],
      ].map(([key, value]) => (
        <span key={key}>
          <StatusBadge s={key} /> {value}
        </span>
      ))}

      {s.review.approved > 0 && (
        <span className="text-muted">
          · Awaiting reimbursement:{' '}
          <strong className="text-dark">{inr(s.review.approvedAmount)}</strong>
        </span>
      )}
    </div>

    {s.review.rejected > 0 && (
      <div className="small text-muted mt-2">
        Rejected bills ({inr(s.review.rejectedAmount)}) are shown in the list
        but not counted in totals, Excel or the proof document.
      </div>
    )}

    {showPreview && (
      <div className="mt-3">
        <EmployeeList
          employees={d.employees}
          onSelect={setSelId}
          selectedId={selId}
        />

        {sel && (
          <div className="border rounded-3 p-3 mt-2 bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h6>
                Employee: {sel.name ? `${sel.name} (${sel.email})` : sel.email}
              </h6>
              <button
                className="btn btn-sm"
                onClick={() => setSelId(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="small mb-2">
              Status: <span className={`badge ${badge(sel.status)}`}>{sel.status}</span>
              {' · '}Total Bills: {sel.bills}
              {' · '}Total Amount: {inr(sel.totalAmount)}
            </div>

            {sel.bills ? (
              <ExpenseTable
                expenses={d.expenses.filter(
                  (expense) => expense.employeeEmail === sel.email
                )}
                projectId={id}
                {...actions}
              />
            ) : (
              <p className="text-muted mb-0">
                {sel.status === 'No Bill' ? 'No bill submitted.' : 'No response yet.'}
              </p>
            )}
          </div>
        )}
      </div>
    )}
  </div>
</div>

    <div className="card shadow-sm"><div className="card-body">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-2"><h6 className="mb-0">Employee Bills</h6>
        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" onClick={() => run(() => openFile(`/projects/${id}/excel`, 'expenses.xlsx'), () => 'Excel downloaded')}><FiDownload /> Download Excel</button>
          <button className="btn btn-outline-success btn-sm" onClick={() => run(() => openFile(`/projects/${id}/proofs`, 'expense-proofs.pdf'), () => 'Proof document downloaded')}><FiDownload /> Download Proof Document</button></div></div>
      <ExpenseFilters f={f} setF={setF} employees={d.employees} shown={shown.length} total={d.expenses.length} />
      <ExpenseTable expenses={shown} projectId={id} {...actions} />
    </div></div>

    <CompanyBills bills={d.companyBills} projectId={id} total={s.companyTotal} locked={locked} onEdit={setCb} onDelete={delCompany} />

    {cb && <CompanyBillModal projectId={id} employees={d.employees} bill={cb._id ? cb : null} onClose={() => setCb(null)}
      onSaved={() => { setCb(null); setMsg({ t: 'success', m: 'Company bill saved' }); load(); }} />}

    <ActivityLog projectId={id} version={d} />

    {rej && <RejectModal bill={rej} onClose={() => setRej(null)}
      onConfirm={reason => { const b = rej; setRej(null); run(() => api.put(`/projects/${id}/expenses/${b._id}/status`, { status: 'REJECTED', reason }), () => `Bill #${b.billNo} rejected`); }} />}

    {edit && <EditBillModal projectId={id} bill={edit} project={p} onClose={() => setEdit(null)}
      onSaved={() => { setEdit(null); setMsg({ t: 'success', m: 'Bill updated' }); load(); }} />}
  </>);
}
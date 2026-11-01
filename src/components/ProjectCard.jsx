
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiLock,
  FiClock
} from 'react-icons/fi';

import { fmtDate, fmtEnd, inr } from '../services/api';
import SubjectTags from './SubjectTags.jsx';

const DAY = 864e5;
const OFFSET_MIN = 330;

// Employees can submit until the end of the form submission deadline date.
const deadlineInfo = p => {
  if (!p.formCreated || !p.formEndDate) {
    return {
      text: 'Form not created yet',
      cls: 'bg-light text-muted border'
    };
  }

  const closesAt =
    new Date(p.formEndDate).getTime() +
    DAY -
    OFFSET_MIN * 60000;

  const left = closesAt - Date.now();

  if (left <= 0) {
    return {
      text: 'Submissions closed',
      cls: 'bg-danger-subtle text-danger'
    };
  }

  const days = Math.ceil(left / DAY);

  return {
    text: `${days} day${days === 1 ? '' : 's'} left`,
    cls:
      days <= 2
        ? 'bg-warning-subtle text-warning-emphasis'
        : 'bg-success-subtle text-success'
  };
};

export default function ProjectCard({
  p,
  s = {},
  showCollegeName = true
}) {
  const active =
    !p.endDate || new Date(p.endDate) >= new Date();

  const responded =
    (s.submitted || 0) + (s.noBill || 0);

  const total =
    responded + (s.pending || 0);

  const pct = total
    ? Math.round((responded / total) * 100)
    : 0;

  const dl = deadlineInfo(p);

  const title = showCollegeName
    ? p.collegeName
    : (p.subject || `Project · ${fmtDate(p.startDate)}`);

  return (
    <Link
      to={`/projects/${p._id}`}
      className="text-decoration-none d-block h-100"
      aria-label={`View project ${p.subject || p.collegeName}`}
    >
      <div className="card project-card h-100 shadow-sm">
        <div className="card-body p-4">
          {/* Project heading and status */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="text-dark mb-0 pe-2 fs-6">
              {title}
            </h6>

            <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
              <span
                className={`badge rounded-pill ${
                  active
                    ? 'badge-soft-success'
                    : 'badge-soft-secondary'
                }`}
              >
                {active ? 'Active' : 'Completed'}
              </span>

              {p.locked && (
                <span
                  className="badge rounded-pill d-flex align-items-center gap-1"
                  style={{
                    background: '#fff1f2',
                    color: '#e11d48',
                    fontWeight: 500
                  }}
                >
                  <FiLock />
                  Locked
                </span>
              )}
            </div>
          </div>

          {/* Project dates */}
          <div className="text-muted small d-flex align-items-center gap-1">
            <FiCalendar />
            <span>
              {fmtDate(p.startDate)} → {fmtEnd(p.endDate)}
            </span>
          </div>

          {/* Subjects and tags */}
          <div className="mt-1">
            <SubjectTags project={p} max={3} />
          </div>

          {/* Form submission deadline */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 small">
            <span className="text-muted d-flex align-items-center gap-1">
              <FiClock />

              {p.formCreated && p.formEndDate ? (
                <>
                  Form deadline:{' '}
                  <strong className="text-dark">
                    {fmtDate(p.formEndDate)}
                  </strong>
                </>
              ) : (
                'Form deadline'
              )}
            </span>

            <span
              className={`badge rounded-pill fw-medium ${dl.cls}`}
            >
              {dl.text}
            </span>
          </div>

          {/* Project statistics */}
          <div className="row g-2 mt-3 text-center">
            <div className="col-4">
              <div className="mini-stat">
                <div className="fw-semibold text-dark">
                  {total}
                </div>
                <div className="text-muted small">
                  Employees
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="mini-stat">
                <div className="fw-semibold text-dark">
                  {s.bills || 0}
                </div>
                <div className="text-muted small">
                  Bills
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="mini-stat">
                <div className="fw-semibold text-dark">
                  {inr(s.amount)}
                </div>
                <div className="text-muted small">
                  Amount
                </div>
              </div>
            </div>
          </div>

          {/* Employee response progress */}
          <div className="d-flex justify-content-between small text-muted mt-3 mb-1">
            <span>Responses</span>
            <span>{responded}/{total}</span>
          </div>

          <div
            className="progress"
            role="progressbar"
            aria-label="Employee response progress"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 6,
              background: '#f1f5f9'
            }}
          >
            <div
              className="progress-bar bg-success"
              style={{
                width: `${pct}%`,
                opacity: 0.6
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

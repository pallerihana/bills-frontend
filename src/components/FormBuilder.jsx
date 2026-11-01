import { useState } from 'react';
import {
  FiCheckCircle,
  FiCalendar,
  FiFileText,
  FiUsers,
  FiPaperclip,
  FiUserCheck,
  
} from 'react-icons/fi';

import EmployeeMultiSelect from './EmployeeMultiSelect.jsx';

const FIELDS = [
  { name: 'Date', description: 'Employee selects the expense date', Icon: FiCalendar },
  { name: 'Reason', description: 'Short text', Icon: FiFileText },
  {
    name: 'Members',
    description: 'Chosen from the list below (employee can remove those who were not present)',
    Icon: FiUsers,
  },
  { name: 'Proof', description: 'PDF, JPG, JPEG or PNG', Icon: FiPaperclip },
  { name: 'Paid By', description: 'Who paid personally', Icon: FiUserCheck },
  {
  name: 'Amount',
  description: 'Positive number in ₹',
  Icon: () => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        fontSize: 17,
        fontWeight: 590,
        fontFamily: 'Arial, sans-serif',
        color: '#2563eb',
      }}
    >
      ₹ 
    </span>
  ),
},
];

export default function FormBuilder({
  saved,
  initialRefs = [],
  legacyNames = [],
  initialEnd,
  onSave,
}) {
  const [picked, setPicked] = useState(
    initialRefs.map((r) => ({
      key: r.employeeId,
      name: r.name,
      employeeId: r.employeeId,
    }))
  );

  const [end, setEnd] = useState(initialEnd || '');
  const count = picked.length || legacyNames.length;

  const save = () =>
    onSave(
      picked.length
        ? { memberIds: picked.map((x) => x.employeeId) }
        : { members: legacyNames },
      end
    );

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Expense Form</h6>
          {saved && (
            <span className="badge bg-success">
              <FiCheckCircle /> Form created
            </span>
          )}
        </div>

        <p className="small text-muted">
          Employees will fill these fields. All are required.
        </p>

        <ul className="list-group mb-3">
          {FIELDS.map(({ name, description, Icon }) => (
            <li
              key={name}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>
                <Icon
                  className="me-2"
                  size={16}
                  style={{ color: '#2563eb', verticalAlign: '-2px' }}
                />
                {name} <span className="text-danger">*</span>
              </span>
              <span className="small text-muted text-end">
                {description}
              </span>
            </li>
          ))}
        </ul>

        <label className="form-label fw-semibold">
          <FiCalendar className="me-1" size={16} style={{ color: '#2563eb', verticalAlign: '-2px' }} />
           Form Submission Last Date <span className="text-danger">*</span>
        </label>

        <input
          type="date"
          className="form-control mb-1"
          style={{ maxWidth: 240 }}
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />

        <div className="small text-muted mb-3">
          Employees can submit bills until the end of this day. It is separate
          from the college project dates and is shown in the email.
        </div>

        <label className="form-label fw-semibold">
          <FiUsers className="me-1" size={16} />
          Members <span className="text-danger">*</span>
        </label>

        {!picked.length && legacyNames.length > 0 && (
          <div className="alert alert-warning py-2 small">
            Current members (typed earlier):{' '}
            <strong>{legacyNames.join(', ')}</strong>. Pick employees below to
            replace them, or leave empty to keep these.
          </div>
        )}

        <EmployeeMultiSelect
          value={picked}
          onChange={setPicked}
          placeholder="Search employees by name, ID or email"
        />

        <div className="small mt-2 mb-3">
          Total Members: <strong>{count}</strong>
        </div>

        <button
          className="btn btn-primary"
          disabled={!count || !end}
          onClick={save}
        >
          {saved ? 'Update Form' : 'Create Form'}
        </button>
      </div>
    </div>
  );
}
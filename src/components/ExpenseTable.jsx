import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { fmtDate, inr } from '../services/api';
import { Who } from './EmployeeList.jsx';
import ProofLinks from './ProofLinks.jsx';

export const STATUS_LABEL = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REIMBURSED: 'Reimbursed',
};

const TONE = {
  SUBMITTED: 'bg-secondary-subtle text-secondary-emphasis',
  UNDER_REVIEW: 'bg-info-subtle text-info-emphasis',
  APPROVED: 'bg-success-subtle text-success-emphasis',
  REJECTED: 'bg-danger-subtle text-danger-emphasis',
  REIMBURSED: 'bg-primary-subtle text-primary-emphasis',
};

export const StatusBadge = ({ s }) => (
  <span className={`badge rounded-pill fw-medium ${TONE[s || 'SUBMITTED']}`}>
    {STATUS_LABEL[s || 'SUBMITTED']}
  </span>
);

const cellStyle = {
  padding: '12px 10px',
  verticalAlign: 'middle',
};

const nowrapStyle = {
  ...cellStyle,
  whiteSpace: 'nowrap',
};

export default function ExpenseTable({
  expenses = [],
  projectId,
  onEdit,
  onDelete,
  onStatus,
}) {
  if (!expenses.length) {
    return <p className="text-muted mb-0">No expenses to show.</p>;
  }

  return (
    <div className="table-responsive rounded-3 border border-success-subtle">
      <table
        className="table table-hover align-middle mb-0"
        style={{
          minWidth: '1250px',
          fontSize: '14px',
          '--bs-table-bg': '#f0fdf4',
          '--bs-table-color': '#14532d',
          '--bs-table-hover-bg': '#dcfce7',
          '--bs-table-hover-color': '#14532d',
          '--bs-table-border-color': '#bbf7d0',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...nowrapStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                width: '75px',
              }}
            >
              Bill No
            </th>

            <th
              style={{
                ...cellStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                minWidth: '210px',
              }}
            >
              Employee
            </th>

            <th
              style={{
                ...nowrapStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                width: '115px',
              }}
            >
              Date
            </th>

            <th
              style={{
                ...cellStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                minWidth: '200px',
              }}
            >
              Reason
            </th>

            <th
              className="text-end"
              style={{
                ...nowrapStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                width: '90px',
              }}
            >
              Members
            </th>

            <th
              style={{
                ...cellStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                minWidth: '120px',
              }}
            >
              Paid By
            </th>

            <th
              className="text-end"
              style={{
                ...nowrapStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                width: '120px',
              }}
            >
              Amount
            </th>

            <th
              style={{
                ...cellStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                minWidth: '150px',
              }}
            >
              Status
            </th>

            <th
              style={{
                ...cellStyle,
                backgroundColor: '#166534',
                color: '#ffffff',
                minWidth: '120px',
              }}
            >
              Proof
            </th>

            {onEdit && (
              <th
                className="text-center"
                style={{
                  ...nowrapStyle,
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  width: '90px',
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {expenses.map((expense) => {
            const status = expense.status || 'SUBMITTED';

            return (
              <tr
                key={expense._id}
                style={{
                  opacity: status === 'REJECTED' ? 0.75 : 1,
                }}
              >
                <td style={nowrapStyle}>{expense.billNo}</td>

                <td style={{ ...cellStyle, minWidth: '210px' }}>
                  <Who
                    name={expense.employeeName}
                    email={expense.employeeEmail}
                  />
                </td>

                <td style={nowrapStyle}>{fmtDate(expense.date)}</td>

                <td style={{ ...cellStyle, minWidth: '200px' }}>
                  <div
                    style={{
                      overflowWrap: 'anywhere',
                      lineHeight: 1.5,
                    }}
                  >
                    {expense.reason}
                  </div>
                </td>

                <td className="text-end" style={nowrapStyle}>
                  {expense.totalMembers}
                </td>

                <td style={{ ...cellStyle, minWidth: '120px' }}>
                  <div style={{ overflowWrap: 'anywhere' }}>
                    {expense.paidBy}
                  </div>
                </td>

                <td
                  className="text-end"
                  style={{
                    ...nowrapStyle,
                    fontWeight: 600,
                  }}
                >
                  {inr(expense.amount)}
                </td>

                <td style={{ ...cellStyle, minWidth: '150px' }}>
                  {onStatus ? (
                    <select
                      className="form-select form-select-sm"
                      value={status}
                      onChange={(event) =>
                        onStatus(expense, event.target.value)
                      }
                    >
                      {Object.entries(STATUS_LABEL).map(([key, label]) => (
                        <option
                          key={key}
                          value={key}
                          disabled={
                            key === 'REIMBURSED' && status !== 'APPROVED'
                          }
                        >
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge s={status} />
                  )}

                  {status === 'REJECTED' && expense.rejectionReason && (
                    <div
                      className="text-danger mt-1"
                      style={{
                        fontSize: '11px',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      Reason: {expense.rejectionReason}
                    </div>
                  )}
                </td>

                <td style={{ ...cellStyle, minWidth: '120px' }}>
                  <ProofLinks bill={expense} projectId={projectId} />
                </td>

                {onEdit && (
                  <td className="text-center text-nowrap" style={cellStyle}>
                    <button
                      type="button"
                      className="btn btn-sm text-primary"
                      title="Edit bill"
                      onClick={() => onEdit(expense)}
                    >
                      <FiEdit2 />
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm text-danger"
                      title="Delete bill"
                      onClick={() => onDelete(expense)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
import { FiEdit2, FiTrash2, FiLock } from 'react-icons/fi';
import { fmtDate, inr } from '../services/api';
import ProofLinks from './ProofLinks.jsx';

const RED = '#b91c1c';

const cellStyle = {
  padding: '12px 10px',
  verticalAlign: 'middle',
};

const nowrapStyle = {
  ...cellStyle,
  whiteSpace: 'nowrap',
};

export default function CompanyBills({
  bills = [],
  projectId,
  total,
  locked,
  onEdit,
  onDelete,
}) {
  return (
    <div className="card shadow-sm mt-3" style={{ borderColor: '#fecaca' }}>
      <div
        className="card-body"
        style={{
          backgroundColor: '#fffafa',
          borderRadius: '8px',
        }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <h6 className="mb-0" style={{ color: RED }}>
            Company Bills
            {locked && (
              <FiLock
                className="ms-1"
                title="Project is locked"
              />
            )}
          </h6>

          <span
            className="badge"
            style={{ backgroundColor: '#fee2e2', color: RED }}
          >
            {bills.length} bill{bills.length === 1 ? '' : 's'} · Total{' '}
            {inr(total)}
          </span>
        </div>

        {!bills.length ? (
          <p className="text-muted mb-0">
            No company bills yet. Use the Company Bills button at the top to add one.
          </p>
        ) : (
          <div className="table-responsive rounded-3 border border-danger-subtle">
            <table
              className="table table-hover align-middle mb-0"
              style={{
                minWidth: '1050px',
                fontSize: '14px',
                '--bs-table-bg': '#fff5f5',
                '--bs-table-color': '#7f1d1d',
                '--bs-table-hover-bg': '#fee2e2',
                '--bs-table-hover-color': '#7f1d1d',
                '--bs-table-border-color': '#fecaca',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      ...nowrapStyle,
                      backgroundColor: '#991b1b',
                      color: '#ffffff',
                      width: '130px',
                    }}
                  >
                    Bill
                  </th>

                  <th
                    style={{
                      ...nowrapStyle,
                      backgroundColor: '#991b1b',
                      color: '#ffffff',
                      width: '115px',
                    }}
                  >
                    Date
                  </th>

                  <th
                    style={{
                      ...cellStyle,
                      backgroundColor: '#991b1b',
                      color: '#ffffff',
                      minWidth: '180px',
                    }}
                  >
                    Reason
                  </th>

                  <th
                    style={{
                      ...cellStyle,
                      backgroundColor: '#991b1b',
                      color: '#ffffff',
                      minWidth: '180px',
                    }}
                  >
                    Members
                  </th>

                  <th
                    style={{
                      ...cellStyle,
                      backgroundColor: '#991b1b',
                      color: '#ffffff',
                      minWidth: '110px',
                    }}
                  >
                    Paid By
                  </th>

                  <th
                    className="text-end"
                    style={{
                      ...nowrapStyle,
                      backgroundColor: '#991b1b',
                      color: '#ffffff',
                      width: '130px',
                    }}
                  >
                    Amount
                  </th>

                  <th
                    style={{
                      ...cellStyle,
                      backgroundColor: '#991b1b',
                      color: '#ffffff',
                      minWidth: '130px',
                    }}
                  >
                    Proof
                  </th>

                  {!locked && (
                    <th
                      className="text-center"
                      style={{
                        ...nowrapStyle,
                        backgroundColor: '#991b1b',
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
                {bills.map((bill) => {
                  const memberCount = Number(bill.totalMembers) || 0;
                  const perMemberAmount = memberCount
                    ? bill.amount / memberCount
                    : bill.amount;

                  return (
                    <tr
                      key={bill._id}
                      style={{
                        borderLeft: '4px solid #dc2626',
                      }}
                    >
                      <td style={cellStyle}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          COMPANY BILL
                        </span>

                        <div
                          className="fw-semibold mt-1"
                          style={{
                            color: RED,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {bill.billLabel}
                        </div>
                      </td>

                      <td style={nowrapStyle}>
                        {fmtDate(bill.date)}
                      </td>

                      <td style={{ ...cellStyle, minWidth: '180px' }}>
                        <div
                          style={{
                            overflowWrap: 'anywhere',
                            lineHeight: 1.5,
                          }}
                        >
                          {bill.reason}
                        </div>
                      </td>

                      <td style={{ ...cellStyle, minWidth: '180px' }}>
                        <div className="fw-medium">
                          {memberCount} employee
                          {memberCount === 1 ? '' : 's'}
                        </div>

                        <div
                          className="mt-1"
                          style={{
                            color: '#991b1b',
                            fontSize: '12px',
                            lineHeight: 1.5,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {(bill.members || []).join(', ')}
                        </div>
                      </td>

                      <td style={{ ...cellStyle, minWidth: '110px' }}>
                        <div style={{ overflowWrap: 'anywhere' }}>
                          {bill.paidBy}
                        </div>
                      </td>

                      <td
                        className="text-end"
                        style={{
                          ...nowrapStyle,
                          color: RED,
                          fontWeight: 600,
                        }}
                      >
                        {inr(bill.amount)}

                        <div
                          className="mt-1"
                          style={{
                            color: '#991b1b',
                            fontSize: '11px',
                            fontWeight: 400,
                          }}
                        >
                          ≈ {inr(perMemberAmount)} each
                        </div>
                      </td>

                      <td style={{ ...cellStyle, minWidth: '130px' }}>
                        <ProofLinks bill={bill} projectId={projectId} />
                      </td>

                      {!locked && (
                        <td
                          className="text-center text-nowrap"
                          style={cellStyle}
                        >
                          <button
                            type="button"
                            className="btn btn-sm text-primary"
                            title="Edit bill"
                            onClick={() => onEdit(bill)}
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm text-danger"
                            title="Delete bill"
                            onClick={() => onDelete(bill)}
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
        )}
      </div>
    </div>
  );
}
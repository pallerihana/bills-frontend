import { useState } from 'react';
import { FiPaperclip } from 'react-icons/fi';
import { proofList } from '../services/api';
import ProofViewerModal from './ProofViewerModal.jsx';

export default function ExistingProofs({
  bill,
  projectId,
  removed,
  setRemoved,
}) {
  const proofs = proofList(bill);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openProof = (index) => {
    setSelectedIndex(index);
    setShowViewer(true);
  };

  const toggleRemove = (proofId) => {
    setRemoved((previous) => {
      const next = new Set(previous);

      if (next.has(proofId)) {
        next.delete(proofId);
      } else {
        next.add(proofId);
      }

      return next;
    });
  };

  return (
    <>
      <div className="d-flex flex-column gap-2">
        {proofs.map((proof, index) => {
          const isRemoved = proof.deleted || removed.has(proof.id);

          return (
            <div
              key={proof.id}
              className="d-flex align-items-center justify-content-between gap-2 border rounded p-2"
            >
              <span className={`text-break ${isRemoved ? 'text-muted text-decoration-line-through' : ''}`}>
                <FiPaperclip className="me-1" />
                Proof File {index + 1}: {proof.name || 'Expense proof'}
              </span>

              <div className="d-flex gap-3 flex-shrink-0">
                {!isRemoved && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0"
                    onClick={() => openProof(index)}
                  >
                    View
                  </button>
                )}

                {!proof.deleted && (
                  <button
                    type="button"
                    className={`btn btn-link btn-sm p-0 ${
                      removed.has(proof.id) ? 'text-success' : 'text-danger'
                    }`}
                    onClick={() => toggleRemove(proof.id)}
                  >
                    {removed.has(proof.id) ? 'Undo' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {!proofs.length && (
          <div className="text-muted small">No existing proof files.</div>
        )}
      </div>

      <ProofViewerModal
        show={showViewer}
        onHide={() => setShowViewer(false)}
        bill={bill}
        projectId={projectId}
        proofs={proofs.filter((proof) => !removed.has(proof.id))}
        initialIndex={selectedIndex}
      />
    </>
  );
}
import { useState } from 'react';
import { FiPaperclip } from 'react-icons/fi';
import ProofViewerModal from './ProofViewerModal.jsx';
import { proofList } from '../services/api';

export default function ProofLinks({ bill, projectId }) {
  const proofs = proofList(bill);
  const [show, setShow] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!proofs.length) {
    return <span className="text-muted small">-</span>;
  }

  const openProof = (index) => {
    setSelectedIndex(index);
    setShow(true);
  };

  return (
    <>
      <span className="d-inline-flex flex-wrap gap-2">
        {proofs.map((proof, index) => (
          <button
            key={proof.id || index}
            type="button"
            className={`btn btn-link btn-sm p-0 ${
              proof.deleted ? 'text-muted' : ''
            }`}
            title={proof.deleted ? 'Proof file removed' : proof.name}
            disabled={proof.deleted}
            onClick={() => openProof(index)}
          >
            <FiPaperclip />
            {' '}
            {proof.deleted
              ? 'Removed'
              : proofs.length > 1
                ? `Proof ${index + 1}`
                : 'View'}
          </button>
        ))}
      </span>

      <ProofViewerModal
        show={show}
        onHide={() => setShow(false)}
        bill={bill}
        projectId={projectId}
        proofs={proofs}
        initialIndex={selectedIndex}
      />
    </>
  );
}
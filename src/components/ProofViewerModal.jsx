import { useEffect, useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import {
  FiExternalLink,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { viewProof } from '../services/api';

export default function ProofViewerModal({
  show,
  onHide,
  bill,
  projectId,
  proofs,
  initialIndex = 0,
}) {
  const [index, setIndex] = useState(initialIndex);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setIndex(initialIndex);
    }
  }, [show, initialIndex]);

  useEffect(() => {
    if (!show || !bill || !proofs?.length) {
      setPreviewUrl('');
      setLoading(false);
      setError('');
      return undefined;
    }

    let cancelled = false;
    let objectUrl = '';

    const loadProof = async () => {
      setLoading(true);
      setError('');
      setPreviewUrl('');

      try {
        const result = await viewProof(projectId, bill._id, index);

        if (cancelled) return;

        if (!(result instanceof Blob)) {
          throw new Error('Invalid proof response.');
        }

        objectUrl = URL.createObjectURL(result);
        setPreviewUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load the proof.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProof();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [show, bill?._id, projectId, index, proofs]);

  const currentProof = proofs?.[index];
  const filename = currentProof?.name || `Proof ${index + 1}`;
  const mime =
    currentProof?.mime ||
    currentProof?.mimeType ||
    currentProof?.type ||
    '';

  const isPdf =
    mime === 'application/pdf' || /\.pdf$/i.test(filename);

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const downloadProof = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="xl"
      fullscreen="md-down"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">
          Expense Proof — Bill No: {bill?.billNo ?? '-'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="text-break">
            <strong>{filename}</strong>
            <div className="text-muted small">
              Proof {index + 1} of {proofs?.length || 0}
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0 || loading}
            >
              <FiChevronLeft /> Previous
            </Button>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() =>
                setIndex((i) => Math.min((proofs?.length || 1) - 1, i + 1))
              }
              disabled={index >= (proofs?.length || 1) - 1 || loading}
            >
              Next <FiChevronRight />
            </Button>
          </div>
        </div>

        <div
          className="d-flex align-items-center justify-content-center border rounded bg-light"
          style={{
            minHeight: '55vh',
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" />
              <div className="mt-2 text-muted">Loading proof...</div>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              {error}
            </Alert>
          ) : previewUrl ? (
            isPdf ? (
              <iframe
                key={previewUrl}
                src={previewUrl}
                title={filename}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: 0,
                }}
              />
            ) : (
              <img
                src={previewUrl}
                alt={filename}
                className="img-fluid"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            )
          ) : (
            <div className="text-muted">No proof selected.</div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="outline-primary"
          onClick={openInNewTab}
          disabled={!previewUrl}
        >
          <FiExternalLink /> Open in New Tab
        </Button>

        <Button
          variant="primary"
          onClick={downloadProof}
          disabled={!previewUrl}
        >
          <FiDownload /> Download
        </Button>

        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
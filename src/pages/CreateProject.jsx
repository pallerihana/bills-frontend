
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import TagInput from '../components/TagInput.jsx';

export default function CreateProject() {
  const nav = useNavigate();
  const location = useLocation();

  // Read the college name passed from the dashboard.
  const params = new URLSearchParams(location.search);
  const collegeFromDashboard = params.get('college') || '';

  const [f, setF] = useState({
    collegeName: collegeFromDashboard,
    startDate: '',
    endDate: ''
  });

  const [tags, setTags] = useState([]);
  const [unknownEnd, setUnknownEnd] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Update the college name if the URL query parameter changes.
  useEffect(() => {
    setF(prev => ({
      ...prev,
      collegeName: collegeFromDashboard || prev.collegeName
    }));
  }, [collegeFromDashboard]);

  const set = key => e => {
    setF(prev => ({
      ...prev,
      [key]: e.target.value
    }));
  };

  const toggleUnknown = e => {
    const checked = e.target.checked;

    setUnknownEnd(checked);

    if (checked) {
      setF(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  };

  const submit = async e => {
    e.preventDefault();
    setErr('');

    const collegeName = f.collegeName.trim();

    if (!collegeName) {
      setErr('Enter the college name.');
      return;
    }

    if (!f.startDate) {
      setErr('Select the project start date.');
      return;
    }

    if (!unknownEnd) {
      if (!f.endDate) {
        setErr(
          'Select the project end date, or tick "Don\'t know the exact date".'
        );
        return;
      }

      if (f.endDate < f.startDate) {
        setErr('End date cannot be before the start date.');
        return;
      }
    }

    setBusy(true);

    try {
      // Create a NEW project record; do not modify existing projects.
      const { data } = await api.post('/projects', {
        collegeName,
        startDate: f.startDate,
        endDate: unknownEnd ? null : f.endDate,
        tags
      });

      nav(`/projects/${data._id}`);
    } catch (error) {
      setErr(errMsg(error));
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="card shadow-sm p-4"
      style={{ maxWidth: 560 }}
    >
      <h5 className="mb-3">Add Project</h5>

      {err && (
        <div className="alert alert-danger py-2">
          {err}
        </div>
      )}

      <label className="form-label" htmlFor="collegeName">
        College Name *
      </label>

      <input
        id="collegeName"
        className="form-control mb-3"
        required
        value={f.collegeName}
        onChange={set('collegeName')}
        placeholder="Enter College Name"
        readOnly={!!collegeFromDashboard}
      />

      {collegeFromDashboard && (
        <div className="small text-muted mb-3">
          This project will be created under the selected college.
        </div>
      )}

      <div className="row">
        <div className="col-sm-6 mb-3">
          <label className="form-label" htmlFor="startDate">
            Project Start Date *
          </label>

          <input
            id="startDate"
            type="date"
            required
            className="form-control"
            value={f.startDate}
            onChange={set('startDate')}
          />
        </div>

        <div className="col-sm-6 mb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <label className="form-label mb-2" htmlFor="endDate">
              Project End Date {!unknownEnd && '*'}
            </label>

            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="unknown-end"
                checked={unknownEnd}
                onChange={toggleUnknown}
              />

              <label
                className="form-check-label small"
                htmlFor="unknown-end"
              >
                Don't know the exact date
              </label>
            </div>
          </div>

          <input
            id="endDate"
            type="date"
            className="form-control"
            required={!unknownEnd}
            disabled={unknownEnd}
            min={f.startDate || undefined}
            value={f.endDate}
            onChange={set('endDate')}
          />

          {unknownEnd && (
            <div className="small text-muted mt-1">
              The end date will show as "To be decided".
            </div>
          )}
        </div>
      </div>

      <label className="form-label">
        Subjects <span className="text-muted fw-normal">(optional)</span>
      </label>

      <div className="mb-3">
        <TagInput value={tags} onChange={setTags} />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={busy}
      >
        {busy ? 'Creating…' : 'Create Project'}
      </button>
    </form>
  );
}

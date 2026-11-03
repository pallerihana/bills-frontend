import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bills-backend-ir36.onrender.com/api',
});

// Attach JWT authentication to API requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !location.pathname.startsWith('/login') &&
      !location.pathname.startsWith('/expense-form')
    ) {
      localStorage.removeItem('token');
      location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Extract a readable API error message
export const errMsg = (error) =>
  error.response?.data?.message ||
  (error.response?.data instanceof Blob
    ? 'Could not complete request'
    : error.message);

// Format date as DD-MM-YYYY
export const fmtDate = (date) =>
  new Date(date).toLocaleDateString('en-GB').replace(/\//g, '-');

// Format amount in Indian Rupees
export const inr = (amount) =>
  '₹' + Number(amount || 0).toLocaleString('en-IN');

// Open or download a file using authenticated API access.
// onProgress (optional) is called as bytes arrive: onProgress({ pct, loaded, total })
//   pct is 0-100, or null when the server did not send Content-Length.
export async function openFile(url, filename, onProgress) {
  const response = await api.get(url, {
    responseType: 'blob',
    onDownloadProgress: (e) => {
      if (!onProgress) return;
      const total = e.total || 0;
      const pct = total ? Math.min(100, Math.round((e.loaded * 100) / total)) : null;
      onProgress({ pct, loaded: e.loaded, total });
    },
  });

  const objectUrl = URL.createObjectURL(response.data);

  if (filename) {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // Release the object URL after the download has started
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } else {
    window.open(objectUrl, '_blank', 'noopener,noreferrer');

    // Keep the URL alive briefly for the browser to load the file
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }
}

// Extract error messages from JSON or Blob responses
export async function blobError(error) {
  try {
    const data = error.response?.data;

    if (data instanceof Blob) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed.message || 'Could not complete request';
    }

    return data?.message || errMsg(error);
  } catch {
    return errMsg(error);
  }
}

// Fetch one proof as a Blob for previewing inside a modal.
// Proof index starts at 0.
export const viewProof = async (projectId, expenseId, index = 0) => {
  try {
    const response = await api.get(
      `/projects/${projectId}/expenses/${expenseId}/proof?i=${index}`,
      { responseType: 'blob' }
    );

    return response.data;
  } catch (error) {
    const message = await blobError(error);

    throw new Error(message);
  }
};

// Return all proofs belonging to a bill.
// Supports new multi-proof records and legacy single-proof records.
export const proofList = (bill) => {
  if (bill.proofs?.length) {
    return bill.proofs.map((proof, index) => ({
      id: String(proof._id || index),
      name: proof.originalName || `Proof ${index + 1}`,
      mime: proof.mime,
      deleted: !!proof.deleted,
    }));
  }

  if (bill.cloudinaryPublicId || bill.proofFile || bill.proofOriginalName) {
    return [
      {
        id: 'legacy',
        name: bill.proofOriginalName || 'Expense proof',
        mime: bill.proofMime,
        deleted: !!bill.proofDeleted,
      },
    ];
  }

  return [];
};

// Default Axios instance for the rest of the application
export default api;

// Format optional project end date
export const fmtEnd = (date) =>
  date ? fmtDate(date) : 'To be decided';

// Format project date range
export const fmtSpan = (startDate, endDate) =>
  endDate
    ? `${fmtDate(startDate)} to ${fmtDate(endDate)}`
    : `From ${fmtDate(startDate)} (end date to be decided)`;

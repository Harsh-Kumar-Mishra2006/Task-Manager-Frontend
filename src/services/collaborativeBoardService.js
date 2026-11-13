// services/collaborativeBoardService.js
import api from '../api/api';

// ── Create ─────────────────────────────────────────────
const createDocument = async ({ title = 'Untitled', content = '' } = {}) => {
  const res = await api.post('/api/docs', { title, content });
  return res.data?.data?.document;
};

// ── List user's documents ──────────────────────────────
const listDocuments = async () => {
  const res = await api.get('/api/docs');
  return res.data?.data?.documents || [];
};

// ── Get one ────────────────────────────────────────────
const getDocument = async (id) => {
  const res = await api.get(`/api/docs/${id}`);
  return res.data?.data?.document;
};

// ── Update (REST fallback) ─────────────────────────────
const updateDocument = async (id, { title, content } = {}) => {
  const res = await api.put(`/api/docs/${id}`, { title, content });
  return res.data?.data?.document;
};

// ── Delete ─────────────────────────────────────────────
const deleteDocument = async (id) => {
  const res = await api.delete(`/api/docs/${id}`);
  return res.data;
};

// ── Download URL (server-side) ─────────────────────────
const getDownloadUrl = (id) =>
  `${import.meta.env.VITE_API_URL}/api/docs/${id}/download`;

/**
 * Trigger a browser download of the doc.
 * Uses Authorization header via fetch (since <a href> won't send the Bearer token).
 * Falls back to client-side blob if `content` is supplied (for unsaved docs).
 */
const downloadDocument = async (id, fallback = null) => {
  try {
    const res = await api.get(`/api/docs/${id}/download`, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, extractFilename(res, fallback?.title));
  } catch {
    // If server fails but we have local content, download that instead
    if (fallback?.content !== undefined) {
      const text = `${fallback.title || 'Untitled'}\n\n${fallback.content}`;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, `${safeName(fallback.title || 'document')}.txt`);
    } else {
      throw new Error('Download failed');
    }
  }
};

// ── Helpers ────────────────────────────────────────────
const safeName = (name) =>
  (name || 'document')
    .replace(/[^\w\s\-]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'document';

const extractFilename = (res, fallbackTitle) => {
  const cd = res.headers?.['content-disposition'] || '';
  const match = cd.match(/filename="?([^"]+)"?/);
  return match?.[1] || `${safeName(fallbackTitle)}.txt`;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export {
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDownloadUrl,
  downloadDocument,
};

export default {
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDownloadUrl,
  downloadDocument,
};
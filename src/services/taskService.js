// services/taskService.js
import api from '../api/api';

// ── Create ─────────────────────────────────────────────
const createTask = async (payload) => {
  // payload: { title, description?, status?, priority?, dueDate?, tags? }
  const res = await api.post('/api/tasks', payload);
  return res.data?.data?.task;
};

// ── List (paginated + filtered) ────────────────────────
/**
 * @param {Object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {'pending'|'in-progress'|'completed'} [params.status]
 * @param {'low'|'medium'|'high'} [params.priority]
 * @param {string} [params.search]
 * @param {'createdAt'|'updatedAt'|'title'|'dueDate'|'priority'} [params.sortBy]
 * @param {'asc'|'desc'} [params.sortOrder]
 */
const getAllTasks = async (params = {}) => {
  const res = await api.get('/api/tasks', { params });
  return res.data?.data || { tasks: [], pagination: null };
};

// ── Get one ────────────────────────────────────────────
const getTaskById = async (id) => {
  const res = await api.get(`/api/tasks/${id}`);
  return res.data?.data?.task;
};

// ── Update ─────────────────────────────────────────────
const updateTask = async (id, updates) => {
  const res = await api.put(`/api/tasks/${id}`, updates);
  return res.data?.data?.task;
};

// ── Delete ─────────────────────────────────────────────
const deleteTask = async (id) => {
  const res = await api.delete(`/api/tasks/${id}`);
  return res.data?.data?.deletedTask;
};

// ── Bulk delete ────────────────────────────────────────
const bulkDeleteTasks = async (ids) => {
  const res = await api.delete('/api/tasks/bulk/delete', {
    data: { ids },
  });
  return res.data?.data; // { deletedCount, requestedCount }
};

// ── Stats ──────────────────────────────────────────────
const getTaskStats = async () => {
  const res = await api.get('/api/tasks/stats');
  return res.data?.data; // { total, byStatus, byPriority, recent }
};

// ── Convenience helpers ────────────────────────────────
const markComplete = (id) => updateTask(id, { status: 'completed' });
const markPending = (id) => updateTask(id, { status: 'pending' });

export {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  bulkDeleteTasks,
  getTaskStats,
  markComplete,
  markPending,
};

export default {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  bulkDeleteTasks,
  getTaskStats,
  markComplete,
  markPending,
};
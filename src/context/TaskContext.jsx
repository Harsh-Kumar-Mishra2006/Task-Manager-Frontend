// context/TaskContext.jsx
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import taskService from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const TaskContext = createContext(null);

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  status: '',
  priority: '',
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function TaskProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Prevent stale responses from overwriting fresh ones
  const fetchIdRef = useRef(0);

  // ── Fetch tasks ─────────────────────────────────────────
  const fetchTasks = useCallback(
    async (overrideFilters = null) => {
      if (!isAuthenticated) return;
      const currentFilters = overrideFilters || filters;
      const fetchId = ++fetchIdRef.current;

      setLoading(true);
      setError(null);
      try {
        const cleanFilters = Object.fromEntries(
          Object.entries(currentFilters).filter(([, v]) => v !== '' && v != null)
        );
        const data = await taskService.getAllTasks(cleanFilters);

        if (fetchId !== fetchIdRef.current) return; // stale
        setTasks(data.tasks || []);
        setPagination(data.pagination || null);
      } catch (err) {
        if (fetchId !== fetchIdRef.current) return;
        setError(err?.response?.data?.message || 'Failed to load tasks');
      } finally {
        if (fetchId === fetchIdRef.current) setLoading(false);
      }
    },
    [isAuthenticated, filters]
  );

  // ── Fetch stats ─────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await taskService.getTaskStats();
      setStats(data);
    } catch {
      // silent — stats are non-critical
    }
  }, [isAuthenticated]);

  // ── Auto-fetch on filter change ─────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setTasks([]);
      setPagination(null);
      setStats(null);
      return;
    }
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated, fetchStats]);

  // ── Refetch after mutations ─────────────────────────────
  const refresh = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchStats()]);
  }, [fetchTasks, fetchStats]);

  // ── Create ──────────────────────────────────────────────
  const createTask = useCallback(
    async (payload) => {
      if (!isAuthenticated) {
        toast.error('Please create an account to write tasks.');
        throw new Error('UNAUTHENTICATED');
      }
      try {
        const newTask = await taskService.createTask(payload);
        // Optimistic prepend
        setTasks((prev) => [newTask, ...prev]);
        fetchStats();
        toast.success('Task created');
        return newTask;
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Please create an account to write tasks.');
        }
        throw err;
      }
    },
    [isAuthenticated, fetchStats]
  );

  // ── Update (optimistic) ─────────────────────────────────
  const updateTask = useCallback(
    async (id, updates) => {
      if (!isAuthenticated) {
        toast.error('Please log in first.');
        throw new Error('UNAUTHENTICATED');
      }
      const prev = tasks;
      setTasks((list) => list.map((t) => (t._id === id || t.id === id ? { ...t, ...updates } : t)));

      try {
        const updated = await taskService.updateTask(id, updates);
        setTasks((list) =>
          list.map((t) => (t._id === id || t.id === id ? updated : t))
        );
        fetchStats();
        return updated;
      } catch (err) {
        setTasks(prev); // rollback
        throw err;
      }
    },
    [tasks, isAuthenticated, fetchStats]
  );

  // ── Delete (optimistic) ─────────────────────────────────
  const deleteTask = useCallback(
    async (id) => {
      if (!isAuthenticated) throw new Error('UNAUTHENTICATED');
      const prev = tasks;
      setTasks((list) => list.filter((t) => t._id !== id && t.id !== id));

      try {
        await taskService.deleteTask(id);
        fetchStats();
        toast.success('Task deleted');
      } catch (err) {
        setTasks(prev); // rollback
        throw err;
      }
    },
    [tasks, isAuthenticated, fetchStats]
  );

  // ── Bulk delete (optimistic) ────────────────────────────
  const bulkDeleteTasks = useCallback(
    async (ids) => {
      if (!isAuthenticated) throw new Error('UNAUTHENTICATED');
      const prev = tasks;
      const set = new Set(ids);
      setTasks((list) => list.filter((t) => !set.has(t._id) && !set.has(t.id)));

      try {
        const result = await taskService.bulkDeleteTasks(ids);
        fetchStats();
        toast.success(`${result.deletedCount} task(s) deleted`);
        return result;
      } catch (err) {
        setTasks(prev);
        throw err;
      }
    },
    [tasks, isAuthenticated, fetchStats]
  );

  // ── Convenience ─────────────────────────────────────────
  const markComplete = useCallback(
    (id) => updateTask(id, { status: 'completed' }),
    [updateTask]
  );

  const setPage = useCallback((page) => {
    setFilters((f) => ({ ...f, page }));
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const value = useMemo(
    () => ({
      // data
      tasks,
      pagination,
      stats,
      filters,
      loading,
      error,
      // actions
      createTask,
      updateTask,
      deleteTask,
      bulkDeleteTasks,
      markComplete,
      refresh,
      fetchTasks,
      setPage,
      setFilter,
      resetFilters,
    }),
    [
      tasks, pagination, stats, filters, loading, error,
      createTask, updateTask, deleteTask, bulkDeleteTasks, markComplete,
      refresh, fetchTasks, setPage, setFilter, resetFilters,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
// context/BoardContext.jsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import boardService from '../services/collaborativeBoardService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const BoardContext = createContext(null);

export function BoardProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  // ── Fetch document list ─────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingList(true);
    setListError(null);
    try {
      const docs = await boardService.listDocuments();
      setDocuments(docs);
    } catch (err) {
      setListError(err?.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoadingList(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setDocuments([]);
      return;
    }
    fetchDocuments();
  }, [isAuthenticated, fetchDocuments]);

  // ── Create ──────────────────────────────────────────────
  const createDocument = useCallback(
    async (payload = {}) => {
      if (!isAuthenticated) {
        toast.error('Please create an account to write documents.');
        throw new Error('UNAUTHENTICATED');
      }
      const doc = await boardService.createDocument(payload);
      setDocuments((prev) => [doc, ...prev]);
      return doc;
    },
    [isAuthenticated]
  );

  // ── Delete ──────────────────────────────────────────────
  const deleteDocument = useCallback(
    async (id) => {
      const prev = documents;
      setDocuments((list) => list.filter((d) => d._id !== id && d.id !== id));
      try {
        await boardService.deleteDocument(id);
        toast.success('Document deleted');
      } catch (err) {
        setDocuments(prev); // rollback
        throw err;
      }
    },
    [documents]
  );

  const value = useMemo(
    () => ({
      documents,
      loadingList,
      listError,
      fetchDocuments,
      createDocument,
      deleteDocument,
    }),
    [documents, loadingList, listError, fetchDocuments, createDocument, deleteDocument]
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}
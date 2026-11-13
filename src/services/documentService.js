// services/documentSocket.js
import { getSocket } from './socketService';

/**
 * Join a document room. Returns a promise resolving to the initial snapshot.
 * @param {string} docId
 * @returns {Promise<{content: string, title: string, version: number}>}
 */
const joinDocument = (docId) =>
  new Promise((resolve, reject) => {
    const socket = getSocket();
    if (!socket) return reject(new Error('Not authenticated'));

    const doJoin = () => {
      socket.emit('doc:join', { docId }, (res) => {
        if (res?.ok) {
          // Snapshot arrives as a separate event right after the ack
          const onSnapshot = (snap) => {
            socket.off('doc:snapshot', onSnapshot);
            resolve(snap);
          };
          socket.once('doc:snapshot', onSnapshot);
        } else {
          reject(new Error(res?.error || 'Join failed'));
        }
      });
    };

    if (socket.connected) doJoin();
    else socket.once('connect', doJoin);
  });

const leaveDocument = (docId) => {
  getSocket()?.emit('doc:leave', { docId });
};

const sendEdit = (docId, content, version = Date.now()) => {
  getSocket()?.emit('doc:edit', { docId, content, version });
};

const sendTitle = (docId, title) => {
  getSocket()?.emit('doc:title', { docId, title });
};

const saveNow = (docId) =>
  new Promise((resolve, reject) => {
    const socket = getSocket();
    if (!socket) return reject(new Error('Not authenticated'));
    socket.emit('doc:save-now', { docId }, (res) => {
      res?.ok ? resolve() : reject(new Error(res?.error || 'Save failed'));
    });
  });

/**
 * Subscribe to live updates. Returns an unsubscribe function.
 */
const onDocumentUpdate = (handler) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on('doc:update', handler);
  return () => socket.off('doc:update', handler);
};

const onTitleUpdate = (handler) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on('doc:title-update', handler);
  return () => socket.off('doc:title-update', handler);
};

const onPresence = (handler) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on('doc:presence', handler);
  return () => socket.off('doc:presence', handler);
};

export {
  joinDocument,
  leaveDocument,
  sendEdit,
  sendTitle,
  saveNow,
  onDocumentUpdate,
  onTitleUpdate,
  onPresence,
};

export default {
  joinDocument,
  leaveDocument,
  sendEdit,
  sendTitle,
  saveNow,
  onDocumentUpdate,
  onTitleUpdate,
  onPresence,
};
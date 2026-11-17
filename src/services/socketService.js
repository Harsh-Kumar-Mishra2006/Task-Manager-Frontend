// services/socketService.js
import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

let socket = null;

/**
 * Get or create the shared socket instance.
 * Auth is cookie-based — no token in handshake.
 * Call `resetSocket()` on logout / session expiry.
 */
const getSocket = () => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    // FIX: no `auth: { token }` — httpOnly cookie carries the session.
    // `withCredentials: true` is REQUIRED so the browser attaches the cookie
    // to the Socket.IO handshake (and to the polling fallback).
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 10000,
  });

  if (import.meta.env.DEV) {
    socket.on('connect', () => console.log('[socket] connected', socket.id));
    socket.on('disconnect', (r) => console.log('[socket] disconnected', r));
    socket.on('connect_error', (e) => console.log('[socket] connect_error', e.message));
  }

  return socket;
};

const resetSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

const isConnected = () => !!socket?.connected;

export { getSocket, resetSocket, isConnected };
export default { getSocket, resetSocket, isConnected };
// services/socketService.js
import { io } from 'socket.io-client';
import { getToken } from './authService';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

let socket = null;

/**
 * Get or create the shared socket instance.
 * Reconnects automatically when the token changes (call `resetSocket` after login/logout).
 */
const getSocket = () => {
  const token = getToken();
  if (!token) return null;

  if (socket && socket.auth?.token === token) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    withCredentials: true,
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
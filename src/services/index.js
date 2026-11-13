// services/index.js
export * as authService from './authService';
export * as taskService from './taskService';
export * as boardService from './collaborativeBoardService';
export * as documentSocket from './documentSocket';
export { getSocket, resetSocket, isConnected } from './socketService';
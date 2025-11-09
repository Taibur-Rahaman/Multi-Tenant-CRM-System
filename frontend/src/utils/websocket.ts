import { io, Socket } from 'socket.io-client';

const WS_BASE = (import.meta.env.VITE_WS_BASE as string) || 'wss://api.example.com';

let socket: Socket | null = null;

export function connectSocket(token?: string) {
  if (socket) return socket;
  socket = io(WS_BASE, {
    auth: { token }
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}

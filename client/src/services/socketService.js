import { io } from "socket.io-client";

let socket = null;

/**
 * Connect to Socket.IO server with JWT token.
 * Teachers join their personal room automatically on the server.
 */
export const connectSocket = (token) => {
  if (socket && socket.connected) return socket;

  socket = io("http://localhost:5000", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket] Connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  return socket;
};

/** Disconnect and clean up. */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Get current socket instance (or null). */
export const getSocket = () => socket;

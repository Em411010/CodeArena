import { io } from 'socket.io-client';

// Automatically detect socket URL based on environment
const getSocketUrl = () => {
  // If explicitly set in env, use that
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // In production, use the same origin (for Render deployment)
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  // In development, use localhost
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'], // Try WebSocket first
        upgrade: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinLobby(lobbyId) {
    if (this.socket) {
      this.socket.emit('join-lobby', lobbyId);
    }
  }

  leaveLobby(lobbyId) {
    if (this.socket) {
      this.socket.emit('leave-lobby', lobbyId);
    }
  }

  onMatchStarted(callback) {
    if (this.socket) {
      this.socket.on('match-started', callback);
    }
  }

  onMatchEnded(callback) {
    if (this.socket) {
      this.socket.on('match-ended', callback);
    }
  }

  onParticipantJoined(callback) {
    if (this.socket) {
      this.socket.on('participant-joined', callback);
    }
  }

  onLeaderboardUpdate(callback) {
    if (this.socket) {
      this.socket.on('leaderboard-update', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners('match-started');
      this.socket.removeAllListeners('match-ended');
      this.socket.removeAllListeners('participant-joined');
      this.socket.removeAllListeners('leaderboard-update');
    }
  }
}

export const socketService = new SocketService();
export default socketService;

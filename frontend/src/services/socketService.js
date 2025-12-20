import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Initialize Socket.io connection
   */
  connect() {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  /**
   * Join tenant room for isolated communication
   */
  joinTenant(tenantId) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized. Call connect() first.');
      return;
    }

    console.log('🚀 Joining tenant room:', tenantId);
    this.socket.emit('join-tenant', tenantId);
  }

  /**
   * Listen for new email events
   */
  onNewEmail(callback) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized. Call connect() first.');
      return;
    }

    this.socket.on('new-email', callback);
  }

  /**
   * Remove new email listener
   */
  offNewEmail(callback) {
    if (!this.socket) return;
    this.socket.off('new-email', callback);
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('🔌 Socket disconnected');
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Export singleton instance
export default new SocketService();

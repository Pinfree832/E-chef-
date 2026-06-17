const { Server } = require('socket.io');
const { verifyToken } = require('../config/jwt');
const logger = require('../utils/logger');

let io;
const userSockets = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: user ${socket.userId}`);
    userSockets.set(socket.userId, socket.id);
    socket.join(`user:${socket.userId}`);

    socket.on('join_booking', (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on('leave_booking', (bookingId) => {
      socket.leave(`booking:${bookingId}`);
    });

    socket.on('chef_location', (data) => {
      if (socket.userRole === 'chef' && data.booking_id) {
        io.to(`booking:${data.booking_id}`).emit('chef_location_update', {
          ...data, timestamp: new Date()
        });
      }
    });

    socket.on('typing', ({ conversation_id, is_typing }) => {
      socket.broadcast.to(`conv:${conversation_id}`).emit('user_typing', {
        user_id: socket.userId, is_typing
      });
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('disconnect', () => {
      userSockets.delete(socket.userId);
      logger.info(`Socket disconnected: user ${socket.userId}`);
    });
  });

  return io;
}

function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

function emitToBooking(bookingId, event, data) {
  if (io) {
    io.to(`booking:${bookingId}`).emit(event, data);
  }
}

function getIO() {
  return io;
}

module.exports = { initSocket, emitToUser, emitToBooking, getIO };

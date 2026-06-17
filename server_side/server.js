require('dotenv').config();
require('express-async-errors');
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/websocket/socket.handler');
const { testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);

async function startServer() {
  try {
    await testConnection();
    logger.info('Database connection established');

    server.listen(PORT, () => {
      logger.info(`Mobility Chef API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

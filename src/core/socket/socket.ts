import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { logger } from '../shared/utils/logger';
import { socketAuth } from './auth';

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  logger.info('✅ Socket.IO initialized');

  io.use(socketAuth);

  io.on('connection', socket => {
    socket.join(`user:${socket.data.user._id.toString()}`);
    logger.info(
      {
        socketId: socket.id,
        userId: socket.data.user._id,
      },
      'Socket connected',
    );

    socket.on('disconnect', () => {
      logger.info(
        {
          socketId: socket.id,
          userId: socket.data.user._id,
        },
        'Socket disconnected',
      );
    });
  });

  return io;
};

export const getSocket = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }

  return io;
};

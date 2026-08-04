import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

import { socketAuth } from './auth';
import { logger } from '../shared/utils/logger';

let io: Server;

export const initializeSocket = (
  httpServer: HttpServer,
): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  logger.info('✅ Socket.IO initialized');

  io.use(socketAuth);

  io.on('connection', async socket => {
    const profileId =
      socket.data.profile._id.toString();

    const room = `profile:${profileId}`;

    socket.join(room);

    const sockets = await io
      .in(room)
      .fetchSockets();

    logger.info(
      {
        room,
        socketCount: sockets.length,
      },
      'Room joined',
    );

    logger.info(
      {
        socketId: socket.id,
        userId: socket.data.user._id.toString(),
        profileId,
        room,
        rooms: Array.from(socket.rooms),
      },
      'Socket connected and joined profile room',
    );

    socket.on('disconnect', () => {
      logger.info(
        {
          socketId: socket.id,
          profileId,
        },
        'Socket disconnected',
      );
    });
  });

  return io;
};

export const getSocket = (): Server => {
  if (!io) {
    throw new Error(
      'Socket.IO has not been initialized.',
    );
  }

  return io;
};

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

import { socketAuth } from './auth';
import { logger } from '../shared/utils/logger';
import { TeamMember } from '../features/teamMember/teamMember.modal';

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
      socket.data.profile.profileId.toString();

    const profileRoom = `profile:${profileId}`;
    const userRoom = `user:${socket.data.user._id.toString()}`;
    const teamMemberships = await TeamMember.find({
      profileId: socket.data.profile.profileId,
    }).select('teamId');
    const teamRooms = teamMemberships.map(
      ({ teamId }) => `team:${teamId.toString()}`,
    );

    await socket.join([profileRoom, userRoom, ...teamRooms]);

    const sockets = await io
      .in(profileRoom)
      .fetchSockets();

    logger.info(
      {
        room: profileRoom,
        socketCount: sockets.length,
      },
      'Room joined',
    );

    logger.info(
      {
        socketId: socket.id,
        userId: socket.data.user._id.toString(),
        profileId,
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

  io.engine.on('connection_error', error => {
    logger.error(
      { code: error.code, message: error.message },
      'Socket connection error',
    );
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

export const joinProfileSocketsToTeam = async (
  profileId: string,
  teamId: string,
): Promise<void> => {
  const sockets = await getSocket()
    .in(`profile:${profileId}`)
    .fetchSockets();

  await Promise.all(
    sockets.map(socket => socket.join(`team:${teamId}`)),
  );
};

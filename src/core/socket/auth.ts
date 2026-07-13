import { verifyAccessToken } from '../auth/jwt';
import { User } from '../features/user/user.model';

import { Socket } from 'socket.io';

export const socketAuth = async (
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required.'));
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error('Authentication failed.'));
    }

    socket.data.user = user;

    next();
  } catch {
    next(new Error('Authentication failed.'));
  }
};

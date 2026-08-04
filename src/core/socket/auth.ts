import { Socket } from 'socket.io';

import { verifyAccessToken } from '../auth/jwt';
import { User } from '../features/user/user.model';
import { UserProfile } from '../features/userProfile/userProfile.model';

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

    const profile = await UserProfile.findOne({
      userId: user._id,
    });

    if (!profile) {
      return next(new Error('Profile not found.'));
    }

    socket.data.user = user;
    socket.data.profile = profile;

    next();
  } catch {
    next(new Error('Authentication failed.'));
  }
};

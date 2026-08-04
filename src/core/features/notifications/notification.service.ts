import Notification, {
  NotificationType,
} from './notification.model';
import { getSocket } from '../../socket/socket';

export type CreateNotificationPayload = {
  recipients: {
    profileId: string;
  }[];
  teamId: string;
  type: NotificationType;
  title: string;
  message: string;
  entity: {
    type: string;
    id: string;
  };
};

export const createNotification = async (
  payload: CreateNotificationPayload,
) => {
  const notification = await Notification.create(payload);

  const socket = getSocket();

  for (const recipient of payload.recipients) {
    const room = `profile:${recipient.profileId}`;

    await socket
      .in(room)
      .fetchSockets();

    socket.to(room).emit(
      'notification:new',
      notification,
    );
  }

  return notification;
};

export const getNotificationsForProfile = async (
  profileId: string,
) => {
  return Notification.find({
    'recipients.profileId': profileId,
  }).sort({
    createdAt: -1,
  });
};

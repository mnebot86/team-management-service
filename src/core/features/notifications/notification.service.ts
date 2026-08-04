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

    socket.to(room).emit(
      'notification:new',
      notification,
    );

    const unreadCount = await getUnreadNotificationCount(recipient.profileId);
    socket.to(room).emit('notification:unread-count', { count: unreadCount });
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

export const getUnreadNotificationCount = async (
  profileId: string,
): Promise<number> => {
  return Notification.countDocuments({
    recipients: {
      $elemMatch: { profileId, readAt: null },
    },
  });
};

export const markNotificationRead = async (
  notificationId: string,
  profileId: string,
) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, 'recipients.profileId': profileId },
    { $set: { 'recipients.$[recipient].readAt': new Date() } },
    {
      new: true,
      arrayFilters: [{ 'recipient.profileId': profileId }],
    },
  );
};

export const markAllNotificationsRead = async (
  profileId: string,
): Promise<number> => {
  const result = await Notification.updateMany(
    { recipients: { $elemMatch: { profileId, readAt: null } } },
    { $set: { 'recipients.$[recipient].readAt': new Date() } },
    { arrayFilters: [{ 'recipient.profileId': profileId, 'recipient.readAt': null }] },
  );

  return result.modifiedCount;
};

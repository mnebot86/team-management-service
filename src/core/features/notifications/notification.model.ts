import { Schema, model, Types, Document } from 'mongoose';

export const NOTIFICATION_TYPES = {
  PRACTICE_CREATED: 'practice.created',
  PRACTICE_UPDATED: 'practice.updated',
  PRACTICE_CANCELLED: 'practice.cancelled',

  GAME_CREATED: 'game.created',
  GAME_UPDATED: 'game.updated',

  ATTENDANCE_TAKEN: 'attendance.taken',

  PLAYER_JOINED: 'player.joined',
  PLAYER_REMOVED: 'player.removed',
  TEAM_MEMBER_JOINED: 'team-member.joined',

  INVITE_CREATED: 'invite.created',
  INVITE_UPDATED: 'invite.updated',

  ANNOUNCEMENT_CREATED: 'announcement.created',

  DEPT_CHART_CREATED: 'dept-chart.created',
  DEPT_CHART_UPDATED: 'dept-chart.updated',
  DEPT_CHART_DELETED: 'dept-chart.deleted',
} as const;

export type NotificationType =
  typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export interface NotificationRecipient {
  profileId: Types.ObjectId;
  readAt: Date | null;
}

export interface NotificationDocument extends Document {
  recipients: NotificationRecipient[];

  teamId: Types.ObjectId;

  type: NotificationType;

  title: string;
  message: string;

  entity: {
    type: string;
    id: Types.ObjectId;
  };

  data: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    recipients: [
      {
        profileId: {
          type: Schema.Types.ObjectId,
          ref: 'Profile',
          required: true,
        },
        readAt: {
          type: Date,
          default: null,
        },
      },
    ],

    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: Object.values(NOTIFICATION_TYPES),
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    entity: {
      type: {
        type: String,
        required: true,
      },

      id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
    },

    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({
  'recipients.profileId': 1,
  createdAt: -1,
});

NotificationSchema.index({
  'recipients.profileId': 1,
  'recipients.readAt': 1,
});

NotificationSchema.index({
  teamId: 1,
  createdAt: -1,
});

export default model<NotificationDocument>(
  'Notification',
  NotificationSchema,
);

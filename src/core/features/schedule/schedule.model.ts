import { Schema, model, Types, Document } from 'mongoose';

export interface ScheduleDocument extends Document {
  teamId: Types.ObjectId;
  title?: string;
  description: string;
  type: string;
  opponentName: string;
  isHomeGame: boolean;
  startDate: Date;
  startTime: Date | null;
  endTime: Date | null;
  location: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  recurrence: {
    isRecurring: boolean;
    frequency: string | null;
    daysOfWeek: number[];
    endDate: Date | null;
  };
  attendance: {
    profileId: Types.ObjectId;
    status: 'present' | 'late' | 'absent';
    note?: string;
    markedByUserId: Types.ObjectId;
    markedAt: Date;
  }[];
  createdByUserId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ScheduleDocument>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    title: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['event', 'game', 'practice', 'other'],
      trim: true,
    },
    opponentName: {
      type: String,
      trim: true,
      default: null,
    },
    isHomeGame: {
      type: Boolean,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    location: {
      name: String,
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    recurrence: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: null,
      },
      daysOfWeek: {
        type: [Number],
        default: [],
      },
      endDate: {
        type: Date,
        default: null,
      },
    },
    attendance: {
      type: [
        {
          profileId: {
            type: Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
          },
          status: {
            type: String,
            enum: ['present', 'late', 'absent'],
            required: true,
          },
          note: {
            type: String,
            default: '',
          },
          markedByUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          markedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Schedule = model<ScheduleDocument>('Schedule', scheduleSchema);

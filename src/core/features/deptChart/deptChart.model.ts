import { Schema, model } from 'mongoose';

const playerSchema = new Schema(
  {
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },

    depth: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    _id: false,
  },
);

const positionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      trim: true,
      default: '',
    },

    sortOrder: {
      type: Number,
      required: true,
      default: 1,
    },

    players: {
      type: [playerSchema],
      default: [],
    },
  },
  {
    _id: true,
  },
);

const deptChartSchema = new Schema(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    positions: {
      type: [positionSchema],
      default: [],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

deptChartSchema.index(
  {
    teamId: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

export const DeptChart = model('DeptChart', deptChartSchema);

import { Schema, model } from 'mongoose';
import { PracticeDocument, PracticeSection } from './practice.types';

const practiceSectionSchema = new Schema<PracticeSection>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    order: { type: Number, required: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: true }
);

const practiceSchema = new Schema<PracticeDocument>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },

    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Schedule',
      index: true,
    },

    title: { type: String, required: true, trim: true },

    description: { type: String, default: '', trim: true },

    focusAreas: {
      type: [String],
      default: [],
    },

    totalDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },

    sections: {
      type: [practiceSectionSchema],
      default: [],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Practice = model<PracticeDocument>('Practice', practiceSchema);

import { Document, Types } from 'mongoose';

export type PracticePlanStatus = 'draft' | 'published' | 'archived';

export interface PracticeSection {
  title: string;
  description?: string;
  durationMinutes: number;
  order: number;
  notes?: string;
}

export interface PracticeDocument extends Document {
  teamId: Types.ObjectId;
  scheduleId?: Types.ObjectId;

  title: string;
  description?: string;
  focusAreas: string[];

  totalDurationMinutes: number;
  status: PracticePlanStatus;

  sections: PracticeSection[];

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

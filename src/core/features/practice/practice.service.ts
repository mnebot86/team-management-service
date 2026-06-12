import { Practice } from './practice.model';
import { PracticeDocument } from './practice.types';

export interface CreatePracticePlanInput {
  teamId: string;
  scheduleId?: string;
  title: string;
  description?: string;
  focusAreas?: string[];
  totalDurationMinutes: number;
  status?: 'draft' | 'published' | 'archived';
  sections?: {
    title: string;
    description?: string;
    durationMinutes: number;
    order: number;
    notes?: string;
  }[];
  createdBy: string;
}

export const createPracticePlan = async (
  input: CreatePracticePlanInput
): Promise<PracticeDocument> => {
  const practicePlan = await Practice.create({
    teamId: input.teamId,
    scheduleId: input.scheduleId,
    title: input.title,
    description: input.description,
    focusAreas: input.focusAreas ?? [],
    totalDurationMinutes: input.totalDurationMinutes,
    status: input.status ?? 'draft',
    sections: input.sections ?? [],
    createdBy: input.createdBy,
  });

  return practicePlan;
};


export const getPracticePlansByTeamId = async (
  teamId: string
): Promise<PracticeDocument[]> => {
  return Practice.find({ teamId })
    .sort({ createdAt: -1 });
};

export const updatePracticePlan = async (
  planId: string,
  input: Partial<CreatePracticePlanInput> & { updatedBy: string }
): Promise<PracticeDocument | null> => {
  return Practice.findByIdAndUpdate(
    planId,
    {
      $set: {
        ...input,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

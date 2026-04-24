import mongoose from 'mongoose';
import { Team } from '../team/team.model';
import { Invite } from './invite.model';
import { MONGO_ERRORS } from '../../constants/mongoErrors';

export const createInvite = async ({
  teamId,
  email,
  role,
  invitedBy,
}: {
  teamId: string;
  email: string;
  role: string;
  invitedBy: string;
}) => {
  try {
    const invite = await Invite.create({
      teamId: new mongoose.Types.ObjectId(teamId),
      email,
      role,
      invitedBy: new mongoose.Types.ObjectId(invitedBy),
    });

    return invite;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === MONGO_ERRORS.DUPLICATE_KEY
    ) {
      const existing = await Invite.findOne({
        teamId: new mongoose.Types.ObjectId(teamId),
        email,
        status: 'pending',
      });

      return existing;
    }

    throw error;
  }
};

export const getInvitesForUser = async (email: string) => {
  return await Invite.find({
    email,
    status: 'pending',
  }).lean();
};

export const acceptInvite = async (inviteId: string, userId: string) => {
  const invite = await Invite.findById(inviteId);

  if (!invite || invite.status !== 'pending') {
    return null;
  }

  await Team.findByIdAndUpdate(invite.teamId, {
    $addToSet: {
      members: {
        userId: new mongoose.Types.ObjectId(userId),
        role: invite.role,
      },
    },
  });

  invite.status = 'accepted';
  await invite.save();

  return invite;
};

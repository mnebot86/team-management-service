import mongoose from 'mongoose';
import { Invite } from './invite.model';
import { MONGO_ERRORS } from '../../constants/mongoErrors';
import { Profile } from '../profile/profile.model';
import { addTeamMember } from '../teamMember/teamMember.service';
import type { TeamRole } from '../teamMember/teamMember.modal';

export const createInvite = async ({
  teamId,
  email,
  role,
  invitedBy,
}: {
  teamId: string;
  email: string;
  role: TeamRole;
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

  // find claimed profile for this user
  const profile = await Profile.findOne({
    createdByUserId: new mongoose.Types.ObjectId(userId),
    isClaimed: true,
  });

  if (!profile) {
    return null;
  }

  // create membership via TeamMember service
  await addTeamMember(
    invite.teamId as mongoose.Types.ObjectId,
    profile._id as mongoose.Types.ObjectId,
    invite.role as TeamRole
  );

  invite.status = 'accepted';
  await invite.save();

  return invite;
};

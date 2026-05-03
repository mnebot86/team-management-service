import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import {
  getTeamMembers,
  getTeamsForProfile,
  updateTeamMemberRole,
  removeTeamMember,
} from './teamMember.service';
import { Profile } from '../profile/profile.model';
import { AuthRequest } from '../team/team.types';

// Helper to get the claimed profile for a user
const getProfileForUser = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  return Profile.findOne({ createdByUserId: userId, isClaimed: true });
};

export const getRoster = async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid teamId' });
  }

  try {
    const members = await getTeamMembers(new mongoose.Types.ObjectId(teamId));
    return res.status(StatusCodes.OK).json({ success: true, data: members });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to fetch roster' });
  }
};

export const getMyTeams = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const profile = await getProfileForUser(userId);
    if (!profile) {
      return res.status(StatusCodes.OK).json({ success: true, data: [] });
    }

    const memberships = await getTeamsForProfile(profile._id);
    const teams = memberships.map((m) => m.teamId);

    return res.status(StatusCodes.OK).json({ success: true, data: teams });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to fetch teams' });
  }
};

export const patchMemberRole = async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;
  const profileId = req.params.profileId as string;
  const { role } = req.body as { role?: 'owner' | 'coach' | 'player' };

  if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(profileId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid ids' });
  }

  if (!role) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Role is required' });
  }

  try {
    const updated = await updateTeamMemberRole(
      new mongoose.Types.ObjectId(teamId),
      new mongoose.Types.ObjectId(profileId),
      role
    );

    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Member not found' });
    }

    return res.status(StatusCodes.OK).json({ success: true, data: updated });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to update role' });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;
  const profileId = req.params.profileId as string;

  if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(profileId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid ids' });
  }

  try {
    await removeTeamMember(
      new mongoose.Types.ObjectId(teamId),
      new mongoose.Types.ObjectId(profileId)
    );

    return res.status(StatusCodes.OK).json({ success: true, message: 'Member removed' });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to remove member' });
  }
};

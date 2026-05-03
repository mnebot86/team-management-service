import { Response } from 'express';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { sendError, sendSuccess } from '../../shared/utils/response';
import * as inviteService from './invite.service';
import { Profile } from '../profile/profile.model';
import { getTeamRole } from '../teamMember/teamMember.service';
import type { TeamRole } from '../teamMember/teamMember.modal';
import { AuthRequest } from '../team/team.types';

export const createInvite = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const { teamId } = req.params as { teamId?: string };
  const { email, role } = req.body as { email?: string; role?: string };

  if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Team Id');
  }

  if (!email) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Email is required');
  }

  try {
    // resolve user's profile
    const profile = await Profile.findOne({
      createdByUserId: new mongoose.Types.ObjectId(req.user.id),
      isClaimed: true,
    });

    if (!profile) {
      return sendError(res, StatusCodes.FORBIDDEN, 'No profile found for user');
    }

    const roleInTeam = await getTeamRole(
      new mongoose.Types.ObjectId(teamId),
      profile._id as mongoose.Types.ObjectId
    );

    if (!roleInTeam || (roleInTeam !== 'owner' && roleInTeam !== 'coach')) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Forbidden');
    }

    const invite = await inviteService.createInvite({
      teamId,
      email,
      role: (role as TeamRole) || 'player',
      invitedBy: req.user.id,
    });

    return sendSuccess(res, StatusCodes.CREATED, invite, 'Invite created');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create invite', error);
  }
};

export const getMyInvites = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  try {
    const invites = await inviteService.getInvitesForUser(req.user.email);

    return sendSuccess(res, StatusCodes.OK, invites, 'Invites fetched');
  } catch (error) {
    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch invites',
      error
    );
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const { inviteId } = req.params as { inviteId?: string };

  if (!inviteId || !mongoose.Types.ObjectId.isValid(inviteId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Invite Id');
  }

  try {
    const result = await inviteService.acceptInvite(inviteId, req.user.id);

    if (!result) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Invite not found or already used');
    }

    return sendSuccess(res, StatusCodes.OK, result, 'Invite accepted');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to accept invite', error);
  }
};

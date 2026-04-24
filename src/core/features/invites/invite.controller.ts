import { Response } from 'express';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { sendError, sendSuccess } from '../../shared/utils/response';
import * as inviteService from './invite.service';
import * as teamService from '../team/team.service';
import { getUserRoleInTeam, canManageMembers } from '../team/team.permissions';
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
    const team = await teamService.getTeamByIdForUser(teamId, req.user.id);

    if (!team) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Team not found');
    }

    const roleCheck = getUserRoleInTeam(team, req.user.id);

    if (!roleCheck || !canManageMembers(roleCheck)) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Forbidden');
    }

    const invite = await inviteService.createInvite({
      teamId,
      email,
      role: role || 'player',
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

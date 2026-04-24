import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { sendError } from '../shared/utils/response';
import * as teamService from '../features/team/team.service';
import { getUserRoleInTeam } from '../features/team/team.permissions';
import { AuthRequest } from '../features/team/team.types';

export const requireTeamPermission = (
  checker: (role: 'owner' | 'coach' | 'player') => boolean
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }

    const { teamId } = req.params as { teamId?: string };

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Team Id');
    }

    try {
      const team = await teamService.getTeamByIdForUser(teamId, req.user.id);

      if (!team) {
        return sendError(res, StatusCodes.NOT_FOUND, 'Team not found');
      }

      const role = getUserRoleInTeam(team, req.user.id);

      if (!role || !checker(role)) {
        return sendError(res, StatusCodes.FORBIDDEN, 'Forbidden');
      }

      req.team = team;

      next();
    } catch (error) {
      return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Permission check failed', error);
    }
  };
};

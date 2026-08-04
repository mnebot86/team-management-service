import { StatusCodes } from "http-status-codes";
import { sendError, sendSuccess } from "../../shared/utils/response";
import { getTeamById } from "../team/team.service";
import { AuthRequest } from "../team/team.types";
import { Response } from 'express';
import ROLES from "../../constants/roles";
import { createCode, getTeamInviteCode, joinTeamWithInviteCode, updateCodeStatus } from "./invite.services";
import { createNotification } from "../notifications/notification.service";

export const createInviteCode = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const { role, maxUses, expiresAt } = req.body;
  const { teamId } = req.params;

  const team = await getTeamById(teamId as string);

  if (!team) {
    sendError(res, StatusCodes.NOT_FOUND, `Team with ID: ${teamId} does not exist`);
    return
  }

  const validRoles = Object.values(ROLES);

  if (!validRoles.includes(role)) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Submitted role does not exist',
    );

    return
  }

  const payload = {
    teamId: teamId as string,
    role,
    createdBy: userId,
    maxUses: maxUses ?? 0,
    expiresAt: expiresAt ?? null,
  };


  try {
    const inviteCode = await createCode(payload);

    sendSuccess(res, StatusCodes.CREATED, inviteCode, `Invite Code for ${role} CREATED`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate code.';

    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, message);
  }
};

export const getVisitCodes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { teamId } = req.params;

  try {
    const team = await getTeamById(teamId as string);

    if (!team) {
      sendError(
        res,
        StatusCodes.NOT_FOUND,
        `Team with ID: ${teamId} does not exist`,
      );
      return;
    }

    const sections = await getTeamInviteCode(teamId as string);

    sendSuccess(
      res,
      StatusCodes.OK,
      sections,
      'Invite codes retrieved successfully.',
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to retrieve invite codes.';

    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      message,
    );
  }
};

export const toggleCodeStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { codeId } = req.params

  if (!codeId) {
    sendError(
      res,
      StatusCodes.NOT_FOUND,
      'Code Id not found',
    );

    return;
  }

  try {
    const updatedCode = await updateCodeStatus(codeId as string);

    if (!updatedCode) {
      sendError(
        res,
        StatusCodes.NOT_FOUND,
        'Invite code not found.',
      );

      return;
    }

    sendSuccess(res, StatusCodes.OK, updatedCode, 'Invite code updated successfully.');
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to retrieve invite codes.';

    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      message,
    );
  }
}

export const joinTeam = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { code } = req.body;

  if (!code) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Invite code is required.',
    );

    return;
  }

  try {
    const profileId = req.user!.profileId;

    if (!profileId) {
      sendError(
        res,
        StatusCodes.UNAUTHORIZED,
        'Profile not found.',
      );

      return;
    }

    const teamMember = await joinTeamWithInviteCode({
      code,
      profileId,
    });

    sendSuccess(
      res,
      StatusCodes.CREATED,
      teamMember,
      'Successfully joined the team.',
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to join team.';

    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      message,
    );
  }
};

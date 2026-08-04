import { Invite } from "./invite.model";
import crypto from 'crypto';
import { CHARSET } from "./constants";
import { CreateInvitePayload } from "./types";
import { TEAM_ROLES, TeamMember } from "../teamMember/teamMember.modal";
import { createNotification } from "../notifications/notification.service";
import { NOTIFICATION_TYPES } from "../notifications/notification.model";

export const generateInviteCode = (
  length = 8,
): string => {
  const bytes = crypto.randomBytes(length);

  let code = '';

  for (const randomByte of bytes) {
    code += CHARSET[randomByte % CHARSET.length];
  }

  return `${code.slice(0, 4)}-${code.slice(4)}`;
};

export const createCode = async (payload: CreateInvitePayload) => {
  let code: string;

  do {
    code = generateInviteCode();
  } while (
    await Invite.exists({ code })
  );

  return Invite.create({
    ...payload,
    code,
  });
};

export const getTeamInviteCode = async (teamId: string) => {
  const codes = await Invite.find({ teamId })
    .sort({ createdAt: -1 })
    .lean();

  const activeCodes = codes.filter((code) => code.active);
  const inactiveCodes = codes.filter((code) => !code.active);

  return [
    {
      title: 'Active',
      data: activeCodes,
    },
    {
      title: 'Inactive',
      data: inactiveCodes,
    },
  ].filter((section) => section.data.length > 0);
};

export const updateCodeStatus = async (codeId: string) => {
  const invite = await Invite.findById(codeId);

  if (!invite) {
    return null;
  }

  if (!invite.active) {
    const maxUsesReached =
      invite.maxUses > 0 && invite.usedCount >= invite.maxUses;

    const expired =
      invite.expiresAt && invite.expiresAt < new Date();

    if (maxUsesReached || expired) {
      throw new Error(
        'Expired or fully used invite codes cannot be reactivated. Create a new invite code instead.',
      );
    }
  }

  invite.active = !invite.active;

  await invite.save();

  return invite;
};

type JoinTeamWithInviteCodePayload = {
  code: string;
  profileId: string;
};

export const joinTeamWithInviteCode = async ({
  code,
  profileId,
}: JoinTeamWithInviteCodePayload) => {
  const invite = await Invite.findOne({
    code: code.trim().toUpperCase(),
  });

  if (!invite) {
    throw new Error('Invalid invite code.');
  }

  if (!invite.active) {
    throw new Error('This invite code is no longer active.');
  }

  if (
    invite.expiresAt &&
    invite.expiresAt < new Date()
  ) {
    throw new Error('This invite code has expired.');
  }

  if (
    invite.maxUses > 0 &&
    invite.usedCount >= invite.maxUses
  ) {
    invite.active = false;

    await invite.save();

    throw new Error(
      'This invite code has reached its usage limit.',
    );
  }

  const existingMember = await TeamMember.exists({
    teamId: invite.teamId,
    profileId,
  });

  if (existingMember) {
    throw new Error('You are already a member of this team.');
  }

  const teamMember = await TeamMember.create({
    teamId: invite.teamId,
    profileId,
    role: invite.role,
  });

  invite.usedCount += 1;
  invite.lastUsedAt = new Date();

  if (
    invite.maxUses > 0 &&
    invite.usedCount >= invite.maxUses
  ) {
    invite.active = false;
  }

  await invite.save();

  const recipients = await TeamMember.find({
    teamId: invite.teamId,
    role: {
      $in: [TEAM_ROLES.OWNER, TEAM_ROLES.COACH],
    },
  }).select('profileId');

  const roleLabel =
    invite.role.charAt(0).toUpperCase() +
    invite.role.slice(1);

  await createNotification({
    recipients: recipients.map(({ profileId }) => ({
      profileId: profileId.toString(),
    })),
    teamId: invite.teamId.toString(),
    type: NOTIFICATION_TYPES.TEAM_MEMBER_JOINED,
    title: `New ${roleLabel} Joined`,
    message: `A new ${invite.role} has joined the team.`,
    entity: {
      type: 'team-member',
      id: teamMember._id.toString(),
    },
  });

  return teamMember;
};

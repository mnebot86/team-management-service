import mongoose, { Types } from 'mongoose';
import { TeamMember, TeamMemberDocument, TeamRole } from './teamMember.modal';

export const addTeamMember = async (
  teamId: Types.ObjectId,
  profileId: Types.ObjectId,
  role: TeamRole,
  session?: mongoose.ClientSession
): Promise<TeamMemberDocument> => {
  const [teamMember] = await TeamMember.create(
    [
      {
        teamId,
        profileId,
        role,
      },
    ],
    { session }
  );

  if (!teamMember) {
    throw new Error('Team member creation failed');
  }

  return teamMember;
};

export const getTeamMembers = async (
  teamId: Types.ObjectId
): Promise<TeamMemberDocument[]> => {
  return TeamMember.find({ teamId }).populate('profileId');
};

export const getTeamMember = async (
  teamId: Types.ObjectId,
  profileId: Types.ObjectId
): Promise<TeamMemberDocument | null> => {
  return TeamMember.findOne({ teamId, profileId });
};

export const getTeamRole = async (
  teamId: Types.ObjectId,
  profileId: Types.ObjectId
): Promise<TeamRole | null> => {
  const member = await TeamMember.findOne({ teamId, profileId });
  return member ? member.role : null;
};

export const getTeamsForUser = async (
  profileId: Types.ObjectId
): Promise<any[]> => {
  return TeamMember.find({ profileId }).populate('teamId');
};

export const removeTeamMember = async (
  teamId: Types.ObjectId,
  profileId: Types.ObjectId
): Promise<void> => {
  await TeamMember.deleteOne({ teamId, profileId });
};

export const updateTeamMemberRole = async (
  teamId: Types.ObjectId,
  profileId: Types.ObjectId,
  role: TeamRole
): Promise<TeamMemberDocument | null> => {
  return TeamMember.findOneAndUpdate(
    { teamId, profileId },
    { role },
    { new: true }
  );
};

export const getTeamsForProfile = async (profileId: Types.ObjectId) => {
  return TeamMember.find({ profileId })
};

export const getTeamMembersCount = async (teamId: Types.ObjectId): Promise<number> => {
  return TeamMember.countDocuments({ teamId });
};

export const getTeamMemberById = async (
  teamId: string,
  profileId: string
): Promise<TeamMemberDocument | null> => {
  return TeamMember.findOne({ teamId, profileId }).populate('profileId');
};

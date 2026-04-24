import mongoose from 'mongoose';
import { CreateTeamDto } from './team.dto';
import { Team } from './team.model';

export const createTeam = async (data: CreateTeamDto) => {
  const team = await Team.create({
    ...data,
    ownerId: new mongoose.Types.ObjectId(data.ownerId),
  });

  return team;
};

export const getTeamByIdForUser = async (
  teamId: string,
  userId: string
) => {
  const objectUserId = new mongoose.Types.ObjectId(userId);

  return await Team.findOne({
    _id: teamId,
    $or: [
      { ownerId: objectUserId },
      { 'members.userId': objectUserId },
    ],
  });
};

export const getTeamsForUser = async (userId: string) => {
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const teams = await Team.find({
    $or: [
      { ownerId: objectUserId },
      { 'members.userId': objectUserId },
    ],
  }).lean();

  return teams;
};

export const updateTeam = async (
  teamId: string,
  update: Partial<CreateTeamDto>
) => {
  return await Team.findByIdAndUpdate(teamId, update, { new: true });
};

export const deleteTeam = async (teamId: string) => {
  return await Team.findByIdAndDelete(teamId);
};

export const addMemberToTeam = async (
  teamId: string,
  userId: string,
  role: string
) => {
  const updated = await Team.findByIdAndUpdate(
    teamId,
    {
      $addToSet: {
        members: {
          userId: new mongoose.Types.ObjectId(userId),
          role,
        },
      },
    },
    { new: true }
  );

  return updated;
};

export const removeMemberFromTeam = async (
  teamId: string,
  userId: string
) => {
  const updated = await Team.findByIdAndUpdate(
    teamId,
    {
      $pull: {
        members: { userId: new mongoose.Types.ObjectId(userId) },
      },
    },
    { new: true }
  );

  return updated;
};

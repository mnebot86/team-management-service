import mongoose, { Types } from 'mongoose';
import { CreateTeamDto } from './team.dto';
import { Team } from './team.model';
import { Profile } from '../profile/profile.model';
import { addTeamMember, getTeamsForProfile } from '../teamMember/teamMember.service';

export const createTeam = async (data: CreateTeamDto) => {
  const team = await Team.create({
    ...data,
    ownerId: new mongoose.Types.ObjectId(data.ownerId),
  });

  // find profile for owner
  const profile = await Profile.findOne({ createdByUserId: team.ownerId, isClaimed: true });

  if (profile) {
    await addTeamMember(team._id as Types.ObjectId, profile._id as Types.ObjectId, 'owner');
  }

  return team;
};

export const getTeamByIdForUser = async (teamId: string, userId: string) => {
  const profile = await Profile.findOne({ createdByUserId: userId, isClaimed: true });
  if (!profile) return null;

  const memberships = await getTeamsForProfile(profile._id as Types.ObjectId);
  const match = memberships.find((m) => {
    const t = m.teamId as { _id?: Types.ObjectId } | Types.ObjectId;
    const id = t instanceof Types.ObjectId ? t : t._id;
    return id?.toString() === teamId;
  });

  return match ? match.teamId : null;
};

export const getTeamsForUser = async (userId: string) => {
  const profile = await Profile.findOne({ createdByUserId: userId, isClaimed: true });
  if (!profile) return [];

  const memberships = await getTeamsForProfile(profile._id as Types.ObjectId);

  return memberships.map((m) => m.teamId);
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

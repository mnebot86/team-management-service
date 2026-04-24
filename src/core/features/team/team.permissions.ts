import mongoose from 'mongoose';

type Role = 'owner' | 'coach' | 'player';

type TeamMember = {
  userId: mongoose.Types.ObjectId;
  role: Role;
};

type TeamLike = {
  ownerId: mongoose.Types.ObjectId;
  members?: TeamMember[];
};

export const canUpdateTeam = (role: Role) => {
  return role === 'owner' || role === 'coach';
};

export const canDeleteTeam = (role: Role) => {
  return role === 'owner';
};

export const canManageMembers = (role: Role) => {
  return role === 'owner' || role === 'coach';
};

export const getUserRoleInTeam = (team: TeamLike, userId: string): Role | null => {
  if (team.ownerId.toString() === userId) {
    return 'owner';
  }

  const member = team.members?.find(
    (m: TeamMember) => m.userId.toString() === userId
  );

  return member?.role || null;
};

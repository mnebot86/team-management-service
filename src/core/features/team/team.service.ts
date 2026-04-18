import { CreateTeamDto } from './team.dto';
import { Team } from './team.model';

export const createTeam = async (data: CreateTeamDto) => {
  const team = await Team.create(data);

  return team;
};

export const getTeamById = async (id: string) => {
  const team = await Team.findById(id);

  return team;
};

export const getTeams = async () => {
  const teams = await Team.find({}).lean();

  return teams;
};

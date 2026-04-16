import { CreateTeamDto } from './team.dto';
import { Team } from './team.model';

export const createTeam = async (data: CreateTeamDto) => {
  const team = await Team.create(data);

  return team;
};


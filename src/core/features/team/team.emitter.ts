import { getSocket } from '../../socket';
import { ITeam } from './team.types';

export const emitTeamCreated = (
  userId: string,
  team: ITeam,
) => {
  getSocket()
    .to(`user:${userId}`)
    .emit('team.created', team);
};

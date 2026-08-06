import { getSocketOrNull } from '../../socket';
import { ITeam } from './team.types';

export const emitTeamCreated = (
  userId: string,
  team: ITeam,
) => {
  const socketServer = getSocketOrNull();

  if (!socketServer) {
    return;
  }

  socketServer
    .to(`user:${userId}`)
    .emit('team.created', team);
};

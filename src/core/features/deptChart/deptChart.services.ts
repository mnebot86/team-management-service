import { Types } from 'mongoose';

import { DeptChart } from './deptChart.model';

export interface CreateDeptChartInput {
  teamId: string;
  name: string;
  positions?: {
    name: string;
    shortName?: string;
    sortOrder?: number;
    players?: {
      profileId: string;
      depth?: number;
    }[];
  }[];
  createdBy: string;
}

interface DeptChartPositionInput {
  name: string;
  shortName?: string;
  sortOrder?: number;
  players?: {
    profileId: string;
    depth?: number;
  }[];
}

interface DeptChartPlayerChange {
  positionId: string;
  profileId: string;
  depth?: number;
}

export interface UpdateDeptChartInput {
  name?: string;
  positions?: DeptChartPositionInput[];
  addPlayers?: DeptChartPlayerChange[];
  removePlayers?: Omit<DeptChartPlayerChange, 'depth'>[];
}

export class DeptChartPositionNotFoundError extends Error {}

export const createDeptChart = async (input: CreateDeptChartInput) => {
  return DeptChart.create({
    teamId: new Types.ObjectId(input.teamId),
    name: input.name,
    positions: input.positions ?? [],
    createdBy: new Types.ObjectId(input.createdBy),
  });
};

export const getDeptChartFilters = async (
  teamId: string,
): Promise<string[]> => {
  const names = await DeptChart.distinct('name', {
    teamId: new Types.ObjectId(teamId),
  });

  return names.sort((a, b) => a.localeCompare(b));
};

export const getDeptCharts = async (
  teamId: string,
  name?: string,
) => {
  return DeptChart.find({
    teamId: new Types.ObjectId(teamId),
    ...(name ? { name } : {}),
  }).sort({ name: 1, createdAt: -1 });
};

export const updateDeptChart = async (
  deptChartId: string,
  input: UpdateDeptChartInput,
) => {
  const deptChart = await DeptChart.findById(deptChartId);

  if (!deptChart) {
    return null;
  }

  if (input.name !== undefined) {
    deptChart.name = input.name;
  }

  if (input.positions !== undefined) {
    deptChart.set('positions', input.positions);
  }

  for (const player of input.addPlayers ?? []) {
    const position = deptChart.positions.id(player.positionId);

    if (!position) {
      throw new DeptChartPositionNotFoundError(
        `Position ${player.positionId} was not found.`,
      );
    }

    const existingPlayer = position.players.find(
      ({ profileId }) => profileId.toString() === player.profileId,
    );

    if (existingPlayer) {
      existingPlayer.depth = player.depth ?? existingPlayer.depth;
    } else {
      position.players.push({
        profileId: new Types.ObjectId(player.profileId),
        depth: player.depth ?? 1,
      });
    }
  }

  for (const player of input.removePlayers ?? []) {
    const position = deptChart.positions.id(player.positionId);

    if (!position) {
      throw new DeptChartPositionNotFoundError(
        `Position ${player.positionId} was not found.`,
      );
    }

    for (let index = position.players.length - 1; index >= 0; index -= 1) {
      if (position.players[index]?.profileId.toString() === player.profileId) {
        position.players.splice(index, 1);
      }
    }
  }

  return deptChart.save();
};

export const deleteDeptChart = async (deptChartId: string) => {
  return DeptChart.findByIdAndDelete(deptChartId);
};

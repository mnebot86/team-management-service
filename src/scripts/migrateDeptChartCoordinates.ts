import mongoose from 'mongoose';

import { connectDB } from '../config/db';
import { DeptChart } from '../core/features/deptChart/deptChart.model';
import { Team } from '../core/features/team/team.model';
import { getSportVariant } from '../core/features/sports/sport.registry';
import { logger } from '../core/shared/utils/logger';

const fallbackCoordinates = (index: number, total: number) => {
  const columns = Math.min(5, Math.max(1, total));
  const rows = Math.ceil(total / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: ((column + 1) / (columns + 1)) * 100,
    y: ((row + 1) / (rows + 1)) * 100,
  };
};

const migrate = async (): Promise<void> => {
  await connectDB();

  const rawCharts = await DeptChart.collection.find({
    'positions.coordinates': { $exists: false },
  }).toArray();
  let updatedCharts = 0;
  let updatedPositions = 0;

  for (const rawChart of rawCharts) {
    const chart = await DeptChart.findById(rawChart._id);

    if (!chart) {
      continue;
    }

    const team = await Team.findById(chart.teamId).select(
      'sportId sportVariantId',
    );
    const variant = team?.sportId
      ? getSportVariant(team.sportId, team.sportVariantId)
      : undefined;
    const template = variant?.depthCharts.find(item => item.name === chart.name);
    let changed = false;

    chart.positions.forEach((position, index) => {
      const rawPosition = (rawChart.positions as {
        coordinates?: { x?: number; y?: number };
      }[] | undefined)?.[index];

      if (rawPosition?.coordinates) {
        return;
      }

      position.coordinates = template?.coordinates?.[index]
        ?? fallbackCoordinates(index, chart.positions.length);
      changed = true;
      updatedPositions += 1;
    });

    if (changed) {
      await chart.save();
      updatedCharts += 1;
    }
  }

  logger.info(
    { updatedCharts, updatedPositions },
    'Dept chart coordinates migrated',
  );
};

migrate()
  .catch((error) => {
    logger.error({ error }, 'Dept chart coordinate migration failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

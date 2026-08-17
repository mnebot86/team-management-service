import mongoose from 'mongoose';

import { connectDB } from '../config/db';
import { DeptChart } from '../core/features/deptChart/deptChart.model';
import { Team } from '../core/features/team/team.model';
import { requireSportVariant } from '../core/features/sports/sport.registry';
import { logger } from '../core/shared/utils/logger';

const SPORT_ID = 'football';
const VARIANT_ID = 'tackle-11';
const CHART_NAME = 'Kick Off';

const migrate = async (): Promise<void> => {
  await connectDB();

  const variant = requireSportVariant(SPORT_ID, VARIANT_ID);
  const template = variant.depthCharts.find(chart => chart.name === CHART_NAME);

  if (!template) {
    throw new Error(`${CHART_NAME} depth chart template was not found`);
  }

  const definitionsById = new Map(
    variant.positions.map(definition => [definition.id, definition]),
  );

  const teamIds = await Team.distinct('_id', {
    $or: [
      { sportId: SPORT_ID, sportVariantId: VARIANT_ID },
      { sportId: SPORT_ID, sportVariantId: { $exists: false } },
      { sportId: { $exists: false }, sport: /^football$/i },
    ],
  });

  const charts = await DeptChart.find({
    teamId: { $in: teamIds },
    name: CHART_NAME,
  });

  let updatedCharts = 0;

  for (const chart of charts) {
    let changed = chart.positions.length !== template.positionIds.length;

    const nextPositions = template.positionIds.map((positionId, index) => {
      const definition = definitionsById.get(positionId);

      if (!definition) {
        throw new Error(`Missing position definition: ${positionId}`);
      }

      const existing = chart.positions[index];

      if (
        !existing
        || existing.positionDefinitionId !== definition.id
        || existing.name !== definition.name
        || existing.shortName !== definition.shortName
        || existing.sortOrder !== index + 1
      ) {
        changed = true;
      }

      return {
        ...(existing?.toObject() ?? {}),
        positionDefinitionId: definition.id,
        name: definition.name,
        shortName: definition.shortName,
        sortOrder: index + 1,
        players: existing?.players ?? [],
      };
    });

    if (!changed) {
      continue;
    }

    chart.positions = nextPositions as typeof chart.positions;
    await chart.save();
    updatedCharts += 1;
  }

  logger.info(
    { matchedCharts: charts.length, updatedCharts },
    'Kick Off positions migrated',
  );
};

migrate()
  .catch((error) => {
    logger.error({ error }, 'Kick Off position migration failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

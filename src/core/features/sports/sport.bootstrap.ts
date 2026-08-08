import { Types } from 'mongoose';

import { DeptChart } from '../deptChart/deptChart.model';
import { requireSportVariant } from './sport.registry';

export const bootstrapTeamSport = async (
  teamId: Types.ObjectId,
  createdBy: Types.ObjectId,
  sportId: string,
  sportVariantId: string,
) => {
  const variant = requireSportVariant(sportId, sportVariantId);
  const positionsById = new Map(
    variant.positions.map((position) => [position.id, position]),
  );

  for (const template of variant.depthCharts) {
    const existingChart = await DeptChart.findOne({ teamId, name: template.name });

    if (existingChart) {
      const nextPositions = template.positionIds.map((positionId, index) => {
        const definition = positionsById.get(positionId);

        if (!definition) {
          throw new Error(`Missing position definition: ${positionId}`);
        }

        return {
          positionDefinitionId: definition.id,
          name: definition.name,
          shortName: definition.shortName,
          sortOrder: index + 1,
          players: existingChart.positions[index]?.players ?? [],
        };
      });

      existingChart.positions = nextPositions as typeof existingChart.positions;
      await existingChart.save();
      continue;
    }

    await DeptChart.create({
      teamId,
      name: template.name,
      positions: template.positionIds.map((positionId, index) => {
        const definition = positionsById.get(positionId);

        if (!definition) {
          throw new Error(`Missing position definition: ${positionId}`);
        }

        return {
          positionDefinitionId: definition.id,
          name: definition.name,
          shortName: definition.shortName,
          sortOrder: index + 1,
          players: [],
        };
      }),
      createdBy,
    });
  }
};

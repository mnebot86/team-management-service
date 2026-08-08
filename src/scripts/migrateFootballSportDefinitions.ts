import mongoose from 'mongoose';

import { connectDB } from '../config/db';
import { DeptChart } from '../core/features/deptChart/deptChart.model';
import { Team } from '../core/features/team/team.model';
import { TeamMember } from '../core/features/teamMember/teamMember.modal';
import { bootstrapTeamSport } from '../core/features/sports/sport.bootstrap';
import {
  getPositionDefinition,
  resolvePositionIds,
  UnsupportedSportError,
} from '../core/features/sports/sport.registry';

const SPORT_ID = 'football';
const VARIANT_ID = 'tackle-11';

const migrate = async () => {
  await connectDB();

  const teams = await Team.find({
    $or: [
      { sportId: SPORT_ID },
      { sportId: { $exists: false }, sport: /^football$/i },
    ],
  });

  for (const team of teams) {
    team.sport = 'Football';
    team.sportId = SPORT_ID;
    team.sportVariantId = VARIANT_ID;
    await team.save();

    const creator = await TeamMember.findOne({
      teamId: team._id,
      role: 'coach',
    }).select('profileId')
      ?? await TeamMember.findOne({
        teamId: team._id,
      }).select('profileId');

    if (creator) {
      await bootstrapTeamSport(
        team._id,
        creator.profileId,
        SPORT_ID,
        VARIANT_ID,
      );
    }

    const members = await TeamMember.find({ teamId: team._id });

    for (const member of members) {
      if ((member.positionIds?.length ?? 0) > 0 || !member.positions?.length) {
        continue;
      }

      try {
        member.positionIds = resolvePositionIds(
          SPORT_ID,
          VARIANT_ID,
          member.positions,
        );
        await member.save();
      } catch (error) {
        if (!(error instanceof UnsupportedSportError)) {
          throw error;
        }

        console.warn(
          `Skipped unsupported positions for member ${member._id.toString()}: ${error.message}`,
        );
      }
    }

    const charts = await DeptChart.find({ teamId: team._id });

    for (const chart of charts) {
      let changed = false;

      for (const position of chart.positions) {
        if (position.positionDefinitionId) {
          continue;
        }

        try {
          const [positionId] = resolvePositionIds(
            SPORT_ID,
            VARIANT_ID,
            [position.shortName || position.name],
          );

          if (positionId && getPositionDefinition(SPORT_ID, VARIANT_ID, positionId)) {
            position.positionDefinitionId = positionId;
            changed = true;
          }
        } catch (error) {
          if (!(error instanceof UnsupportedSportError)) {
            throw error;
          }
        }
      }

      if (changed) {
        await chart.save();
      }
    }
  }

  console.info(`Migrated ${teams.length} football teams.`);
};

migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

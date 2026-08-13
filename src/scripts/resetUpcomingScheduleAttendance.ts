import mongoose from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { connectDB } from '../config/db';
import { Schedule } from '../core/features/schedule/schedule.model';
import { logger } from '../core/shared/utils/logger';

dayjs.extend(utc);
dayjs.extend(timezone);

const scheduleTimezone = process.env.SCHEDULE_TIMEZONE || 'America/New_York';

const resetUpcomingScheduleAttendance = async (): Promise<void> => {
  await connectDB();

  const startOfToday = dayjs()
    .tz(scheduleTimezone)
    .startOf('day')
    .toDate();

  const result = await Schedule.updateMany(
    {
      startDate: { $gte: startOfToday },
      attendance: { $ne: [] },
    },
    {
      $set: { attendance: [] },
    },
  );

  logger.info(
    {
      startOfToday,
      timezone: scheduleTimezone,
      matchedSchedules: result.matchedCount,
      updatedSchedules: result.modifiedCount,
    },
    'Upcoming schedule attendance reset to not taken',
  );
};

resetUpcomingScheduleAttendance()
  .catch((error) => {
    logger.error({ error }, 'Failed to reset upcoming schedule attendance');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

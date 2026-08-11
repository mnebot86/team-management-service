import mongoose from 'mongoose';
import dayjs from 'dayjs';

import { connectDB } from '../config/db';
import { Schedule } from '../core/features/schedule/schedule.model';
import { logger } from '../core/shared/utils/logger';

const shouldRepairRecurringSeries = process.argv.includes(
  '--repair-recurring-cancellations',
);
const shouldMaterializeRecurringSeries = process.argv.includes(
  '--materialize-recurring-schedules',
);

const materializeRecurringSchedules = async (): Promise<{
  series: number;
  occurrences: number;
}> => {
  if (!shouldMaterializeRecurringSeries) {
    return { series: 0, occurrences: 0 };
  }

  const legacySchedules = await Schedule.find({
    'recurrence.isRecurring': true,
    $or: [
      { recurrenceGroupId: null },
      { recurrenceGroupId: { $exists: false } },
    ],
  });
  let occurrenceCount = 0;

  for (const schedule of legacySchedules) {
    const recurrenceGroupId = new mongoose.Types.ObjectId();
    const rangeEnd = schedule.recurrence.endDate
      ? new Date(schedule.recurrence.endDate)
      : dayjs(schedule.startDate).add(90, 'day').toDate();
    const currentDate = new Date(schedule.startDate);
    const frequency = schedule.recurrence.frequency ?? 'weekly';
    const daysOfWeek = schedule.recurrence.daysOfWeek.length
      ? schedule.recurrence.daysOfWeek
      : [currentDate.getDay()];
    const dayOfMonth = currentDate.getDate();
    const cancelledDateKeys = new Set(
      schedule.recurrence.cancelledDates.map(date =>
        dayjs(date).format('YYYY-MM-DD'),
      ),
    );
    const occurrences = [];

    while (currentDate <= rangeEnd) {
      const matches = frequency === 'daily'
        || (frequency === 'weekly' && daysOfWeek.includes(currentDate.getDay()))
        || (frequency === 'monthly' && currentDate.getDate() === dayOfMonth);

      if (matches) {
        const dateKey = dayjs(currentDate).format('YYYY-MM-DD');
        const override = [...schedule.recurrence.occurrenceOverrides]
          .reverse()
          .find(item => dayjs(item.occurrenceDate).format('YYYY-MM-DD') === dateKey);
        const changes = override?.changes ?? {};
        const isCancelled = schedule.status === 'cancelled'
          || cancelledDateKeys.has(dateKey)
          || Boolean(override?.isCancelled);

        occurrences.push({
          teamId: schedule.teamId,
          recurrenceGroupId,
          title: changes.title ?? schedule.title,
          description: changes.description ?? schedule.description,
          type: changes.type ?? schedule.type,
          opponentName: changes.opponentName ?? schedule.opponentName,
          isHomeGame: changes.isHomeGame ?? schedule.isHomeGame,
          startDate: changes.startDate ?? new Date(currentDate),
          startTime: changes.startTime ?? schedule.startTime,
          endTime: changes.endTime ?? schedule.endTime,
          location: {
            ...schedule.location,
            ...((changes.location as Record<string, unknown> | undefined) ?? {}),
          },
          recurrence: {
            isRecurring: true,
            frequency: schedule.recurrence.frequency,
            daysOfWeek: schedule.recurrence.daysOfWeek,
            endDate: schedule.recurrence.endDate,
            cancelledDates: [],
            occurrenceOverrides: [],
          },
          status: isCancelled ? 'cancelled' : 'scheduled',
          cancellationReason: override?.cancellationReason
            ?? schedule.cancellationReason
            ?? null,
          cancelledAt: isCancelled ? schedule.cancelledAt ?? new Date() : null,
          cancelledByUserId: isCancelled
            ? override?.updatedByUserId ?? schedule.cancelledByUserId ?? null
            : null,
          attendance: schedule.attendance,
          createdByUserId: schedule.createdByUserId,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (occurrences.length > 0) {
      await Schedule.insertMany(occurrences);
      await Schedule.deleteOne({ _id: schedule._id });
      occurrenceCount += occurrences.length;
    }
  }

  return { series: legacySchedules.length, occurrences: occurrenceCount };
};

const migrate = async (): Promise<void> => {
  await connectDB();

  const [
    statusResult,
    reasonResult,
    cancelledAtResult,
    cancelledByResult,
    cancelledDatesResult,
    occurrenceOverridesResult,
  ] =
    await Promise.all([
      Schedule.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'scheduled' } },
      ),
      Schedule.updateMany(
        { cancellationReason: { $exists: false } },
        { $set: { cancellationReason: null } },
      ),
      Schedule.updateMany(
        { cancelledAt: { $exists: false } },
        { $set: { cancelledAt: null } },
      ),
      Schedule.updateMany(
        { cancelledByUserId: { $exists: false } },
        { $set: { cancelledByUserId: null } },
      ),
      Schedule.updateMany(
        { 'recurrence.cancelledDates': { $exists: false } },
        { $set: { 'recurrence.cancelledDates': [] } },
      ),
      Schedule.updateMany(
        { 'recurrence.occurrenceOverrides': { $exists: false } },
        { $set: { 'recurrence.occurrenceOverrides': [] } },
      ),
    ]);

  const repairResult = shouldRepairRecurringSeries
    ? await Schedule.updateMany(
      {
        status: 'cancelled',
        'recurrence.isRecurring': true,
      },
      {
        $set: {
          status: 'scheduled',
          cancellationReason: null,
          cancelledAt: null,
          cancelledByUserId: null,
        },
      },
    )
    : null;
  const materialized = await materializeRecurringSchedules();

  logger.info(
    {
      status: statusResult.modifiedCount,
      cancellationReason: reasonResult.modifiedCount,
      cancelledAt: cancelledAtResult.modifiedCount,
      cancelledByUserId: cancelledByResult.modifiedCount,
      cancelledDates: cancelledDatesResult.modifiedCount,
      occurrenceOverrides: occurrenceOverridesResult.modifiedCount,
      repairedRecurringSeries: repairResult?.modifiedCount ?? 0,
      repairRequested: shouldRepairRecurringSeries,
      materializedSeries: materialized.series,
      materializedOccurrences: materialized.occurrences,
      materializationRequested: shouldMaterializeRecurringSeries,
    },
    'Schedule cancellation fields migrated',
  );
};

migrate()
  .catch((error) => {
    logger.error({ error }, 'Schedule cancellation field migration failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

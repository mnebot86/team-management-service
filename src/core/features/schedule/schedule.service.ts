import { Types } from 'mongoose';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { Schedule, ScheduleDocument } from './schedule.model';

dayjs.extend(utc);
dayjs.extend(timezone);

const scheduleTimezone = process.env.SCHEDULE_TIMEZONE || 'America/New_York';

const combineOccurrenceDateAndTime = (
  date: Date | string,
  time?: Date | string | null,
): Date => {
  if (!time) {
    return new Date(date);
  }

  const datePart = dayjs(date).tz(scheduleTimezone).format('YYYY-MM-DD');
  const timePart = dayjs(time).tz(scheduleTimezone).format('HH:mm:ss');

  return dayjs.tz(
    `${datePart} ${timePart}`,
    'YYYY-MM-DD HH:mm:ss',
    scheduleTimezone,
  ).toDate();
};

interface CreateScheduleInput {
  teamId: Types.ObjectId;
  title: string;
  description?: string;
  type: string;
  opponentName?: string | null;
  isHomeGame?: boolean | null;
  startDate: Date | string;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  location: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  recurrence?: {
    isRecurring?: boolean;
    frequency?: string | null;
    daysOfWeek?: number[];
    endDate?: Date | string | null;
  };
  createdByUserId: Types.ObjectId;
}

export interface UpdateScheduleInput {
  title?: string;
  description?: string;
  type?: string;
  opponentName?: string | null;
  isHomeGame?: boolean | null;
  startDate?: Date | string;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  location?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  recurrence?: {
    isRecurring?: boolean;
    frequency?: string | null;
    daysOfWeek?: number[];
    endDate?: Date | string | null;
  };
}

export const createSchedule = async (
  input: CreateScheduleInput,
): Promise<ScheduleDocument> => {
  const baseSchedule = {
    teamId: input.teamId,
    title: input.title,
    description: input.description,
    type: input.type,
    opponentName: input.opponentName ?? null,
    isHomeGame: input.isHomeGame ?? null,
    startDate: input.startDate,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    location: input.location,
    recurrence: {
      isRecurring: input.recurrence?.isRecurring ?? false,
      frequency: input.recurrence?.frequency ?? null,
      daysOfWeek: input.recurrence?.daysOfWeek ?? [],
      endDate: input.recurrence?.endDate ?? null,
      cancelledDates: [],
      occurrenceOverrides: [],
    },
    createdByUserId: input.createdByUserId,
  };

  if (!input.recurrence?.isRecurring) {
    return Schedule.create(baseSchedule);
  }

  const recurrenceGroupId = new Types.ObjectId();
  const rangeEnd = input.recurrence.endDate
    ? new Date(input.recurrence.endDate)
    : dayjs(input.startDate).add(90, 'day').toDate();
  const currentDate = new Date(input.startDate);
  const frequency = input.recurrence.frequency ?? 'weekly';
  const daysOfWeek = input.recurrence.daysOfWeek?.length
    ? input.recurrence.daysOfWeek
    : [currentDate.getDay()];
  const dayOfMonth = currentDate.getDate();
  const occurrences: (typeof baseSchedule & {
    recurrenceGroupId: Types.ObjectId;
    startDate: Date;
  })[] = [];

  while (currentDate <= rangeEnd) {
    const matches = frequency === 'daily'
      || (frequency === 'weekly' && daysOfWeek.includes(currentDate.getDay()))
      || (frequency === 'monthly' && currentDate.getDate() === dayOfMonth);

    if (matches) {
      occurrences.push({
        ...baseSchedule,
        recurrenceGroupId,
        startDate: new Date(currentDate),
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const createdSchedules = await Schedule.insertMany(occurrences);
  const firstSchedule = createdSchedules[0];

  if (!firstSchedule) {
    throw new Error('Recurring schedule did not generate any occurrences');
  }

  return firstSchedule as ScheduleDocument;
};

export const updateSchedule = async (
  scheduleId: Types.ObjectId,
  input: UpdateScheduleInput,
  occurrenceDate?: Date,
  updatedByUserId?: Types.ObjectId,
  updateSeries = false,
): Promise<ScheduleDocument | null> => {
  const target = await Schedule.findById(scheduleId);

  if (!target) {
    return null;
  }

  if (occurrenceDate && updatedByUserId) {
    if (target.recurrenceGroupId) {
      return updateScheduleDocument(scheduleId, input);
    }

    const changes = { ...input };
    delete changes.recurrence;

    return Schedule.findByIdAndUpdate(
      scheduleId,
      {
        $push: {
          'recurrence.occurrenceOverrides': {
            occurrenceDate,
            isCancelled: false,
            cancellationReason: null,
            changes,
            updatedByUserId,
            updatedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );
  }

  if (updateSeries && target.recurrenceGroupId) {
    const update = buildScheduleUpdate(input);
    await Schedule.updateMany(
      { recurrenceGroupId: target.recurrenceGroupId },
      update,
      { runValidators: true },
    );

    return Schedule.findById(scheduleId);
  }

  return updateScheduleDocument(scheduleId, input);
};

const buildScheduleUpdate = (
  input: UpdateScheduleInput,
): Record<string, unknown> => {
  const update: Record<string, unknown> = {};

  const scalarFields: (keyof Omit<UpdateScheduleInput, 'location' | 'recurrence'>)[] = [
    'title',
    'description',
    'type',
    'opponentName',
    'isHomeGame',
    'startDate',
    'startTime',
    'endTime',
  ];

  scalarFields.forEach((field) => {
    if (input[field] !== undefined) {
      update[field] = input[field];
    }
  });

  Object.entries(input.location ?? {}).forEach(([field, value]) => {
    if (value !== undefined) {
      update[`location.${field}`] = value;
    }
  });

  Object.entries(input.recurrence ?? {}).forEach(([field, value]) => {
    if (value !== undefined) {
      update[`recurrence.${field}`] = value;
    }
  });

  return update;
};

const updateScheduleDocument = (
  scheduleId: Types.ObjectId,
  input: UpdateScheduleInput,
): Promise<ScheduleDocument | null> => {
  return Schedule.findByIdAndUpdate(scheduleId, buildScheduleUpdate(input), {
    new: true,
    runValidators: true,
  });
};

export const cancelSchedule = async (
  scheduleId: Types.ObjectId,
  cancelledByUserId: Types.ObjectId,
  reason?: string,
  occurrenceDate?: Date,
  cancelSeries = false,
): Promise<ScheduleDocument | null> => {
  const target = await Schedule.findById(scheduleId);

  if (!target) {
    return null;
  }

  if (occurrenceDate) {
    if (target.recurrenceGroupId) {
      return Schedule.findByIdAndUpdate(
        scheduleId,
        {
          status: 'cancelled',
          cancellationReason: reason?.trim() || null,
          cancelledAt: new Date(),
          cancelledByUserId,
        },
        { new: true, runValidators: true },
      );
    }

    return Schedule.findByIdAndUpdate(
      scheduleId,
      {
        $set: {
          status: 'scheduled',
          cancellationReason: null,
          cancelledAt: null,
          cancelledByUserId: null,
        },
        $addToSet: { 'recurrence.cancelledDates': occurrenceDate },
        $push: {
          'recurrence.occurrenceOverrides': {
            occurrenceDate,
            isCancelled: true,
            cancellationReason: reason?.trim() || null,
            changes: {},
            updatedByUserId: cancelledByUserId,
            updatedAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
  }

  if (cancelSeries && target.recurrenceGroupId) {
    await Schedule.updateMany(
      { recurrenceGroupId: target.recurrenceGroupId },
      {
        status: 'cancelled',
        cancellationReason: reason?.trim() || null,
        cancelledAt: new Date(),
        cancelledByUserId,
      },
      { runValidators: true },
    );

    return Schedule.findById(scheduleId);
  }

  return Schedule.findByIdAndUpdate(
    scheduleId,
    {
      status: 'cancelled',
      cancellationReason: reason?.trim() || null,
      cancelledAt: new Date(),
      cancelledByUserId,
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

export const deleteSchedule = async (
  scheduleId: Types.ObjectId,
  deleteSeries = false,
): Promise<ScheduleDocument | null> => {
  const target = await Schedule.findById(scheduleId);

  if (!target) {
    return null;
  }

  if (deleteSeries && target.recurrenceGroupId) {
    await Schedule.deleteMany({ recurrenceGroupId: target.recurrenceGroupId });
  } else {
    await Schedule.findByIdAndDelete(scheduleId);
  }

  return target;
};

interface ScheduleSection {
  title: string;
  data: ScheduleOccurrence[];
}

interface ScheduleOccurrence {
  scheduleId: string;
  recurrenceDate: Date;
  title: string;
  description?: string;
  type: string;
  opponentName?: string | null;
  isHomeGame?: boolean | null;
  startDate: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  occurrenceStartDate: Date;
  status: 'scheduled' | 'cancelled';
  cancellationReason?: string | null;
  attendance?: ScheduleDocument['attendance'] | undefined;
  location: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export type SchedulePeriod = 'upcoming' | 'past';

const expandRecurringSchedules = (
  schedules: ScheduleDocument[],
): ScheduleOccurrence[] => {
  const occurrences: ScheduleOccurrence[] = [];

  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 90);

  schedules.forEach((schedule) => {
    if (!schedule.recurrence?.isRecurring || schedule.recurrenceGroupId) {
      occurrences.push({
        scheduleId: schedule._id.toString(),
        recurrenceDate: schedule.startDate,
        title: schedule.title ?? '',
        description: schedule.description,
        type: schedule.type ?? '',
        opponentName: schedule.opponentName,
        isHomeGame: schedule.isHomeGame,
        startDate: schedule.startDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        occurrenceStartDate: combineOccurrenceDateAndTime(
          schedule.startDate,
          schedule.startTime,
        ),
        status: schedule.status ?? 'scheduled',
        cancellationReason: schedule.cancellationReason ?? null,
        attendance: schedule.attendance,
        location: schedule.location,
      });

      return;
    }

    const recurrenceEndDate = schedule.recurrence.endDate
      ? new Date(schedule.recurrence.endDate)
      : rangeEnd;

    const effectiveEndDate = recurrenceEndDate < rangeEnd
      ? recurrenceEndDate
      : rangeEnd;

    const currentDate = new Date(schedule.startDate);
    const recurrenceFrequency = schedule.recurrence.frequency ?? 'weekly';
    const recurrenceDays = schedule.recurrence.daysOfWeek?.length > 0
      ? schedule.recurrence.daysOfWeek
      : [currentDate.getDay()];
    const recurrenceDayOfMonth = currentDate.getDate();
    const cancelledDateKeys = new Set(
      (schedule.recurrence.cancelledDates ?? []).map((date) =>
        dayjs(date).format('YYYY-MM-DD'),
      ),
    );
    const overridesByDate = new Map<string, ScheduleDocument['recurrence']['occurrenceOverrides'][number]>();

    (schedule.recurrence.occurrenceOverrides ?? []).forEach((override) => {
      overridesByDate.set(dayjs(override.occurrenceDate).format('YYYY-MM-DD'), override);
    });

    while (currentDate <= effectiveEndDate) {
      const isOccurrence = recurrenceFrequency === 'daily'
        || (recurrenceFrequency === 'weekly'
          && recurrenceDays.includes(currentDate.getDay()))
        || (recurrenceFrequency === 'monthly'
          && currentDate.getDate() === recurrenceDayOfMonth);

      if (isOccurrence) {
        const occurrenceKey = dayjs(currentDate).format('YYYY-MM-DD');
        const override = overridesByDate.get(occurrenceKey);
        const changes = override?.changes ?? {};
        const occurrenceDate = changes.startDate
          ? new Date(changes.startDate as Date | string)
          : new Date(currentDate);
        const occurrenceTime = changes.startTime !== undefined
          ? changes.startTime as Date | string | null
          : schedule.startTime;
        const isCancelled = Boolean(override?.isCancelled)
          || cancelledDateKeys.has(occurrenceKey);

        occurrences.push({
          scheduleId: schedule._id.toString(),
          recurrenceDate: new Date(currentDate),
          title: (changes.title as string | undefined) ?? schedule.title ?? '',
          description: (changes.description as string | undefined) ?? schedule.description,
          type: (changes.type as string | undefined) ?? schedule.type ?? '',
          opponentName: changes.opponentName !== undefined
            ? changes.opponentName as string | null
            : schedule.opponentName,
          isHomeGame: changes.isHomeGame !== undefined
            ? changes.isHomeGame as boolean | null
            : schedule.isHomeGame,
          startDate: occurrenceDate,
          startTime: occurrenceTime ? new Date(occurrenceTime) : null,
          endTime: changes.endTime !== undefined
            ? (changes.endTime ? new Date(changes.endTime as Date | string) : null)
            : schedule.endTime,
          occurrenceStartDate: combineOccurrenceDateAndTime(
            occurrenceDate,
            occurrenceTime,
          ),
          status: isCancelled ? 'cancelled' : (schedule.status ?? 'scheduled'),
          cancellationReason: isCancelled
            ? (override?.cancellationReason ?? null)
            : (schedule.cancellationReason ?? null),
          attendance: schedule.attendance,
          location: {
            ...schedule.location,
            ...((changes.location as UpdateScheduleInput['location']) ?? {}),
          },
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return occurrences.sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );
};

export const getTeamSchedule = async (
  teamId: Types.ObjectId,
  period: SchedulePeriod = 'upcoming',
): Promise<ScheduleSection[]> => {
  const schedules = await Schedule.find({ teamId })
    .sort({ startDate: 1 });

  const events = expandRecurringSchedules(schedules);

  const now = new Date();

  const zonedNow = dayjs(now).tz(scheduleTimezone);
  const startOfToday = zonedNow.startOf('day').toDate();
  const endOfToday = zonedNow.endOf('day').toDate();
  const endOfWeek = zonedNow
    .add(7 - zonedNow.day(), 'day')
    .endOf('day')
    .toDate();

  if (period === 'past') {
    const past = events
      .filter((event) => event.occurrenceStartDate < now)
      .sort(
        (a, b) =>
          b.occurrenceStartDate.getTime() - a.occurrenceStartDate.getTime(),
      );

    return past.length > 0
      ? [{ title: 'Past', data: past }]
      : [];
  }

  const today = events.filter((event) => {
    const eventDate = event.occurrenceStartDate;

    return eventDate >= startOfToday && eventDate <= endOfToday;
  });

  const thisWeek = events.filter((event) => {
    const eventDate = event.occurrenceStartDate;

    return eventDate > endOfToday && eventDate <= endOfWeek;
  });

  const upcoming = events.filter((event) => {
    const eventDate = event.occurrenceStartDate;

    return eventDate > endOfWeek;
  });

  return [
    {
      title: 'Today',
      data: today,
    },
    {
      title: 'This Week',
      data: thisWeek,
    },
    {
      title: 'Upcoming',
      data: upcoming,
    },
  ].filter(section => section.data.length > 0);
};

export const getScheduleById = async (
  scheduleId: Types.ObjectId,
): Promise<ScheduleDocument | null> => {
  return Schedule.findById(scheduleId);
};

export const getNextPractice = async (
  teamId: Types.ObjectId,
): Promise<ScheduleOccurrence | null> => {
  const schedules = await Schedule.find({
    teamId,
    type: 'practice',
    status: { $ne: 'cancelled' },
  });

  const now = new Date();

  const occurrences = expandRecurringSchedules(schedules);

  return (
    occurrences.find(
      (occurrence) => occurrence.occurrenceStartDate >= now
        && occurrence.status !== 'cancelled',
    ) ?? null
  );
};

export const getLastPractice = async (
  teamId: Types.ObjectId,
): Promise<{
  present: number;
  absent: number;
  total: number;
}> => {
  const schedules = await Schedule.find({
    teamId,
    type: 'practice',
    status: { $ne: 'cancelled' },
  });

  const now = new Date();
  const endOfToday = dayjs(now)
    .tz(scheduleTimezone)
    .endOf('day')
    .toDate();

  const occurrences = expandRecurringSchedules(schedules)
    .filter((occurrence) => occurrence.occurrenceStartDate <= endOfToday
      && occurrence.status !== 'cancelled')
    .sort(
      (a, b) =>
        b.occurrenceStartDate.getTime() - a.occurrenceStartDate.getTime(),
    );

  const lastPractice = occurrences[0];

  if (!lastPractice) {
    return {
      present: 0,
      absent: 0,
      total: 0,
    };
  }

  const attendance = lastPractice.attendance ?? [];

  const present = attendance.filter(
    ({ status }) => status === 'present',
  ).length;

  const absent = attendance.filter(
    ({ status }) => status === 'absent',
  ).length;

  const total = attendance.length;

  return {
    present,
    absent,
    total,
  };
};

export const getPlayerAttendance = async (
  profileId: Types.ObjectId,
): Promise<{
  present: number;
  late: number;
  absent: number;
  total: number;
}> => {
  const schedules = await Schedule.find({
    type: 'practice',
    status: { $ne: 'cancelled' },
    'attendance.profileId': profileId,
  });

  let present = 0;
  let late = 0;
  let absent = 0;

  schedules.forEach((schedule) => {
    schedule.attendance.forEach((record) => {
      if (!record.profileId.equals(profileId)) {
        return;
      }

      switch (record.status) {
        case 'present':
          present += 1;
          break;
        case 'late':
          late += 1;
          break;
        case 'absent':
          absent += 1;
          break;
      }
    });
  });

  return {
    present,
    late,
    absent,
    total: present + late + absent,
  };
};

export const getNextGame = async (
  teamId: Types.ObjectId,
): Promise<ScheduleOccurrence | null> => {
  const schedules = await Schedule.find({
    teamId,
    type: 'game',
    status: { $ne: 'cancelled' },
  });

  const now = new Date();

  const occurrences = expandRecurringSchedules(schedules);

  return (
    occurrences.find(
      (occurrence) => occurrence.occurrenceStartDate >= now
        && occurrence.status !== 'cancelled',
    ) ?? null
  );
};

export const updateAttendance = async (
  scheduleId: Types.ObjectId,
  attendance: ScheduleDocument['attendance'],
): Promise<ScheduleDocument | null> => {
  return Schedule.findByIdAndUpdate(
    scheduleId,
    {
      attendance,
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

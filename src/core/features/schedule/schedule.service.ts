import { Types } from 'mongoose';

import dayjs from 'dayjs';

import { Schedule, ScheduleDocument } from './schedule.model';

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

export const createSchedule = async (
  input: CreateScheduleInput,
): Promise<ScheduleDocument> => {
  return Schedule.create({
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
    },
    createdByUserId: input.createdByUserId,
  });
};


interface ScheduleSection {
  title: string;
  data: ScheduleOccurrence[];
}

interface ScheduleOccurrence {
  scheduleId: string;
  title: string;
  description?: string;
  type: string;
  opponentName?: string | null;
  isHomeGame?: boolean | null;
  startDate: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  occurrenceStartDate: Date;
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
    if (!schedule.recurrence?.isRecurring) {
      occurrences.push({
        scheduleId: schedule._id.toString(),
        title: schedule.title ?? '',
        description: schedule.description,
        type: schedule.type ?? '',
        opponentName: schedule.opponentName,
        isHomeGame: schedule.isHomeGame,
        startDate: schedule.startDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        occurrenceStartDate: schedule.startTime
          ? dayjs(schedule.startDate)
            .hour(dayjs(schedule.startTime).hour())
            .minute(dayjs(schedule.startTime).minute())
            .second(0)
            .millisecond(0)
            .toDate()
          : schedule.startDate,
        attendance: undefined,
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

    while (currentDate <= effectiveEndDate) {
      const isOccurrence = recurrenceFrequency === 'daily'
        || (recurrenceFrequency === 'weekly'
          && recurrenceDays.includes(currentDate.getDay()))
        || (recurrenceFrequency === 'monthly'
          && currentDate.getDate() === recurrenceDayOfMonth);

      if (isOccurrence) {
        occurrences.push({
          scheduleId: schedule._id.toString(),
          title: schedule.title ?? '',
          description: schedule.description,
          type: schedule.type ?? '',
          opponentName: schedule.opponentName,
          isHomeGame: schedule.isHomeGame,
          startDate: new Date(currentDate),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          occurrenceStartDate: schedule.startTime
            ? dayjs(currentDate)
              .hour(dayjs(schedule.startTime).hour())
              .minute(dayjs(schedule.startTime).minute())
              .second(0)
              .millisecond(0)
              .toDate()
            : new Date(currentDate),
          attendance: undefined,
          location: schedule.location,
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

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

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

    return eventDate >= now && eventDate <= endOfToday;
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
  });

  const now = new Date();

  const occurrences = expandRecurringSchedules(schedules);

  return (
    occurrences.find(
      (occurrence) => occurrence.occurrenceStartDate >= now,
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
  });

  const now = new Date();
  const endOfToday = new Date(now);

  endOfToday.setHours(23, 59, 59, 999);

  const occurrences = expandRecurringSchedules(schedules)
    .filter((occurrence) => occurrence.occurrenceStartDate <= endOfToday)
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
  });

  const now = new Date();

  const occurrences = expandRecurringSchedules(schedules);

  return (
    occurrences.find(
      (occurrence) => occurrence.occurrenceStartDate >= now,
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

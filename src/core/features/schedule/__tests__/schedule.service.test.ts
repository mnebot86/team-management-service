import { Types } from 'mongoose';

import {
  cancelSchedule,
  getLastPractice,
  getNextPractice,
  getTeamSchedule,
  updateSchedule,
} from '../schedule.service';
import { Schedule } from '../schedule.model';

jest.mock('../schedule.model', () => ({
  Schedule: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
  },
}));

describe('schedule service', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-10T10:00:00.000Z'));
    jest.clearAllMocks();
    (Schedule.findById as jest.Mock).mockResolvedValue({
      recurrenceGroupId: null,
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('puts today events into the Today section when they start later today', async () => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(now.getHours() + 2, 0, 0, 0);

    const teamId = new Types.ObjectId();

    const sortMock = jest.fn().mockResolvedValueOnce([
      {
        _id: new Types.ObjectId(),
        teamId,
        title: 'Today practice',
        description: null,
        type: 'practice',
        opponentName: null,
        isHomeGame: true,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        startTime: todayStart,
        endTime: null,
        location: {},
        recurrence: { isRecurring: false },
        attendance: [],
      },
    ]);

    (Schedule.find as jest.Mock).mockReturnValueOnce({ sort: sortMock });

    const sections = await getTeamSchedule(teamId);

    expect(sections.find((section) => section.title === 'Today')?.data).toHaveLength(1);
    expect(sections.find((section) => section.title === 'Upcoming')?.data ?? []).toHaveLength(0);
  });

  it('keeps events visible in Today after their start time has passed', async () => {
    const now = new Date();
    const earlierToday = new Date(now);
    earlierToday.setHours(now.getHours() - 2, 0, 0, 0);
    const teamId = new Types.ObjectId();
    const sortMock = jest.fn().mockResolvedValueOnce([
      {
        _id: new Types.ObjectId(),
        teamId,
        title: 'Morning practice',
        description: '',
        type: 'practice',
        opponentName: null,
        isHomeGame: null,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        startTime: earlierToday,
        endTime: null,
        status: 'scheduled',
        location: {},
        recurrence: { isRecurring: false },
        attendance: [],
      },
    ]);
    (Schedule.find as jest.Mock).mockReturnValueOnce({ sort: sortMock });

    const sections = await getTeamSchedule(teamId);

    expect(sections.find(section => section.title === 'Today')?.data)
      .toHaveLength(1);
  });

  it('filters team schedule entries by schedule type', async () => {
    const teamId = new Types.ObjectId();
    const sortMock = jest.fn().mockResolvedValueOnce([
      {
        _id: new Types.ObjectId(),
        teamId,
        title: 'Practice session',
        description: '',
        type: 'practice',
        opponentName: null,
        isHomeGame: null,
        startDate: new Date('2026-08-12T12:00:00.000Z'),
        startTime: new Date('2026-08-12T12:00:00.000Z'),
        endTime: null,
        status: 'scheduled',
        location: {},
        recurrence: { isRecurring: false },
        attendance: [],
      },
      {
        _id: new Types.ObjectId(),
        teamId,
        title: 'Game night',
        description: '',
        type: 'game',
        opponentName: 'Rivals',
        isHomeGame: true,
        startDate: new Date('2026-08-13T12:00:00.000Z'),
        startTime: new Date('2026-08-13T12:00:00.000Z'),
        endTime: null,
        status: 'scheduled',
        location: {},
        recurrence: { isRecurring: false },
        attendance: [],
      },
    ]);
    (Schedule.find as jest.Mock).mockReturnValueOnce({ sort: sortMock });

    const sections = await getTeamSchedule(teamId, 'upcoming', 'practice');

    expect(sections.flatMap(section => section.data)).toEqual([
      expect.objectContaining({ title: 'Practice session', type: 'practice' }),
    ]);
    expect(sections.flatMap(section => section.data).every(item => item.type === 'practice')).toBe(true);
  });

  it('returns a materialized recurring occurrence scheduled for today', async () => {
    // This is August 11 in New York, but already August 12 in UTC.
    jest.setSystemTime(new Date('2026-08-12T01:00:00.000Z'));
    const teamId = new Types.ObjectId('6a715376c9ba79300925ee65');
    const sortMock = jest.fn().mockResolvedValueOnce([
      {
        _id: new Types.ObjectId('6a7a83688d33b87e7ea2c0b8'),
        teamId,
        recurrenceGroupId: new Types.ObjectId('6a7a83688d33b87e7ea2c0b6'),
        title: 'Evening',
        description: '',
        type: 'practice',
        opponentName: null,
        isHomeGame: null,
        startDate: new Date('2026-08-11T19:04:10.823Z'),
        startTime: new Date('2026-08-10T22:00:16.000Z'),
        endTime: new Date('2026-08-11T00:00:22.000Z'),
        location: {},
        recurrence: {
          isRecurring: true,
          frequency: 'weekly',
          daysOfWeek: [1, 2, 3, 4],
          endDate: new Date('2026-10-29T19:04:50.000Z'),
          cancelledDates: [],
          occurrenceOverrides: [],
        },
        status: 'scheduled',
        cancellationReason: null,
        attendance: [],
      },
    ]);
    (Schedule.find as jest.Mock).mockReturnValueOnce({ sort: sortMock });

    const sections = await getTeamSchedule(teamId);

    expect(sections.find(section => section.title === 'Today')?.data)
      .toEqual([
        expect.objectContaining({
          scheduleId: '6a7a83688d33b87e7ea2c0b8',
          title: 'Evening',
        }),
      ]);
  });

  it('gets attendance from the latest stored practice occurrence', async () => {
    const teamId = new Types.ObjectId();
    const olderPractice = {
      startDate: new Date('2026-08-09T04:00:00.000Z'),
      startTime: new Date('2026-08-09T14:00:00.000Z'),
      attendance: [{ status: 'absent' }],
    };
    const latestMaterializedPractice = {
      recurrenceGroupId: new Types.ObjectId(),
      startDate: new Date('2026-08-10T04:00:00.000Z'),
      startTime: new Date('2026-08-10T09:00:00.000Z'),
      recurrence: { isRecurring: true },
      attendance: [
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'late' },
      ],
    };
    (Schedule.find as jest.Mock).mockResolvedValueOnce([
      olderPractice,
      latestMaterializedPractice,
    ]);

    await expect(getLastPractice(teamId)).resolves.toEqual({
      present: 2,
      absent: 1,
      total: 4,
    });
    expect(Schedule.find).toHaveBeenCalledWith(expect.objectContaining({
      teamId,
      type: 'practice',
      status: { $ne: 'cancelled' },
      startDate: { $lte: expect.any(Date) },
    }));
  });

  it('does not treat a practice later today as the last practice', async () => {
    const teamId = new Types.ObjectId();
    (Schedule.find as jest.Mock).mockResolvedValueOnce([
      {
        startDate: new Date('2026-08-09T04:00:00.000Z'),
        startTime: new Date('2026-08-09T14:00:00.000Z'),
        attendance: [{ status: 'present' }],
      },
      {
        startDate: new Date('2026-08-10T04:00:00.000Z'),
        startTime: new Date('2026-08-10T18:00:00.000Z'),
        attendance: [{ status: 'absent' }],
      },
    ]);

    await expect(getLastPractice(teamId)).resolves.toEqual({
      present: 1,
      absent: 0,
      total: 1,
    });
  });

  it('returns the earliest future materialized practice occurrence', async () => {
    const teamId = new Types.ObjectId();
    const laterId = new Types.ObjectId();
    const nextId = new Types.ObjectId();
    (Schedule.find as jest.Mock).mockResolvedValueOnce([
      {
        _id: laterId,
        startDate: new Date('2026-08-12T04:00:00.000Z'),
        startTime: new Date('2026-08-12T14:00:00.000Z'),
        status: 'scheduled',
        location: {},
      },
      {
        _id: nextId,
        startDate: new Date('2026-08-10T04:00:00.000Z'),
        startTime: new Date('2026-08-10T12:00:00.000Z'),
        status: 'scheduled',
        location: {},
      },
    ]);

    await expect(getNextPractice(teamId)).resolves.toEqual(
      expect.objectContaining({ scheduleId: nextId.toString() }),
    );
  });

  it('uses the stored status of each materialized recurring occurrence', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(12, 0, 0, 0);
    const cancelledDate = new Date(startDate);
    cancelledDate.setDate(cancelledDate.getDate() + 1);
    const finalDate = new Date(startDate);
    finalDate.setDate(finalDate.getDate() + 2);
    const teamId = new Types.ObjectId();
    const recurrenceGroupId = new Types.ObjectId();
    const occurrence = (date: Date, status: 'scheduled' | 'cancelled') => ({
      _id: new Types.ObjectId(),
      teamId,
      recurrenceGroupId,
      title: 'Daily practice',
      description: '',
      type: 'practice',
      opponentName: null,
      isHomeGame: null,
      startDate: date,
      startTime: null,
      endTime: null,
      status,
      cancellationReason: status === 'cancelled' ? 'Weather' : null,
      location: {},
      recurrence: { isRecurring: true },
      attendance: [],
    });

    const sortMock = jest.fn().mockResolvedValueOnce([
      occurrence(startDate, 'scheduled'),
      occurrence(cancelledDate, 'cancelled'),
      occurrence(finalDate, 'scheduled'),
    ]);
    (Schedule.find as jest.Mock).mockReturnValueOnce({ sort: sortMock });

    const sections = await getTeamSchedule(teamId);
    const occurrences = sections.flatMap(section => section.data);

    expect(occurrences).toHaveLength(3);
    expect(occurrences.filter(event => event.status === 'cancelled')).toHaveLength(1);
    expect(occurrences.filter(event => event.status === 'scheduled')).toHaveLength(2);
  });

  it('updates only supplied schedule and recurrence fields', async () => {
    const scheduleId = new Types.ObjectId();
    const updatedSchedule = { _id: scheduleId, title: 'Updated practice' };
    (Schedule.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(updatedSchedule);

    const result = await updateSchedule(scheduleId, {
      title: 'Updated practice',
      location: { city: 'Miami' },
      recurrence: { frequency: 'weekly', daysOfWeek: [1, 3] },
    });

    expect(Schedule.findByIdAndUpdate).toHaveBeenCalledWith(
      scheduleId,
      {
        title: 'Updated practice',
        'location.city': 'Miami',
        'recurrence.frequency': 'weekly',
        'recurrence.daysOfWeek': [1, 3],
      },
      { new: true, runValidators: true },
    );
    expect(result).toBe(updatedSchedule);
  });

  it('updates a materialized series without collapsing occurrence dates', async () => {
    const scheduleId = new Types.ObjectId();
    const recurrenceGroupId = new Types.ObjectId();
    (Schedule.findById as jest.Mock)
      .mockResolvedValueOnce({ _id: scheduleId, recurrenceGroupId })
      .mockResolvedValueOnce({ _id: scheduleId, recurrenceGroupId });

    await updateSchedule(
      scheduleId,
      {
        title: 'Updated series',
        startDate: new Date('2026-08-10T04:00:00.000Z'),
        startTime: new Date('2026-08-10T15:00:00.000Z'),
      },
      true,
    );

    expect(Schedule.updateMany).toHaveBeenCalledWith(
      { recurrenceGroupId },
      {
        title: 'Updated series',
        startTime: new Date('2026-08-10T15:00:00.000Z'),
      },
      { runValidators: true },
    );
  });

  it('cancels a schedule without deleting it', async () => {
    const scheduleId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const cancelledSchedule = { _id: scheduleId, status: 'cancelled' };
    (Schedule.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(cancelledSchedule);

    const result = await cancelSchedule(scheduleId, userId, 'Weather');

    expect(Schedule.findByIdAndUpdate).toHaveBeenCalledWith(
      scheduleId,
      expect.objectContaining({
        status: 'cancelled',
        cancellationReason: 'Weather',
        cancelledByUserId: userId,
        cancelledAt: expect.any(Date),
      }),
      { new: true, runValidators: true },
    );
    expect(result).toBe(cancelledSchedule);
  });

  it('cancels only the occurrence identified by the schedule ID', async () => {
    const scheduleId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const updatedSchedule = { _id: scheduleId, status: 'cancelled' };
    (Schedule.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(updatedSchedule);

    const result = await cancelSchedule(scheduleId, userId);

    expect(Schedule.findByIdAndUpdate).toHaveBeenCalledWith(
      scheduleId,
      expect.objectContaining({
        status: 'cancelled',
        cancellationReason: null,
        cancelledByUserId: userId,
        cancelledAt: expect.any(Date),
      }),
      { new: true, runValidators: true },
    );
    expect(result).toBe(updatedSchedule);
  });
});

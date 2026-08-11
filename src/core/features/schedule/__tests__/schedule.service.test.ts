import { Types } from 'mongoose';

import {
  cancelSchedule,
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

  it('marks only the matching recurring date as cancelled', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(12, 0, 0, 0);
    const cancelledDate = new Date(startDate);
    cancelledDate.setDate(cancelledDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);
    const teamId = new Types.ObjectId();

    const sortMock = jest.fn().mockResolvedValueOnce([
      {
        _id: new Types.ObjectId(),
        teamId,
        title: 'Daily practice',
        description: '',
        type: 'practice',
        opponentName: null,
        isHomeGame: null,
        startDate,
        startTime: null,
        endTime: null,
        status: 'scheduled',
        cancellationReason: null,
        location: {},
        recurrence: {
          isRecurring: true,
          frequency: 'daily',
          daysOfWeek: [],
          endDate,
          cancelledDates: [cancelledDate],
          occurrenceOverrides: [],
        },
        attendance: [],
      },
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

  it('cancels only one occurrence when an occurrence date is supplied', async () => {
    const scheduleId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const occurrenceDate = new Date('2026-08-17T00:00:00.000Z');
    const updatedSchedule = { _id: scheduleId, status: 'scheduled' };
    (Schedule.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(updatedSchedule);

    const result = await cancelSchedule(
      scheduleId,
      userId,
      undefined,
      occurrenceDate,
    );

    expect(Schedule.findByIdAndUpdate).toHaveBeenCalledWith(
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
          'recurrence.occurrenceOverrides': expect.objectContaining({
            occurrenceDate,
            isCancelled: true,
            cancellationReason: null,
            updatedByUserId: userId,
          }),
        },
      },
      { new: true, runValidators: true },
    );
    expect(result).toBe(updatedSchedule);
  });
});

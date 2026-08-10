import { Types } from 'mongoose';

import { getTeamSchedule } from '../schedule.service';
import { Schedule } from '../schedule.model';

jest.mock('../schedule.model', () => ({
  Schedule: {
    find: jest.fn(),
  },
}));

describe('schedule service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});

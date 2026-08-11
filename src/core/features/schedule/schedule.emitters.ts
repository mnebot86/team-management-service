import { getSocket } from '../../socket';
import { ScheduleDocument } from './schedule.model';

export const emitScheduleCreated = (
  teamId: string,
  schedule: ScheduleDocument,
): void => {
  getSocket()
    .to(`team:${teamId}`)
    .emit('schedule.created', schedule);
};

export const emitScheduleUpdated = (
  teamId: string,
  schedule: ScheduleDocument,
): void => {
  getSocket()
    .to(`team:${teamId}`)
    .emit('schedule.updated', schedule);
};

export const emitScheduleDeleted = (
  teamId: string,
  scheduleId: string,
  scope: 'occurrence' | 'series' = 'occurrence',
  recurrenceGroupId?: string,
): void => {
  getSocket()
    .to(`team:${teamId}`)
    .emit('schedule.deleted', { scheduleId, scope, recurrenceGroupId });
};

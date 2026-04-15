import pino from 'pino';
import { env } from '../../../config/env';

export const logger = pino({
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
    },
  }),
});

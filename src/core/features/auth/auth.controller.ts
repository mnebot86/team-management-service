import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from './auth.service';
import { sendError, sendSuccess } from '../../shared/utils/response';
import { MONGO_ERRORS } from '../../constants/mongoErrors';
import { REGEX } from '../../constants/regex';
import { validateWithRegex } from '../../shared/utils/regexValidator';
import { logger } from '../../shared/utils/logger';
import { MongoServerError } from 'mongodb';
import { validatePassword } from '../../shared/utils/passwordValidator';

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const emailTrimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const passwordTrimmed = typeof password === 'string' ? password.trim() : '';

  if (!emailTrimmed) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'email is required');
  }

  if (!validateWithRegex(emailTrimmed, REGEX.EMAIL)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'email is invalid');
  }

  if (!passwordTrimmed) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'password is required');
  }

  const passwordValidation = validatePassword(passwordTrimmed);

  if (!passwordValidation.valid) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      passwordValidation.message || 'Invalid password'
    );
  }

  try {
    const user = await authService.register({
      email: emailTrimmed,
      password: passwordTrimmed,
    });

    return sendSuccess(res, StatusCodes.CREATED, user, 'User registered successfully');
  } catch (error: unknown) {
    if (error instanceof MongoServerError && error.code === MONGO_ERRORS.DUPLICATE_KEY) {
      const fields = error.keyValue ? Object.keys(error.keyValue).join(', ') : 'field';

      return sendError(
        res,
        StatusCodes.CONFLICT,
        `User with ${fields} already exists`
      );
    }

    logger.error({ err: error }, 'Register Error');

    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to register user', error);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const emailTrimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const passwordTrimmed = typeof password === 'string' ? password.trim() : '';

  if (!emailTrimmed) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'email is required');
  }

  if (!validateWithRegex(emailTrimmed, REGEX.EMAIL)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'email is invalid');
  }

  if (!passwordTrimmed) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'password is required');
  }

  try {
    const user = await authService.login({
      email: emailTrimmed,
      password: passwordTrimmed,
    });

    return sendSuccess(res, StatusCodes.OK, user, 'User logged in successfully');
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return sendError(
        res,
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password',
      );
    }

    logger.error({ err: error }, 'Login Error');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to login user',
      error,
    );
  }
};

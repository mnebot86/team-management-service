import request from 'supertest';
import app from '../../../../app';
import { StatusCodes } from 'http-status-codes';
import { connectDB } from '../../../../config/db';
import mongoose from 'mongoose';
import { User } from '../../user/user.model';

describe('Auth API - Register', () => {
  const testUser = {
    email: 'testuser@example.com',
    password: 'Password1!',
  };

  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await User.deleteMany({ email: testUser.email });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should register a user successfully', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.token).toBeDefined();
  });

  it('should not allow duplicate email registration', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/already exists/i);
  });

  it('should return error for invalid email format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'invalid-email', password: 'Password1!' });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.success).toBe(false);
  });

  it('should return error when password is missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test2@example.com' });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.success).toBe(false);
  });
});

describe('Auth API - Login', () => {
  const testUser = {
    email: 'testuser@example.com',
    password: 'Password1!',
  };

  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await User.deleteMany({ email: testUser.email });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should login a user successfully', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(testUser);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.token).toBeDefined();
  });

  it('should return error for invalid password', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/invalid email or password/i);
  });

  it('should return error when email is missing on login', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Password1!' });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/email is required/i);
  });
});

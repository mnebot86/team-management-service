import request from 'supertest';
import app from '../../../../app';
import { Team } from '../team.model';
import { StatusCodes } from 'http-status-codes';
import { connectDB } from '../../../../config/db';
import mongoose from 'mongoose';

describe('Team API - Create Team', () => {
  const testTeam = {
    name: 'Test Jets',
    ageGroup: '11U',
    sport: 'football',
  };

  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await Team.deleteMany({ name: testTeam.name });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should create a team successfully', async () => {
    const response = await request(app)
      .post('/api/v1/teams')
      .send(testTeam);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.name).toBe(testTeam.name);
  });

  it('should not allow duplicate team creation', async () => {
    await request(app).post('/api/v1/teams').send(testTeam);

    const response = await request(app)
      .post('/api/v1/teams')
      .send(testTeam);

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/already exists/i);
  });

  it('should return validation error when name is missing', async () => {
    const response = await request(app)
      .post('/api/v1/teams')
      .send({ ageGroup: '11U' });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/name/i);
  });
})

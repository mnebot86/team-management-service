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

describe('Team API - Get Team', () => {
  let createdTeamId: string;

  const testTeam = {
    name: 'Fetch Jets',
    ageGroup: '12U',
    sport: 'football',
  };

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/v1/teams')
      .send(testTeam);

    createdTeamId = response.body.data._id;
  });

  afterAll(async () => {
    await Team.deleteMany({ name: testTeam.name });
  });

  it('should fetch a team successfully', async () => {
    const response = await request(app)
      .get(`/api/v1/teams/${createdTeamId}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(createdTeamId);
  });

  it('should return 404 if team not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/v1/teams/${fakeId}`);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 for invalid teamId', async () => {
    const response = await request(app)
      .get('/api/v1/teams/invalid-id');

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.success).toBe(false);
  });
});

describe('Team API - Get Teams (List)', () => {
  const teams = [
    { name: 'List Jets 1', ageGroup: '10U', sport: 'football' },
    { name: 'List Jets 2', ageGroup: '11U', sport: 'football' },
  ];

  beforeAll(async () => {
    for (const team of teams) {
      await request(app).post('/api/v1/teams').send(team);
    }
  });

  afterAll(async () => {
    await Team.deleteMany({ name: { $in: teams.map(t => t.name) } });
  });

  it('should fetch all teams successfully', async () => {
    const response = await request(app).get('/api/v1/teams');

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('should include created teams in the list', async () => {
    const response = await request(app).get('/api/v1/teams');

    const names = response.body.data.map((t: { name: string }) => t.name);

    expect(names).toEqual(expect.arrayContaining(teams.map(t => t.name)));
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

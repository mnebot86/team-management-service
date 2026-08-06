import request from 'supertest';
import app from '../../../../app';
import { Team } from '../team.model';
import { User } from '../../user/user.model';
import { TeamMember } from '../../teamMember/teamMember.modal';
import { StatusCodes } from 'http-status-codes';
import { connectDB } from '../../../../config/db';
import mongoose from 'mongoose';

describe('Team API - Create Team', () => {
  const testTeam = {
    name: 'Test Jets',
    ageGroup: '11U',
    sport: 'football',
  };

  let token: string;

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test-create@example.com',
        password: 'Password1!'
      });

    token = res.body.data.token;
  });

  afterEach(async () => {
    await Team.deleteMany({ name: testTeam.name });
    await User.deleteMany({});
  });

  it('should create a team successfully', async () => {
    const response = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send(testTeam);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.name).toBe(testTeam.name);
  });

  it('should assign the creator as a coach when creating a team', async () => {
    const response = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send(testTeam);

    const teamMember = await TeamMember.findOne({ teamId: response.body.data._id });

    expect(teamMember).not.toBeNull();
    expect(teamMember?.role).toBe('coach');
  });

  it('should not allow duplicate team creation', async () => {
    await request(app).post('/api/v1/teams').set('Authorization', `Bearer ${token}`).send(testTeam);

    const response = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send(testTeam);

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/already exists/i);
  });

  it('should return validation error when name is missing', async () => {
    const response = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`)
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

  let token: string;

  beforeAll(async () => {
    const authRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test-get@example.com',
        password: 'Password1!'
      });

    token = authRes.body.data.token;

    const response = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send(testTeam);

    createdTeamId = response.body.data._id;
  });

  afterAll(async () => {
    await Team.deleteMany({ name: testTeam.name });
    await User.deleteMany({});
  });

  it('should fetch a team successfully', async () => {
    const response = await request(app)
      .get(`/api/v1/teams/${createdTeamId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(createdTeamId);
  });

  it('should return 404 if team not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/v1/teams/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 for invalid teamId', async () => {
    const response = await request(app)
      .get('/api/v1/teams/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.success).toBe(false);
  });
});

describe('Team API - Get Teams (List)', () => {
  const teams = [
    { name: 'List Jets 1', ageGroup: '10U', sport: 'football' },
    { name: 'List Jets 2', ageGroup: '11U', sport: 'football' },
  ];

  let token: string;

  beforeAll(async () => {
    const authRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test-list@example.com',
        password: 'Password1!'
      });

    token = authRes.body.data.token;

    for (const team of teams) {
      await request(app)
        .post('/api/v1/teams')
        .set('Authorization', `Bearer ${token}`)
        .send(team);
    }
  });

  afterAll(async () => {
    await Team.deleteMany({ name: { $in: teams.map(t => t.name) } });
    await User.deleteMany({});
  });

  it('should fetch all teams successfully', async () => {
    const response = await request(app)
      .get('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('should include created teams in the list', async () => {
    const response = await request(app)
      .get('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`);

    const names = response.body.data.map((t: { name: string }) => t.name);

    expect(names).toEqual(expect.arrayContaining(teams.map(t => t.name)));
  });
});

describe('Team API - Update & Delete Team', () => {
  const testTeam = {
    name: 'Update Jets',
    ageGroup: '13U',
    sport: 'football',
  };

  let token: string;
  let teamId: string;

  beforeEach(async () => {
    const authRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `test-update-${Date.now()}@example.com`,
        password: 'Password1!'
      });

    token = authRes.body.data.token;

    const createRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send(testTeam);

    teamId = createRes.body.data._id;
  });

  afterEach(async () => {
    await Team.deleteMany({ name: { $regex: 'Jets' } });
    await User.deleteMany({});
  });

  it('should update a team successfully', async () => {
    const response = await request(app)
      .put(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Jets' });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Updated Jets');
  });

  it('should forbid update for player role', async () => {
    // create second user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'player@example.com', password: 'Password1!' });

    const playerToken = userRes.body.data.token;
    const playerId = userRes.body.data.user._id;

    // add player to team
    await request(app)
      .post(`/api/v1/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: playerId, role: 'player' });

    const response = await request(app)
      .put(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ name: 'Hacked Name' });

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
  });

  it('should return 404 when updating non-owned or non-existing team', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/v1/teams/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nope' });

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  it('should delete a team successfully', async () => {
    const response = await request(app)
      .delete(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
  });

  it('should forbid delete for coach role', async () => {
    // create coach user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'coach@example.com', password: 'Password1!' });

    const coachToken = userRes.body.data.token;
    const coachId = userRes.body.data.user._id;

    // add coach to team
    await request(app)
      .post(`/api/v1/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: coachId, role: 'coach' });

    const response = await request(app)
      .delete(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${coachToken}`);

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
  });

  it('should return 404 when deleting a non-existing team', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/v1/teams/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });
});

describe('Team API - Members', () => {
  let token: string;
  let teamId: string;
  let memberId: string;

  beforeAll(async () => {
    const authRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'members@example.com', password: 'Password1!' });

    token = authRes.body.data.token;

    const createRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Members Team', ageGroup: '14U', sport: 'football' });

    teamId = createRes.body.data._id;

    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'member@example.com', password: 'Password1!' });

    memberId = userRes.body.data.user._id;
  });

  afterAll(async () => {
    await Team.deleteMany({ name: 'Members Team' });
    await User.deleteMany({});
  });

  it('should add a member to team', async () => {
    const response = await request(app)
      .post(`/api/v1/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberId, role: 'player' });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data.members.length).toBeGreaterThan(0);
  });

  it('should remove a member from team', async () => {
    const response = await request(app)
      .delete(`/api/v1/teams/${teamId}/members/${memberId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

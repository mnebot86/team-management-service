type TeamMember = {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'coach' | 'player';
};
import request from 'supertest';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import app from '../../../../app';
import { Invite } from '../invite.model';
import { Team } from '../../team/team.model';
import { User } from '../../user/user.model';

describe('Invite API', () => {
  let ownerToken: string;
  let ownerEmail: string;
  let teamId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI as string);
    }

    ownerEmail = 'owner@example.com';

    const authRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: ownerEmail, password: 'Password1!' });

    ownerToken = authRes.body.data.token;

    const teamRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Invite Team', ageGroup: '12U', sport: 'football' });

    teamId = teamRes.body.data._id;
  });

  afterAll(async () => {
    await Invite.deleteMany({});
    await Team.deleteMany({ name: 'Invite Team' });
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('should create an invite', async () => {
    const email = `player1_${Date.now()}@example.com`;
    const response = await request(app)
      .post(`/api/v1/invites/${teamId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email, role: 'player' });

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(email);
  });

  it('should not create duplicate pending invite', async () => {
    const email = `dup_${Date.now()}@example.com`;
    await request(app)
      .post(`/api/v1/invites/${teamId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email, role: 'player' });

    const response = await request(app)
      .post(`/api/v1/invites/${teamId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email, role: 'player' });

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.data.email).toBe(email);
  });

  it('should fetch invites for user', async () => {
    const userEmail = `fetch_${Date.now()}@example.com`;

    await request(app)
      .post(`/api/v1/invites/${teamId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: userEmail, role: 'player' });

    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: userEmail, password: 'Password1!' });

    const userToken = userRes.body.data.token;

    const response = await request(app)
      .get('/api/v1/invites')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('should accept invite and add user to team', async () => {
    const email = `accept_${Date.now()}@example.com`;

    const inviteRes = await request(app)
      .post(`/api/v1/invites/${teamId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email, role: 'player' });

    const inviteId = inviteRes.body.data._id;

    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Password1!' });

    const userToken = userRes.body.data.token;

    const response = await request(app)
      .post(`/api/v1/invites/${inviteId}/accept`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);

    const team = await Team.findById(teamId);

    const isMember = team?.members?.some(
      (m: TeamMember) => m.userId.toString() === userRes.body.data.user._id
    ) ?? false;

    expect(isMember).toBe(true);
  });

  it('should not accept invalid invite', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `fake_${Date.now()}@example.com`, password: 'Password1!' });

    const token = userRes.body.data.token;

    const response = await request(app)
      .post(`/api/v1/invites/${fakeId}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });
});

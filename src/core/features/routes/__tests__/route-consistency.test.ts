import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../../app';
import { connectDB } from '../../../../config/db';
import { User } from '../../user/user.model';
import { Team } from '../../team/team.model';
import { Profile } from '../../profile/profile.model';

describe('static API routes', () => {
  let token: string;

  beforeAll(async () => {
    await connectDB();

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'route-consistency@example.com',
        password: 'Password1!',
      });

    token = response.body.data.token;
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: 'route-consistency@example.com' }),
      Team.deleteMany({ name: 'Route Test Team' }),
      Profile.deleteMany({ firstName: 'RouteSearch' }),
    ]);
    await mongoose.disconnect();
  });

  it('handles the active team count before the team ID route', async () => {
    await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Route Test Team',
        ageGroup: '12U',
        sportId: 'football',
        sportVariantId: 'tackle-11',
      });

    const response = await request(app)
      .get('/api/v1/teams/active-team-count')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ count: 1 });
  });

  it('handles profile search before the profile ID route', async () => {
    await request(app)
      .post('/api/v1/profiles/coach')
      .set('Authorization', `Bearer ${token}`)
      .field('firstName', 'RouteSearch')
      .field('lastName', 'Profile');

    const response = await request(app)
      .get('/api/v1/profiles/search')
      .query({ name: 'RouteSearch' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({ firstName: 'RouteSearch' }),
    ]);
  });
});

/**
 * API tests — User profile endpoints
 *   GET /api/users/me
 *   PUT /api/users/me
 */
import { api, signupAndAuth } from '../support/client';

describe('GET /api/users/me', () => {
  it('returns the current profile (200) for an authenticated user', async () => {
    const { user, cookie } = await signupAndAuth();
    const res = await api().get('/api/users/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      email: user.email.toLowerCase(),
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });

  it('requires authentication (401)', async () => {
    const res = await api().get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token found! Please log in and try again!');
  });
});

describe('PUT /api/users/me', () => {
  it('updates first + last name (200) and the change persists', async () => {
    const { cookie } = await signupAndAuth();

    const res = await api()
      .put('/api/users/me')
      .set('Cookie', cookie)
      .send({ firstName: 'Renamed', lastName: 'Person' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ firstName: 'Renamed', lastName: 'Person' });

    const me = await api().get('/api/users/me').set('Cookie', cookie);
    expect(me.body.data).toMatchObject({ firstName: 'Renamed', lastName: 'Person' });
  });

  it('requires a first name (422)', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .put('/api/users/me')
      .set('Cookie', cookie)
      .send({ firstName: '', lastName: 'Person' });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('First name is required!');
  });

  it('requires authentication (401)', async () => {
    const res = await api().put('/api/users/me').send({ firstName: 'X', lastName: 'Y' });
    expect(res.status).toBe(401);
  });
});

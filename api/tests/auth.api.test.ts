/**
 * API tests — Authentication endpoints
 *   POST /api/auth/signup
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   PUT  /api/auth/change-password
 *
 * Validates status codes, response bodies and the auth cookie contract.
 */
import { api, cookieFrom, signupAndAuth, uniqueUser } from '../support/client';

describe('POST /api/auth/signup', () => {
  it('registers a new user (201) and returns the profile + auth cookie', async () => {
    const user = uniqueUser();
    const res = await api().post('/api/auth/signup').send(user);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Signed up successfully and logged you in!',
      data: {
        email: user.email.toLowerCase(),
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    expect(res.body.data._id).toBeDefined();
    // Password must never be echoed back.
    expect(res.body.data.password).toBeUndefined();
    // An auth cookie is issued on signup (auto-login).
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a duplicate email (422)', async () => {
    const { user } = await signupAndAuth();
    const res = await api().post('/api/auth/signup').send(uniqueUser({ email: user.email }));

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('User already exist!');
  });

  it('rejects missing required fields (400)', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ email: uniqueUser().email, firstName: 'NoPassword' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Fill all required fields!');
  });

  it('rejects an invalid email format (422)', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send(uniqueUser({ email: 'not-an-email' }));

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid email format!');
  });

  it('rejects a weak password (422)', async () => {
    const res = await api().post('/api/auth/signup').send(uniqueUser({ password: 'weak' }));

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Please enter strong password!');
  });
});

describe('POST /api/auth/login', () => {
  it('authenticates valid credentials (200) and returns a cookie', async () => {
    const user = uniqueUser();
    await api().post('/api/auth/signup').send(user);

    const res = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User logged in successfully!');
    expect(res.body.data.email).toBe(user.email.toLowerCase());
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a wrong password (401)', async () => {
    const user = uniqueUser();
    await api().post('/api/auth/signup').send(user);

    const res = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPass9!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials!');
  });

  it('rejects an unknown user (401)', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: uniqueUser().email, password: 'Passw0rd!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials!');
  });
});

describe('POST /api/auth/logout', () => {
  it('logs the user out (200)', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api().post('/api/auth/logout').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logout successfully!');
  });
});

describe('PUT /api/auth/change-password', () => {
  it('changes the password (200) and the new password then works', async () => {
    const { user, cookie } = await signupAndAuth();
    const newPassword = 'NewPass9!';

    const res = await api()
      .put('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ oldPassword: user.password, newPassword });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password changed successfully!');

    // New password authenticates; old one no longer does.
    const good = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: newPassword });
    expect(good.status).toBe(200);

    const bad = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(bad.status).toBe(401);
  });

  it('requires authentication (401)', async () => {
    const res = await api()
      .put('/api/auth/change-password')
      .send({ oldPassword: 'Passw0rd!', newPassword: 'NewPass9!' });

    expect(res.status).toBe(401);
  });

  it('requires both old and new passwords (400)', async () => {
    const { user, cookie } = await signupAndAuth();
    const res = await api()
      .put('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ oldPassword: user.password });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Both old and new passwords are required!');
  });

  it('rejects a wrong old password (401)', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .put('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ oldPassword: 'WrongOld9!', newPassword: 'NewPass9!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Old Password is incorrect!');
  });

  it('rejects reusing the same password (422)', async () => {
    const { user, cookie } = await signupAndAuth();
    const res = await api()
      .put('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ oldPassword: user.password, newPassword: user.password });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('New password must differ!');
  });

  it('rejects a weak new password (422)', async () => {
    const { user, cookie } = await signupAndAuth();
    const res = await api()
      .put('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ oldPassword: user.password, newPassword: 'weak' });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Please enter strong password!');
  });
});

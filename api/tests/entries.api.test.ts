/**
 * API tests — Journal entry endpoints
 *   POST   /api/entries
 *   GET    /api/entries
 *   GET    /api/entries/:id
 *   PATCH  /api/entries/:id
 *   DELETE /api/entries/:id
 *   GET    /api/entries/search?text=
 */
import { api, signupAndAuth, today } from '../support/client';

const validEntry = () => ({
  date: today(),
  title: `Entry${Date.now()}`.slice(0, 20),
  mood: '🙂',
  content: 'A meaningful description of the day for API testing purposes.',
});

describe('POST /api/entries', () => {
  it('creates an entry (201) and returns the saved document', async () => {
    const { cookie } = await signupAndAuth();
    const entry = validEntry();

    const res = await api().post('/api/entries').set('Cookie', cookie).send(entry);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Entry added successfully!');
    expect(res.body.saveEntry).toMatchObject({
      title: entry.title,
      mood: entry.mood,
      content: entry.content,
    });
    expect(res.body.saveEntry._id).toBeDefined();
  });

  it('rejects missing required fields (422)', async () => {
    const { cookie } = await signupAndAuth();
    const { title, ...noTitle } = validEntry();
    const res = await api().post('/api/entries').set('Cookie', cookie).send(noTitle);

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Please submit with required fields!');
  });

  it('rejects an invalid date (422)', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .post('/api/entries')
      .set('Cookie', cookie)
      .send({ ...validEntry(), date: 'not-a-date' });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Please provide a valid date!');
  });

  it('rejects a title longer than 20 characters (422)', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .post('/api/entries')
      .set('Cookie', cookie)
      .send({ ...validEntry(), title: 'x'.repeat(21) });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Title length should not be more than 20 characters!');
  });

  it('rejects content longer than 1500 characters (422)', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .post('/api/entries')
      .set('Cookie', cookie)
      .send({ ...validEntry(), content: 'x'.repeat(1501) });

    expect(res.status).toBe(422);
  });

  it('requires authentication (401)', async () => {
    const res = await api().post('/api/entries').send(validEntry());
    expect(res.status).toBe(401);
  });
});

describe('GET /api/entries (+ /:id)', () => {
  it('lists the user\'s entries (200) including a newly created one', async () => {
    const { cookie } = await signupAndAuth();
    const entry = validEntry();
    await api().post('/api/entries').set('Cookie', cookie).send(entry);

    const res = await api().get('/api/entries').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((e: any) => e.title === entry.title)).toBe(true);
  });

  it('fetches a single entry by id (200)', async () => {
    const { cookie } = await signupAndAuth();
    const created = await api().post('/api/entries').set('Cookie', cookie).send(validEntry());
    const id = created.body.saveEntry._id;

    const res = await api().get(`/api/entries/${id}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .get('/api/entries/000000000000000000000000')
      .set('Cookie', cookie);

    expect(res.status).toBe(404);
  });

  it('does not leak another user\'s entry (404)', async () => {
    const a = await signupAndAuth();
    const created = await api().post('/api/entries').set('Cookie', a.cookie).send(validEntry());
    const id = created.body.saveEntry._id;

    const b = await signupAndAuth();
    const res = await api().get(`/api/entries/${id}`).set('Cookie', b.cookie);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/entries/:id', () => {
  it('updates an entry (200)', async () => {
    const { cookie } = await signupAndAuth();
    const created = await api().post('/api/entries').set('Cookie', cookie).send(validEntry());
    const id = created.body.saveEntry._id;

    const res = await api()
      .patch(`/api/entries/${id}`)
      .set('Cookie', cookie)
      .send({ date: today(), title: 'Updated', mood: '😔', content: 'Updated content body.' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Updated', mood: '😔' });
  });

  it('returns 404 when updating a non-existent entry', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .patch('/api/entries/000000000000000000000000')
      .set('Cookie', cookie)
      .send({ date: today(), title: 'X', mood: '🙂', content: 'c' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/entries/:id', () => {
  it('deletes an entry (200) and a second delete returns 404', async () => {
    const { cookie } = await signupAndAuth();
    const created = await api().post('/api/entries').set('Cookie', cookie).send(validEntry());
    const id = created.body.saveEntry._id;

    const first = await api().delete(`/api/entries/${id}`).set('Cookie', cookie);
    expect(first.status).toBe(200);
    expect(first.body.message).toBe('Entry deleted successfully!');

    const second = await api().delete(`/api/entries/${id}`).set('Cookie', cookie);
    expect(second.status).toBe(404);
  });
});

describe('GET /api/entries/search', () => {
  it('finds entries by title (200)', async () => {
    const { cookie } = await signupAndAuth();
    const entry = validEntry();
    await api().post('/api/entries').set('Cookie', cookie).send(entry);

    const res = await api()
      .get('/api/entries/search')
      .query({ text: entry.title })
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Entries fetched successfully!');
    expect(res.body.data.some((e: any) => e.title === entry.title)).toBe(true);
  });

  it('finds entries by a word inside the content (200)', async () => {
    const { cookie } = await signupAndAuth();
    const entry = { ...validEntry(), content: 'An unmistakable platypus appeared today.' };
    await api().post('/api/entries').set('Cookie', cookie).send(entry);

    const res = await api()
      .get('/api/entries/search')
      .query({ text: 'platypus' })
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('returns a friendly 200 with an empty result for no matches', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .get('/api/entries/search')
      .query({ text: 'zzz-definitely-not-present-zzz' })
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('No entries found!');
    expect(res.body.data).toEqual([]);
  });

  it('requires a non-empty search text (400)', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api().get('/api/entries/search').set('Cookie', cookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Search text is required!');
  });

  it('rejects a search string longer than 100 characters (422)', async () => {
    const { cookie } = await signupAndAuth();
    const res = await api()
      .get('/api/entries/search')
      .query({ text: 'a'.repeat(101) })
      .set('Cookie', cookie);

    expect(res.status).toBe(422);
  });
});

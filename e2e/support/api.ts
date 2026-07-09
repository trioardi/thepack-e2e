import { APIRequestContext, request } from '@playwright/test';
import { TestUser, TestEntry } from './data';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Thin API helpers used only to *arrange* test state quickly (register a user,
 * seed an entry) so UI specs can focus their assertions on the behaviour under
 * test rather than re-driving signup through the UI every time.
 *
 * The DayBook app has no session rehydration: the Redux `user` state starts as
 * null on every fresh page load, so a stored cookie alone does NOT make the UI
 * appear logged in. Because of that we cannot reuse Playwright storageState to
 * skip login — every UI session must log in through the login form. These
 * helpers therefore seed data at the API level and the specs perform the actual
 * UI login themselves.
 */

/** Registers a new user via the API. Returns the created user unchanged. */
export async function registerUser(user: TestUser): Promise<TestUser> {
  const ctx = await request.newContext({ baseURL: BACKEND_URL });
  const res = await ctx.post('/api/auth/signup', {
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
    },
  });
  if (res.status() !== 201) {
    throw new Error(`Seed signup failed (${res.status()}): ${await res.text()}`);
  }
  await ctx.dispose();
  return user;
}

/**
 * Returns an authenticated APIRequestContext (cookie jar primed by login) for
 * a user, so a spec can seed or assert data directly against the API.
 */
export async function authedApi(user: TestUser): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL: BACKEND_URL });
  const res = await ctx.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  if (res.status() !== 200) {
    throw new Error(`Seed login failed (${res.status()}): ${await res.text()}`);
  }
  return ctx;
}

/** Seeds a journal entry for an already-registered user via the API. */
export async function seedEntry(user: TestUser, entry: TestEntry): Promise<string> {
  const ctx = await authedApi(user);
  const res = await ctx.post('/api/entries', {
    data: {
      date: entry.date,
      title: entry.title,
      mood: entry.mood,
      content: entry.content,
    },
  });
  if (res.status() !== 201) {
    throw new Error(`Seed entry failed (${res.status()}): ${await res.text()}`);
  }
  const body = await res.json();
  await ctx.dispose();
  return body.saveEntry._id;
}

/**
 * @file A01-signup.spec.ts
 * @module Authentication
 * @feature Sign up (happy path)
 * @type Positive @priority High
 *
 * @preconditions
 * - App is running; the email is not yet registered.
 *
 * @workflow
 * 1. Open the signup page
 * 2. Register a brand-new user with valid details
 * 3. Verify the app auto-logs-in and lands on the personalised Home page
 * 4. Verify the navbar reflects the authenticated user
 *
 * @expectedResults
 * - Redirects to Home with the "Welcome Back, {name}" heading
 * - The navbar shows the authenticated user's profile dropdown
 */
import { test, expect } from '../../support/fixtures';
import { SignupPage } from '../../pages/SignupPage';
import { NavBar } from '../../pages/NavBar';
import { uniqueUser } from '../../support/data';

test('A01 - user can sign up and is automatically logged in', async ({ page }) => {
  const signup = new SignupPage(page);
  const nav = new NavBar(page);
  const user = uniqueUser();

  await signup.goto();
  await signup.signup(user);

  // Signup auto-logs-in and navigates to Home, which greets the user by name.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: `Welcome Back, ${user.firstName}` })).toBeVisible();

  // The navbar now exposes the profile dropdown for the new user.
  await nav.expectLoggedIn(user.firstName);
});

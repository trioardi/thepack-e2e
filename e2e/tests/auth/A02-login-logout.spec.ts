/**
 * @file A02-login-logout.spec.ts
 * @module Authentication
 * @feature Login (happy path) + Logout
 * @type Positive @priority High
 *
 * @preconditions
 * - A registered user exists (seeded via API).
 *
 * @workflow
 * 1. Register a user (API seed)
 * 2. Log in through the UI with valid credentials
 * 3. Verify authenticated Home + navbar state
 * 4. Log out via the profile dropdown
 * 5. Verify the session is cleared and the "Log In" CTA returns
 *
 * @expectedResults
 * - Login lands on Home with the "Welcome Back, {name}" heading and profile dropdown
 * - After logout the public "Log In" button reappears
 */
import { test, expect } from '../../support/fixtures';

test('A02 - user can log in with valid credentials and then log out', async ({
  page,
  loginPage,
  navBar,
  user,
}) => {
  await loginPage.goto();
  await loginPage.login(user);

  // Successful login lands on the personalised Home page.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: `Welcome Back, ${user.firstName}` })).toBeVisible();
  await navBar.expectLoggedIn(user.firstName);

  // Logout clears the session and restores the public navbar.
  await navBar.logout(user.firstName);
  await navBar.expectLoggedOut();
});

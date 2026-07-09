/**
 * @file A04-change-password.spec.ts
 * @module Authentication
 * @feature Change password
 * @type Positive @priority High
 *
 * @preconditions
 * - A logged-in user (authedPage fixture).
 *
 * @workflow
 * 1. Log in (authedPage fixture)
 * 2. Change the password via the navbar dropdown
 * 3. Verify the success toast
 * 4. End-to-end proof: log out, then log back in with the NEW password
 * 5. Negative check: the OLD password is now rejected
 *
 * @expectedResults
 * - "Password changed successfully!" toast is shown
 * - Login with the new password succeeds
 * - Login with the old password fails with "Invalid credentials!"
 */
import { test, expect } from '../../support/fixtures';

test('A04 - user can change password and log in with the new one', async ({
  page,
  authedPage,
  loginPage,
  navBar,
  user,
}) => {
  const newPassword = 'NewPass9!';

  await navBar.changePassword(user.firstName, user.password, newPassword);
  await expect(authedPage.getByText('Password changed successfully!')).toBeVisible();

  await navBar.logout(user.firstName);
  await navBar.expectLoggedOut();

  // The new password works...
  await loginPage.goto();
  await loginPage.login({ email: user.email, password: newPassword });
  await navBar.expectLoggedIn(user.firstName);

  // ...and the old password no longer does.
  await navBar.logout(user.firstName);
  await loginPage.goto();
  await loginPage.login({ email: user.email, password: user.password });
  await expect(page.getByText('Invalid credentials!')).toBeVisible();
});

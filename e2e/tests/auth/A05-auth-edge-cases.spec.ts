/**
 * @file A05-auth-edge-cases.spec.ts
 * @module Authentication
 * @feature Negative / edge cases
 * @type Negative @priority High
 *
 * Covers the "edge case" explicitly requested by the brief (incorrect password /
 * empty fields) plus duplicate-account and weak-password validation.
 *
 * @preconditions
 * - App running; a registered user exists for the login cases (fixture).
 *
 * @expectedResults
 * - A05a wrong password  -> "Invalid credentials!", stays logged out
 * - A05b empty fields    -> HTML5 validation blocks submit, no navigation
 * - A05c duplicate email -> "User already exist!"
 * - A05d weak password   -> "Please enter strong password!"
 */
import { test, expect } from '../../support/fixtures';
import { SignupPage } from '../../pages/SignupPage';
import { uniqueUser } from '../../support/data';

test('A05a - login with an incorrect password shows an error and does not authenticate', async ({
  page,
  loginPage,
  navBar,
  user,
}) => {
  await loginPage.goto();
  await loginPage.login({ email: user.email, password: 'WrongPass9!' });

  await expect(page.getByText('Invalid credentials!')).toBeVisible();
  await navBar.expectLoggedOut();
  await expect(page).toHaveURL(/\/login/);
});

test('A05b - empty required fields block submission (HTML5 validation)', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.submit.click();

  // The browser blocks the submit; the email field is reported invalid and we
  // never leave the login page.
  await expect(loginPage.email).toHaveJSProperty('validity.valid', false);
  await expect(page).toHaveURL(/\/login/);
});

test('A05c - signing up with an existing email is rejected', async ({ page, user }) => {
  const signup = new SignupPage(page);
  await signup.goto();
  // `user` was already registered by the fixture; reuse its email.
  await signup.signup({ ...uniqueUser(), email: user.email });

  await expect(page.getByText('User already exist!')).toBeVisible();
});

test('A05d - signing up with a weak password is rejected', async ({ page }) => {
  const signup = new SignupPage(page);
  await signup.goto();
  await signup.signup({ ...uniqueUser(), password: 'weak' });

  await expect(page.getByText('Please enter strong password!')).toBeVisible();
});

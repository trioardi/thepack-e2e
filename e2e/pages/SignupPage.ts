import { Page, Locator, expect } from '@playwright/test';
import { TestUser } from '../support/data';

/** The public signup page at /signup. */
export class SignupPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.locator('#firstname');
    this.lastName = page.locator('#lastname');
    this.email = page.locator('#email');
    this.password = page.locator('#password');
    this.submit = page.getByRole('button', { name: /Sign up/ });
  }

  async goto() {
    await this.page.goto('/signup');
    await expect(this.page.getByRole('heading', { name: 'Sign up to DayBook' })).toBeVisible();
  }

  async fill(user: Partial<TestUser>) {
    if (user.firstName !== undefined) await this.firstName.fill(user.firstName);
    if (user.lastName !== undefined) await this.lastName.fill(user.lastName);
    if (user.email !== undefined) await this.email.fill(user.email);
    if (user.password !== undefined) await this.password.fill(user.password);
  }

  async signup(user: Partial<TestUser>) {
    await this.fill(user);
    await this.submit.click();
  }
}

import { Page, Locator, expect } from '@playwright/test';
import { TestUser } from '../support/data';

/** The public login page at /login. */
export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.locator('#email');
    this.password = page.locator('#password');
    this.submit = page.getByRole('button', { name: /Log in/ });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.page.getByRole('heading', { name: 'Log in to DayBook' })).toBeVisible();
  }

  async login(user: Pick<TestUser, 'email' | 'password'>) {
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submit.click();
  }
}

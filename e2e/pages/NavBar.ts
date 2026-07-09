import { Page, Locator, expect } from '@playwright/test';

/**
 * The top navigation bar + the profile dropdown it hosts (Profile / Change
 * Password / Log out) and the global search box.
 */
export class NavBar {
  readonly loginLink: Locator;
  readonly search: Locator;

  constructor(private readonly page: Page) {
    this.loginLink = page.getByRole('link', { name: 'Log In' });
    // The search box is rendered twice (desktop navbar + mobile drawer); target
    // whichever copy is currently visible for the viewport under test.
    this.search = page.locator('input[name="search"]:visible');
  }

  /** The profile dropdown trigger shows the logged-in user's first name. */
  profileTrigger(firstName: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(firstName) });
  }

  async expectLoggedIn(firstName: string) {
    await expect(this.profileTrigger(firstName)).toBeVisible();
  }

  async expectLoggedOut() {
    await expect(this.loginLink).toBeVisible();
  }

  private async openMenu(firstName: string) {
    await this.profileTrigger(firstName).click();
  }

  async logout(firstName: string) {
    await this.openMenu(firstName);
    await this.page.getByRole('button', { name: 'Log out' }).click();
    const modal = this.page.locator('.modal.modal-open');
    await expect(modal.getByText('Are you sure you want to log out?')).toBeVisible();
    await modal.getByRole('button', { name: 'Confirm' }).click();
  }

  async updateProfile(firstName: string, values: { firstName?: string; lastName?: string }) {
    await this.openMenu(firstName);
    await this.page.getByRole('button', { name: 'Profile' }).click();
    const modal = this.page.locator('.modal.modal-open');
    await expect(modal.getByRole('heading', { name: 'Profile Information' })).toBeVisible();
    if (values.firstName !== undefined) await modal.locator('#firstName').fill(values.firstName);
    if (values.lastName !== undefined) await modal.locator('#lastName').fill(values.lastName);
    await modal.getByRole('button', { name: 'Save Changes' }).click();
  }

  async changePassword(firstName: string, oldPassword: string, newPassword: string) {
    await this.openMenu(firstName);
    await this.page.getByRole('button', { name: 'Change Password' }).click();
    const modal = this.page.locator('.modal.modal-open');
    await expect(modal.getByRole('heading', { name: 'Change your password' })).toBeVisible();
    await modal.locator('#oldPassword').fill(oldPassword);
    await modal.locator('#newPassword').fill(newPassword);
    await modal.getByRole('button', { name: 'Change Password' }).click();
  }

  async searchFor(text: string) {
    await this.search.fill(text);
    await this.search.press('Enter');
  }
}

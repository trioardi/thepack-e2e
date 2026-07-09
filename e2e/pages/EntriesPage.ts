import { Page, Locator, expect } from '@playwright/test';
import { TestEntry } from '../support/data';

/** The authenticated /entries page and its Add / Edit / Delete entry modals. */
export class EntriesPage {
  readonly addButton: Locator;

  constructor(private readonly page: Page) {
    // The floating "+" button is icon-only. Scope to the primary-coloured
    // circular button so we don't match the modals' ghost "✕" close buttons.
    this.addButton = page.locator('button.btn-circle.bg-primary');
  }

  async goto() {
    await this.page.goto('/entries');
  }

  /**
   * Opens the "Add New Entry" modal. The "+" button uses an infinite
   * `animate-bounce` animation, so it never reaches Playwright's "stable"
   * actionability state — we force the click past the stability check.
   */
  async openAddModal() {
    await this.addButton.click({ force: true });
    await expect(this.modal().getByRole('heading', { name: 'Add New Entry' })).toBeVisible();
  }

  /** A specific entry card, matched by its (unique) title text. */
  card(title: string): Locator {
    return this.page.locator('.card', { hasText: title });
  }

  private modal(): Locator {
    return this.page.locator('.modal.modal-open');
  }

  async addEntry(entry: TestEntry) {
    await this.openAddModal();
    const modal = this.modal();
    await modal.locator('#title').fill(entry.title);
    await modal.locator('#date').fill(entry.date);
    await modal.locator('#mood').selectOption(entry.mood);
    await modal.locator('#content').fill(entry.content);
    await modal.getByRole('button', { name: 'Save Entry' }).click();
  }

  /** Fills the Add-entry form and submits, without asserting success (edge cases). */
  async submitAddForm(entry: Partial<TestEntry>) {
    await this.openAddModal();
    const modal = this.modal();
    if (entry.title !== undefined) await modal.locator('#title').fill(entry.title);
    if (entry.date !== undefined) await modal.locator('#date').fill(entry.date);
    if (entry.mood !== undefined) await modal.locator('#mood').selectOption(entry.mood);
    if (entry.content !== undefined) await modal.locator('#content').fill(entry.content);
    await modal.getByRole('button', { name: 'Save Entry' }).click();
  }

  async editEntry(currentTitle: string, changes: Partial<TestEntry>) {
    await this.card(currentTitle).locator('.text-success').click();
    const modal = this.modal();
    await expect(modal.getByRole('heading', { name: 'Edit Your Entry' })).toBeVisible();
    // The modal fetches the entry and re-populates the form via a useEffect
    // AFTER it opens. Wait for that hydration to land before typing, otherwise
    // the late setState reverts our input back to the original value.
    await expect(modal.locator('[name="title"]')).toHaveValue(currentTitle);
    if (changes.title !== undefined) await modal.locator('[name="title"]').fill(changes.title);
    if (changes.content !== undefined) await modal.locator('[name="content"]').fill(changes.content);
    if (changes.mood !== undefined) await modal.locator('[name="mood"]').selectOption(changes.mood);
    await modal.getByRole('button', { name: 'Save Changes' }).click();
  }

  async deleteEntry(title: string) {
    await this.card(title).locator('.text-error').click();
    const modal = this.modal();
    await expect(modal.getByText('Are you sure you want to delete this entry?')).toBeVisible();
    await modal.getByRole('button', { name: 'Confirm' }).click();
  }
}

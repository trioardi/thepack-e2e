/**
 * @file E04-entry-edge-cases.spec.ts
 * @module Journal Entries
 * @feature Negative / edge cases
 * @type Negative @priority Medium
 *
 * Covers server-side length validation and client-side required-field guards.
 *
 * @preconditions
 * - A logged-in user on /entries.
 *
 * @expectedResults
 * - E04a title > 20 chars -> "Title length should not be more than 20 characters!"
 * - E04b empty required fields -> HTML5 validation blocks submit, modal stays open
 */
import { test, expect } from '../../support/fixtures';
import { uniqueEntry } from '../../support/data';

test('E04a - creating an entry with a title longer than 20 chars is rejected', async ({
  authedPage,
  entriesPage,
}) => {
  await entriesPage.goto();
  await entriesPage.submitAddForm(
    uniqueEntry({ title: 'ThisTitleIsWayTooLongToBeAccepted' })
  );

  await expect(
    authedPage.getByText('Title length should not be more than 20 characters!')
  ).toBeVisible();
});

test('E04b - required fields block submission of an empty entry', async ({
  authedPage,
  entriesPage,
}) => {
  await entriesPage.goto();
  await entriesPage.openAddModal();

  const modal = authedPage.locator('.modal.modal-open');
  await modal.getByRole('button', { name: 'Save Entry' }).click();

  // HTML5 `required` keeps the title empty/invalid and the modal open.
  await expect(modal.locator('#title')).toHaveJSProperty('validity.valid', false);
  await expect(modal.getByRole('heading', { name: 'Add New Entry' })).toBeVisible();
});

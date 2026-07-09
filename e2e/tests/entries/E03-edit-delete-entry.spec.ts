/**
 * @file E03-edit-delete-entry.spec.ts
 * @feature Journal Entries — Update + Delete (full CRUD lifecycle)
 *
 * @workflow
 * 1. Seed an entry and log in
 * 2. Edit its title + content, verify the card updates
 * 3. Delete the entry, verify it is removed from the list
 */
import { test, expect } from '../../support/fixtures';
import { uniqueEntry } from '../../support/data';
import { seedEntry } from '../../support/api';

test('E03 - user can edit and delete an entry', async ({
  authedPage,
  entriesPage,
  user,
}) => {
  const original = uniqueEntry();
  await seedEntry(user, original);

  await entriesPage.goto();
  await expect(entriesPage.card(original.title)).toBeVisible();

  // --- Edit ---
  const updatedTitle = `Edited${Date.now()}`.slice(0, 20);
  const updatedContent = 'Rewrote the whole day after some reflection.';
  await entriesPage.editEntry(original.title, {
    title: updatedTitle,
    content: updatedContent,
  });
  await expect(authedPage.getByText('Entry updated successfully!')).toBeVisible();
  await expect(entriesPage.card(updatedTitle)).toBeVisible();
  await expect(entriesPage.card(updatedTitle)).toContainText(updatedContent.slice(0, 30));
  await expect(entriesPage.card(original.title)).toHaveCount(0);

  // --- Delete ---
  await entriesPage.deleteEntry(updatedTitle);
  await expect(authedPage.getByText('Entry deleted successfully!')).toBeVisible();
  await expect(entriesPage.card(updatedTitle)).toHaveCount(0);
});

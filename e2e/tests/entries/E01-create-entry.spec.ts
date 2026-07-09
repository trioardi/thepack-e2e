/**
 * @file E01-create-entry.spec.ts
 * @module Journal Entries
 * @feature Create
 * @type Positive @priority High
 *
 * @preconditions
 * - A logged-in user on /entries.
 *
 * @workflow
 * 1. Log in (authedPage fixture) and open /entries
 * 2. Create a new entry via the "+" modal
 * 3. Verify the success toast
 * 4. Verify the entry is generated and rendered on the list with its title,
 *    mood and content
 *
 * @expectedResults
 * - "Entry added successfully!" toast is shown
 * - A new card appears with the correct mood + title heading and content
 */
import { test, expect } from '../../support/fixtures';
import { uniqueEntry } from '../../support/data';

test('E01 - user can create a journal entry and see it on the list', async ({
  authedPage,
  entriesPage,
}) => {
  const entry = uniqueEntry({ mood: '🙂' });

  await entriesPage.goto();
  await entriesPage.addEntry(entry);

  await expect(authedPage.getByText('Entry added successfully!')).toBeVisible();

  // The generated card carries the mood + title (in its heading) and content.
  const card = entriesPage.card(entry.title);
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: `${entry.mood} ${entry.title}` })).toBeVisible();
  await expect(card).toContainText(entry.content.slice(0, 30));
});

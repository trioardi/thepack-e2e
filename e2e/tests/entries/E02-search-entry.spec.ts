/**
 * @file E02-search-entry.spec.ts
 * @module Journal Entries
 * @feature Search
 * @type Positive @priority High
 *
 * @preconditions
 * - A logged-in user with two seeded entries (Alpha…, Beta… whose content
 *   contains the word "kangaroo").
 *
 * @workflow
 * 1. Seed two distinct entries for the user (API)
 * 2. Log in and search by the first entry's title
 * 3. Verify only the matching entry is shown
 * 4. Search by a term unique to the content of the second entry
 * 5. Verify the "no results" state for a non-existent term
 *
 * @expectedResults
 * - Title search -> only Alpha is shown
 * - Content-word search -> only Beta is shown
 * - No-match search -> the friendly "couldn't find any entries" empty state
 */
import { test, expect } from '../../support/fixtures';
import { uniqueEntry } from '../../support/data';
import { seedEntry } from '../../support/api';

test('E02 - user can search entries by title and content', async ({
  authedPage,
  entriesPage,
  navBar,
  user,
}) => {
  const alpha = uniqueEntry({ title: `Alpha${Date.now()}`.slice(0, 20) });
  const beta = uniqueEntry({
    title: `Beta${Date.now()}`.slice(0, 20),
    content: 'A quiet evening with kangaroo sketches in the margins.',
  });
  await seedEntry(user, alpha);
  await seedEntry(user, beta);

  await entriesPage.goto();

  // Search by title -> only Alpha matches.
  await navBar.searchFor(alpha.title);
  await expect(entriesPage.card(alpha.title)).toBeVisible();
  await expect(entriesPage.card(beta.title)).toHaveCount(0);

  // Search by a word that only appears in Beta's content.
  await navBar.searchFor('kangaroo');
  await expect(entriesPage.card(beta.title)).toBeVisible();
  await expect(entriesPage.card(alpha.title)).toHaveCount(0);

  // Non-existent term -> friendly empty state.
  await navBar.searchFor('zzz-no-such-entry-zzz');
  await expect(
    authedPage.getByText(/couldn't find any entries matching your search query/i)
  ).toBeVisible();
});

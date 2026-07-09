# DayBook — Test Case Documentation & Testing Strategy

**Application under test:** DayBook — a MERN (MongoDB, Express, React, Node) personal journaling app
**Author:** Eric · **Date:** 2026-07-09
**Deliverables:** Playwright E2E suite · Jest + Supertest API suite · Bug report · This document

---

## 1. Testing strategy

### 1.1 Objective
Validate the two core user journeys the brief calls out — **Authentication** (signup, login, logout, update details,
change password, edge cases) and **Journal Entry CRUD + Search** — across both layers of the stack, and surface any
correctness/UX defects with reproducible evidence.

### 1.2 Test pyramid & tool choice
I deliberately test each concern at the layer where it is cheapest and most reliable:

| Layer | Tool | What it covers | Why |
|-------|------|----------------|-----|
| **API / integration** | Jest + Supertest | Every REST endpoint, all status codes, validation rules, ownership/isolation | Fast, deterministic, exhaustive on edge cases without UI flakiness |
| **E2E / UI** | Playwright (TypeScript) | Real user journeys through the React UI against the live API | Confirms the wiring the user actually experiences |
| **Exploratory** | Manual smoke + API probing | UI/UX inconsistencies, invalid input, crash cases | Finds what scripted tests assume away |

This mirrors how I structure my day-to-day Playwright suites: page objects, per-test data isolation, accessible
locators, and meaningful (content-level) assertions rather than "did the page load".

### 1.3 Design principles applied
- **Test isolation** — every test provisions its own uniquely-named user/entry (timestamp + pid + random), so the suite
  runs fully in parallel against a shared database with no cross-test coupling.
- **Arrange via API, assert via UI** — E2E specs seed prerequisite state through the API for speed, then drive and
  assert the behaviour under test through the UI.
- **Meaningful assertions** — specs verify specific content (the created entry's title/mood/content, the exact error
  message, that the *new* password works and the *old* one is rejected) — not just navigation.
- **Positive + negative coverage** — each feature has happy-path and edge-case cases (empty fields, wrong password,
  duplicate account, weak password, over-length input, no-result search).
- **Executable bug documentation** — confirmed backend defects are encoded as `test.failing` cases so the suite stays
  green today but automatically flags the day each bug is fixed (see §4).

### 1.4 Scope
**In scope:** all documented REST endpoints; signup/login/logout/profile/password UI flows; entry create/read/update/
delete/search UI flows; input validation; auth/ownership boundaries.
**Out of scope:** load/performance, security pen-testing, cross-browser matrix (suite is Chromium-first but
browser-agnostic), visual regression, email delivery (app has none).

---

## 2. E2E test cases (Playwright)

Location: [`e2e/tests`](../e2e/tests). Run: `npm run test:e2e`.

| ID | Title | Type | Steps (abbreviated) | Expected result |
|----|-------|------|---------------------|-----------------|
| **A01** | Signup — happy path | Positive | Open /signup → register valid user | Auto-logged-in; Home greets "Welcome Back, {name}"; navbar shows profile |
| **A02** | Login + Logout | Positive | Login with valid creds → logout via dropdown | Authenticated Home + navbar; after logout the "Log In" CTA returns |
| **A03** | Update personal details | Positive | Profile → change first+last name → Save | Success toast; **GET /users/me confirms** the new name persisted |
| **A04** | Change password | Positive/E2E | Change password → logout → login with new pw → try old pw | New password authenticates; **old password is rejected** ("Invalid credentials!") |
| **A05a** | Login — incorrect password | Negative | Login with wrong password | "Invalid credentials!"; stays logged out on /login |
| **A05b** | Login — empty fields | Negative | Submit empty login form | HTML5 validation blocks submit; field reported invalid; no navigation |
| **A05c** | Signup — duplicate email | Negative | Sign up with an already-registered email | "User already exist!" |
| **A05d** | Signup — weak password | Negative | Sign up with password `weak` | "Please enter strong password!" |
| **E01** | Create entry | Positive | /entries → "+" → fill title/date/mood/content → Save | Success toast; card appears with correct **mood heading + content** |
| **E02** | Search entries | Positive | Seed 2 entries → search by title, then by a content word, then a non-match | Only the matching card shows each time; non-match → friendly empty state |
| **E03** | Edit + Delete entry | Positive/CRUD | Seed entry → edit title+content → delete | Card reflects the edit; original title gone; after delete the card is removed |
| **E04a** | Entry — title > 20 chars | Negative | Create entry with a 33-char title | "Title length should not be more than 20 characters!" |
| **E04b** | Entry — required fields | Negative | Open Add modal → Save empty | HTML5 validation blocks submit; modal stays open |

**Total: 13 E2E tests — all passing.**

---

## 3. API test cases (Jest + Supertest)

Location: [`api/tests`](../api/tests). Run: `npm run test:api`.

### 3.1 Authentication — `auth.api.test.ts`
| Case | Request | Expected |
|------|---------|----------|
| Signup success | `POST /auth/signup` valid | **201**, profile returned (no password), auth cookie set |
| Signup duplicate | existing email | **422** "User already exist!" |
| Signup missing fields | no password | **400** "Fill all required fields!" |
| Signup invalid email | `not-an-email` | **422** "Invalid email format!" |
| Signup weak password | `weak` | **422** "Please enter strong password!" |
| Login success | valid creds | **200** + cookie |
| Login wrong password | bad password | **401** "Invalid credentials!" |
| Login unknown user | no such email | **401** "Invalid credentials!" |
| Logout | `POST /auth/logout` | **200** "Logout successfully!" |
| Change pw success | valid old+new | **200**; new pw logs in, old pw fails |
| Change pw no auth | no cookie | **401** |
| Change pw missing field | only old | **400** |
| Change pw wrong old | bad old | **401** "Old Password is incorrect!" |
| Change pw same as old | new == old | **422** "New password must differ!" |
| Change pw weak new | weak new | **422** |

### 3.2 User profile — `users.api.test.ts`
| Case | Request | Expected |
|------|---------|----------|
| Get profile | `GET /users/me` authed | **200**, correct email/first/last |
| Get profile no auth | no cookie | **401** |
| Update profile | `PUT /users/me` first+last | **200**; re-fetch confirms persistence |
| Update missing first name | empty firstName | **422** "First name is required!" |
| Update no auth | no cookie | **401** |

### 3.3 Journal entries — `entries.api.test.ts`
| Case | Request | Expected |
|------|---------|----------|
| Create entry | `POST /entries` valid | **201**, saved doc returned |
| Create missing fields | no title | **422** |
| Create invalid date | `date: not-a-date` | **422** |
| Create title > 20 | long title | **422** |
| Create content > 1500 | long content | **422** |
| Create no auth | no cookie | **401** |
| List entries | `GET /entries` | **200**, includes created entry |
| Get by id | `GET /entries/:id` | **200**, correct doc |
| Get missing (valid id) | non-existent id | **404** |
| Get another user's entry | other owner | **404** (ownership isolation) |
| Update entry | `PATCH /entries/:id` | **200**, fields updated |
| Update missing | non-existent id | **404** |
| Delete entry | `DELETE /entries/:id` | **200**; second delete → **404** |
| Search by title | `?text=<title>` | **200**, match returned |
| Search by content | `?text=<word in content>` | **200**, match returned |
| Search no match | unknown text | **200** "No entries found!", empty array |
| Search empty text | no `text` | **400** "Search text is required!" |
| Search > 100 chars | 101-char text | **422** |

**Total: 43 API tests passing + 1 skipped** (the destructive crash case, BUG-01).

---

## 4. Known-defect tests (executable bug documentation)

Location: [`api/tests/known-issues.api.test.ts`](../api/tests/known-issues.api.test.ts).

Confirmed backend defects are encoded as Jest **`test.failing`** cases that assert the *correct* expected behaviour.
Because the app is currently buggy, these are reported **green** (the assertion is expected to fail). If a developer
fixes the bug, the corresponding `test.failing` will start failing loudly — a built-in regression alarm that the bug is
gone and the assertion should be promoted to a normal test. The one exception is **BUG-01**, which is `test.skip`
because executing it crashes the shared server; its full repro lives in the test file and the bug report.

| Test | Maps to | Current | Correct |
|------|---------|---------|---------|
| signup without email | BUG-02 | 500 | 400 |
| login empty body | BUG-03 | 500 | 400 |
| get entry malformed id | BUG-04 | 500 | 4xx |
| search regex metachar `(` | BUG-05 | 500 | < 500 |
| create entry invalid mood | BUG-06 | 500 | 422 |
| update profile w/o lastName | BUG-01 | **crash** | ≤ 4xx (skipped) |

Full analysis, severity and fixes: [`docs/BUG-REPORT.md`](./BUG-REPORT.md).

---

## 5. Results summary

| Suite | Tests | Result |
|-------|-------|--------|
| API (Jest + Supertest) | 44 (43 pass, 1 skip) | ✅ Green |
| E2E (Playwright) | 13 | ✅ Green (stable at 4 parallel workers) |
| Confirmed defects | 10 filed | 1 Critical, 1 High, 5 Medium, 3 Low |

### Headline finding
**BUG-01 (Critical):** `PUT /api/users/me` for any account without a last name throws an unhandled `TypeError` outside
the try/catch and **crashes the entire Node process** — a one-request denial of service reachable from the normal
Profile → Save UI flow. This should be fixed first.

# Playwright

End-to-end testing in real browsers. Chromium, Firefox, WebKit out of the box. Way more stable than Selenium or Cypress for cross-browser.

## Setup

```
npm init playwright@latest
```

Scaffolds config, example test, GitHub Actions workflow.

## Test shape

```typescript
import { test, expect } from '@playwright/test';

test('login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

## Locators

- `getByRole('button', { name: 'Submit' })` — accessibility-first, most robust
- `getByLabel('Email')` — form fields
- `getByText('Welcome')` — visible text
- Avoid CSS selectors unless you have to

## Auto-wait

Playwright waits automatically for:
- Element attached to DOM
- Element visible
- Element enabled
- Element stable (not animating)

No manual `waitForSelector` in most cases.

## Fixtures

```typescript
test.use({ storageState: 'auth.json' });
```

Pre-authenticated state. Run auth once, reuse across tests.

## CI

- Run headless (default)
- Shard across machines: `--shard=1/4` across 4 parallel jobs
- Upload trace on failure: `trace: 'on-first-retry'` in config

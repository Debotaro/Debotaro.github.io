import { test, expect } from '@playwright/test';
import { seed } from '../atlas-ops/src/data';

const appUrl = process.env.ATLAS_TEST_URL || '/atlas-ops/';
const key = 'atlas-ops-v1';

test('ATLAS recovers from malformed nested storage without replacing it until an intentional edit', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const invalid = JSON.stringify({ ...seed, tasks: [{ ...seed.tasks[0], title: null }] });
  await page.addInitScript(
    ({ key, invalid }) => {
      localStorage.setItem(key, invalid);
    },
    { key, invalid },
  );
  await page.goto(`${appUrl}#/tasks`);
  await expect(page.getByRole('heading', { name: 'Task management', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Review supplier contracts', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(invalid);
  await page.getByRole('button', { name: 'Edit Review supplier contracts', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Task name', { exact: true }).fill('Recovered supplier review');
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Recovered supplier review', exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}').tasks[0]?.title, key),
    )
    .toBe('Recovered supplier review');
  expect(errors).toEqual([]);
});

test('ATLAS retains customised version-1 state and canonical imported source across reload', async ({
  page,
}) => {
  const custom = structuredClone(seed);
  custom.settings = {
    ...custom.settings,
    workspace: 'Debotaro studio',
    name: 'Deboraj Sarkar',
    timezone: 'Asia/Kolkata',
    compact: true,
    target: 9000,
  };
  custom.tasks.unshift({
    ...custom.tasks[0],
    id: 'GH-100042',
    title: 'Retained GitHub task',
    status: 'In review',
    source: {
      kind: 'github',
      issueId: 100042,
      issueNumber: 42,
      repository: 'facebook/react',
      url: 'https://github.com/facebook/react/issues/42',
      importedAt: '2026-10-09T10:30:00.000Z',
    },
  });
  custom.notices[0].read = true;
  custom.coverage[0].shifts[2] = 'On call';
  await page.addInitScript(
    ({ key, custom }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(custom));
    },
    { key, custom },
  );
  await page.goto(`${appUrl}#/tasks`);
  await expect(
    page.getByRole('button', { name: 'Retained GitHub task', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub #42', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/facebook/react/issues/42',
  );
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Retained GitHub task', exact: true }),
  ).toBeVisible();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), key);
  expect(stored).toEqual(custom);
  await page.goto(`${appUrl}#/settings`);
  await expect(page.getByLabel('Workspace name', { exact: true })).toHaveValue('Debotaro studio');
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Deboraj Sarkar');
});

test('ATLAS editors keep email and date values inside the reloadable storage bounds', async ({
  page,
}) => {
  // HTML email validation does not impose a total length limit. This address is
  // syntactically valid for the control but exceeds the storage schema by one.
  const longEmail = `candidate@${'branch.'.repeat(44)}com`;
  const boundedEmail = longEmail.slice(0, 320);
  expect(longEmail.length).toBe(321);
  await page.goto(`${appUrl}#/login`);
  const loginEmail = page.getByLabel('Email address', { exact: true });
  await loginEmail.fill('');
  await loginEmail.pressSequentially(longEmail);
  await expect(loginEmail).toHaveValue(boundedEmail);
  await page.getByRole('button', { name: 'Enter demo workspace' }).click();
  await expect(page).toHaveURL(/#\/overview$/);
  await page.goto(`${appUrl}#/settings`);
  const profileEmail = page.getByLabel('Email address', { exact: true });
  await profileEmail.fill('');
  await profileEmail.pressSequentially(longEmail);
  await expect(profileEmail).toHaveValue(boundedEmail);
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}').settings?.email, key),
    )
    .toBe(boundedEmail);
  await page.reload();
  await expect(profileEmail).toHaveValue(boundedEmail);

  await page.goto(`${appUrl}#/tasks`);
  await page.getByRole('button', { name: 'Edit Review supplier contracts', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const due = dialog.getByLabel('Due date', { exact: true });
  await due.fill('10000-01-01');
  // The editor applies its shared date validator because native handling of
  // five-digit years differs between browser engines.
  expect(await due.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(due).toBeFocused();
  expect(await due.evaluate((element: HTMLInputElement) => element.validationMessage)).toContain(
    '9999',
  );
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}').tasks[0]?.due, key),
  ).toBe(seed.tasks[0].due);
  await due.fill('9999-12-31');
  expect(await due.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(true);
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Edit Review supplier contracts', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Due date', { exact: true })).toHaveValue(
    '9999-12-31',
  );
});

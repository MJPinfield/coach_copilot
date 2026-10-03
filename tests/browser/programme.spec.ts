import { test, expect } from '@playwright/test'

test('coach saves a programme, client sees it, and a deep-link reload retains it', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Strength foundations' })).toBeVisible()
  await page.getByLabel('Programme name').fill('Alex’s autumn programme')
  await page.getByLabel('Coaching notes').fill('Pause at the bottom. Keep two reps in reserve.')
  await page.getByRole('button', { name: 'Save programme' }).click()
  await expect(page.getByRole('status')).toHaveText('Programme saved.')
  await page.getByRole('link', { name: 'Client view' }).click()
  await expect(page.getByRole('heading', { name: 'Alex’s autumn programme' })).toBeVisible()
  await expect(page.getByText('Pause at the bottom. Keep two reps in reserve.')).toBeVisible()
  await expect(page.getByLabel('Programme name')).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Alex’s autumn programme' })).toBeVisible()
  await page.getByRole('link', { name: 'Coach workspace' }).click()
  await expect(page.getByLabel('Programme name')).toHaveValue('Alex’s autumn programme')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByLabel('Programme name')).toHaveValue('Strength foundations')
})

test('read failure has a working retry', async ({ page }) => {
  await page.goto('/?scenario=read-error')
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByLabel('Programme name')).toHaveValue('Strength foundations')
})

test('failed save keeps edits and retries without losing them', async ({ page }) => {
  await page.goto('/?scenario=save-error')
  await page.getByLabel('Coaching notes').fill('Take three minutes between sets.')
  await page.getByRole('button', { name: 'Save programme' }).click()
  await expect(page.getByRole('alert')).toContainText('Your edits are still here.')
  await expect(page.getByLabel('Coaching notes')).toHaveValue('Take three minutes between sets.')
  await page.getByRole('button', { name: 'Save programme' }).click()
  await expect(page.getByRole('status')).toHaveText('Programme saved.')
  await page.reload()
  await expect(page.getByLabel('Coaching notes')).toHaveValue('Take three minutes between sets.')
})

test('empty state is available through the design controls', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Design scenario').selectOption('empty')
  await expect(page.getByRole('heading', { name: 'No programme yet' })).toBeVisible()
  await page.getByRole('link', { name: 'Client view' }).click()
  await expect(page.getByText('Your coach hasn’t shared a programme yet.')).toBeVisible()
  await page.getByLabel('Design scenario').selectOption('ready')
  await expect(page.getByRole('heading', { name: 'Strength foundations' })).toBeVisible()
})

test('slow requests expose loading and saving states', async ({ page }) => {
  await page.goto('/?scenario=slow')
  await expect(page.getByRole('status')).toContainText('Loading programme')
  await page.getByLabel('Programme name').fill('A considered progression')
  await page.getByRole('button', { name: 'Save programme' }).click()
  await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  await expect(page.getByRole('status')).toHaveText('Programme saved.')
})

test('blank titles cannot be saved and the layout fits the viewport', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByLabel('Programme name').fill('   ')
  await expect(page.getByRole('button', { name: 'Save programme' })).toBeDisabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('unknown routes have a recovery path', async ({ page }) => {
  await page.goto('/missing')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Return to the workspace' }).click()
  await expect(page.getByLabel('Programme name')).toHaveValue('Strength foundations')
})

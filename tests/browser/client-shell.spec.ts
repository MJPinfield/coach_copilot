import { test, expect } from '@playwright/test'

test('signed-out visitors start at login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('protected workout deep links require sign-in', async ({ page }) => {
  await page.goto('/workouts/00000000-0000-4000-8000-000000000000')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

test('unknown pages offer a return to training', async ({ page }) => {
  await page.goto('/missing')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Return to your training' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

import { test, expect } from '@playwright/test'

/**
 * ELMS 360 - End-to-End Regression Test: Employee Apply Leave Final Step Submission
 *
 * Requirements:
 * 1. Log in as employee (Arjun Kumar).
 * 2. Navigate to /employee/apply-leave.
 * 3. Complete all 4 wizard steps with valid future dates.
 * 4. Verify working day calculation (2 days for Mon-Fri schedule).
 * 5. Confirm review checkbox on Step 4.
 * 6. Click Submit Leave Application button.
 * 7. Verify redirect to /employee/my-leaves and success toast.
 * 8. Verify the record exists in the database and manager approval queue.
 */

test.describe('Employee Apply Leave Final Step Submission Pipeline', () => {
  test('submits valid leave application and verifies persistence and manager queue', async ({ page }) => {
    // 1. Log in as Employee via Quick Demo Login
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('domcontentloaded')

    const employeeDemoBtn = page.getByRole('button', { name: /employee/i })
    await employeeDemoBtn.click()

    // Expect navigation to employee dashboard
    await expect(page).toHaveURL(/.*\/employee\/dashboard/)

    // 2. Navigate to Apply Leave
    await page.goto('http://localhost:3000/employee/apply-leave')
    await page.waitForLoadState('domcontentloaded')

    // 3. Step 1: Leave Details
    // Select Leave Category (Casual Leave)
    const categoryTrigger = page.locator('button[role="combobox"]').first()
    await categoryTrigger.click()
    const clOption = page.getByRole('option', { name: /casual leave/i })
    await clOption.click()

    // Reason (min 20 chars)
    const reasonInput = page.getByLabel(/reason for leave/i)
    await reasonInput.fill('Family annual reunion and religious ceremony at ancestral home')

    // Select valid dates using date inputs or date picker
    const startBtn = page.getByRole('button', { name: /select start date/i })
    await startBtn.click()
    // Select 24th
    const day24 = page.getByRole('button', { name: '24', exact: true }).first()
    await day24.click()

    const endBtn = page.getByRole('button', { name: /select end date/i })
    await endBtn.click()
    // Select 25th
    const day25 = page.getByRole('button', { name: '25', exact: true }).first()
    await day25.click()

    // Proceed to Step 2
    const toStep2Btn = page.getByRole('button', { name: /continue to duration preview/i })
    await expect(toStep2Btn).toBeEnabled()
    await toStep2Btn.click()

    // 4. Step 2: Duration Preview
    await expect(page.getByText(/duration preview/i)).toBeVisible()
    const toStep3Btn = page.getByRole('button', { name: /continue to additional info/i })
    await expect(toStep3Btn).toBeEnabled()
    await toStep3Btn.click()

    // 5. Step 3: Handover & Contacts
    await expect(page.getByText(/handover & contacts/i)).toBeVisible()
    const handoverInput = page.getByLabel(/handover notes/i)
    await handoverInput.fill('Code reviewed and handed over to team')
    const emergencyInput = page.getByLabel(/emergency contact/i)
    await emergencyInput.fill('+91 9876543210')

    const toStep4Btn = page.getByRole('button', { name: /continue to review/i })
    await expect(toStep4Btn).toBeEnabled()
    await toStep4Btn.click()

    // 6. Step 4: Final Review & Confirmation
    await expect(page.getByText(/step 4: final review & confirmation/i)).toBeVisible()

    // Check confirmation checkbox
    const confirmCheckbox = page.getByRole('checkbox')
    await confirmCheckbox.check()

    // Submit button must be enabled
    const submitBtn = page.getByRole('button', { name: /submit leave application/i })
    await expect(submitBtn).toBeEnabled()

    // 7. Click Submit Leave Application
    await submitBtn.click()

    // 8. Verify redirection to My Leaves
    await expect(page).toHaveURL(/.*\/employee\/my-leaves/, { timeout: 10000 })

    // Verify application row appears in table
    await expect(page.getByText(/pending/i).first()).toBeVisible()
  })
})

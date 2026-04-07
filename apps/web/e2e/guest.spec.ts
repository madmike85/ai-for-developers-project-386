import { test, expect, Page, APIRequestContext } from '@playwright/test';
import {
  API_BASE_URL,
  WEB_BASE_URL,
  SAMPLE_GUESTS,
  TEST_EVENT_TYPES,
  getFutureDate,
  formatDateForAPI,
  formatTimeSlot,
  createBookingPayload,
  type EventType,
  type Guest,
} from './fixtures/test-data';

// =============================================================================
// Test Setup and Helpers
// =============================================================================

/**
 * Navigate to the web application base URL
 */
async function navigateToHome(page: Page): Promise<void> {
  await page.goto(WEB_BASE_URL);
}

/**
 * Create a booking via API for test setup
 */
async function createBookingViaApi(
  request: APIRequestContext,
  eventType: EventType,
  guest: Guest,
  startTime: Date,
): Promise<void> {
  const payload = createBookingPayload(eventType, guest, startTime);

  const response = await request.post(`${API_BASE_URL}/public/bookings`, {
    data: {
      eventTypeId: payload.eventTypeId,
      guestName: payload.guestName,
      guestEmail: payload.guestEmail,
      startTime: payload.startTime.toISOString(),
    },
  });

  expect(response.ok()).toBeTruthy();
}

/**
 * Clear booking store by navigating to home and then to book page
 * This triggers the reset effect in PublicEventTypesPage
 */
async function resetBookingState(page: Page): Promise<void> {
  await navigateToHome(page);
  await page.goto(`${WEB_BASE_URL}/book`);
}

/**
 * Helper to select a date in the Mantine DatePicker
 * Uses the data-day attribute to find the specific date
 */
async function selectDateInCalendar(
  page: Page,
  date: Date,
): Promise<void> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  // Find and click the date cell with the specific data-day attribute
  const dateCell = page.locator(`[data-day="${dateString}"]`);
  await expect(dateCell).toBeVisible();
  await dateCell.click();
}

/**
 * Helper to format time for slot selection
 * Matches the format used in formatTimeLocal utility
 */
function formatTimeForSlot(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// =============================================================================
// Test Hooks
// =============================================================================

test.beforeEach(async ({ page }) => {
  // Reset the booking state before each test to ensure clean state
  await resetBookingState(page);
});

// =============================================================================
// G1: Successful Meeting Booking
// =============================================================================

test.describe('G1: Successful Meeting Booking', () => {
  test('guest successfully completes full booking flow', async ({ page }) => {
    // Step 1: Navigate to homepage and verify "Book" button
    await navigateToHome(page);
    await expect(page.getByRole('button', { name: 'Book' })).toBeVisible();

    // Step 2: Click "Book" button
    await page.getByRole('button', { name: 'Book' }).click();

    // Verify redirected to /book (event types page)
    await expect(page).toHaveURL(`${WEB_BASE_URL}/book`);
    await expect(page.getByRole('heading', { name: 'Select an Event Type' })).toBeVisible();

    // Step 3: Select an event type (Intro Call)
    const introCallCard = page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.INTRO_CALL.name })
      .first();
    await expect(introCallCard).toBeVisible();
    await introCallCard.getByRole('button', { name: 'Select' }).click();

    // Verify redirected to calendar page
    await expect(page).toHaveURL(new RegExp(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.INTRO_CALL.id}`));
    await expect(page.getByRole('heading', { name: 'Select a Date' })).toBeVisible();
    await expect(page.getByText(TEST_EVENT_TYPES.INTRO_CALL.name)).toBeVisible();

    // Step 4: Select a future date
    const futureDate = getFutureDate(3, 10, 0); // 3 days from now at 10:00
    await selectDateInCalendar(page, futureDate);

    // Verify "Continue" button is enabled after date selection
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await expect(continueButton).toBeEnabled();

    // Step 5: Click Continue to Time Slots
    await continueButton.click();

    // Verify redirected to time slots page
    await expect(page).toHaveURL(new RegExp(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.INTRO_CALL.id}/slots`));
    await expect(page.getByRole('heading', { name: 'Select a Time' })).toBeVisible();

    // Step 6: Select an available time slot (10:00)
    const timeString = formatTimeForSlot(futureDate);
    const slotButton = page
      .getByRole('button')
      .filter({ hasText: timeString })
      .filter({ hasNotText: 'Booked' })
      .first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();

    // Verify slot is selected (should have filled variant and check icon)
    await expect(slotButton).toHaveAttribute('data-variant', 'filled');

    // Step 7: Click Continue to Booking
    const continueToBookingButton = page.getByRole('button', { name: 'Continue to Booking' });
    await expect(continueToBookingButton).toBeEnabled();
    await continueToBookingButton.click();

    // Verify redirected to confirmation page
    await expect(page).toHaveURL(new RegExp(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.INTRO_CALL.id}/confirm`));
    await expect(page.getByRole('heading', { name: 'Complete Your Booking' })).toBeVisible();

    // Step 8-9: Fill in guest information
    const nameInput = page.getByLabel('Your Name');
    const emailInput = page.getByLabel('Your Email');

    await nameInput.fill(SAMPLE_GUESTS.JOHN_DOE.name);
    await emailInput.fill(SAMPLE_GUESTS.JOHN_DOE.email);

    // Verify fields are populated
    await expect(nameInput).toHaveValue(SAMPLE_GUESTS.JOHN_DOE.name);
    await expect(emailInput).toHaveValue(SAMPLE_GUESTS.JOHN_DOE.email);

    // Step 10: Click Confirm Booking
    const confirmButton = page.getByRole('button', { name: 'Confirm Booking' });
    await confirmButton.click();

    // Step 11: Verify success modal appears
    const successModal = page.locator('.mantine-Modal-root');
    await expect(successModal).toBeVisible();
    await expect(successModal.getByRole('heading', { name: 'Booking Confirmed!' })).toBeVisible();
    await expect(successModal.getByText('Your booking has been confirmed')).toBeVisible();

    // Verify booking details in modal
    await expect(successModal.getByText(TEST_EVENT_TYPES.INTRO_CALL.name)).toBeVisible();

    // Click Done button
    await successModal.getByRole('button', { name: 'Done' }).click();

    // Verify redirected back to /book and store is reset
    await expect(page).toHaveURL(`${WEB_BASE_URL}/book`);
  });

  test('booking details are displayed in success modal', async ({ page }) => {
    // Complete booking flow quickly
    await page.goto(`${WEB_BASE_URL}/book`);

    // Select event type
    const introCallCard = page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.INTRO_CALL.name })
      .first();
    await introCallCard.getByRole('button', { name: 'Select' }).click();

    // Select date and time
    const futureDate = getFutureDate(2, 14, 0);
    await selectDateInCalendar(page, futureDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    const timeString = formatTimeForSlot(futureDate);
    const slotButton = page
      .getByRole('button')
      .filter({ hasText: timeString })
      .filter({ hasNotText: 'Booked' })
      .first();
    await slotButton.click();
    await page.getByRole('button', { name: 'Continue to Booking' }).click();

    // Fill and submit
    await page.getByLabel('Your Name').fill(SAMPLE_GUESTS.JANE_SMITH.name);
    await page.getByLabel('Your Email').fill(SAMPLE_GUESTS.JANE_SMITH.email);
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify success modal with all details
    const successModal = page.locator('.mantine-Modal-root');
    await expect(successModal.getByText(TEST_EVENT_TYPES.INTRO_CALL.name)).toBeVisible();
    await expect(successModal.getByText('Your booking has been confirmed')).toBeVisible();
    await expect(successModal.getByRole('button', { name: 'Done' })).toBeVisible();
  });
});

// =============================================================================
// G2: Cannot Book Occupied Time Slot
// =============================================================================

test.describe('G2: Cannot Book Occupied Time Slot', () => {
  test('occupied time slot is marked unavailable and disabled', async ({ page, request }) => {
    // Setup: Create a booking first via API
    const eventType = TEST_EVENT_TYPES.QUICK_CHAT;
    const existingGuest = SAMPLE_GUESTS.JANE_SMITH;
    const bookingDate = getFutureDate(5, 10, 0); // 5 days from now at 10:00

    await createBookingViaApi(request, eventType, existingGuest, bookingDate);

    // Navigate to booking page for the same event type
    await page.goto(`${WEB_BASE_URL}/book`);

    // Select the event type
    const quickChatCard = page
      .locator('.mantine-Card-root')
      .filter({ hasText: eventType.name })
      .first();
    await quickChatCard.getByRole('button', { name: 'Select' }).click();

    // Select the date with existing booking
    await selectDateInCalendar(page, bookingDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify time slots page loaded
    await expect(page.getByRole('heading', { name: 'Select a Time' })).toBeVisible();

    // Step 4: Verify occupied slot shows as unavailable (Booked)
    const timeString = formatTimeForSlot(bookingDate);
    const occupiedSlot = page.getByRole('button', { name: `${timeString} - Booked` });
    await expect(occupiedSlot).toBeVisible();

    // Step 5: Verify occupied slot is disabled (cannot be selected)
    await expect(occupiedSlot).toBeDisabled();

    // Verify other slots are still available (if any)
    const availableSlots = page
      .getByRole('button')
      .filter({ hasText: /^\d{2}:\d{2}$/ }); // Match time format without "Booked"

    // There should be at least some available slots (or alert if all booked)
    const hasAvailableSlots = await availableSlots.count() > 0;
    if (!hasAvailableSlots) {
      await expect(page.getByRole('alert')).toContainText('No Available Slots');
    }
  });

  test('guest sees updated availability after booking conflict', async ({ page, request }) => {
    const eventType = TEST_EVENT_TYPES.INTRO_CALL;
    const guest = SAMPLE_GUESTS.ALEXANDER_HAMILTON;
    const bookingDate = getFutureDate(7, 15, 0); // 7 days from now at 15:00

    // Create booking via API
    await createBookingViaApi(request, eventType, guest, bookingDate);

    // Navigate through flow
    await page.goto(`${WEB_BASE_URL}/book`);
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: eventType.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    await selectDateInCalendar(page, bookingDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify the 15:00 slot is marked as Booked
    const timeString = formatTimeForSlot(bookingDate);
    const occupiedSlot = page.getByRole('button', { name: `${timeString} - Booked` });
    await expect(occupiedSlot).toBeVisible();
    await expect(occupiedSlot).toBeDisabled();
    await expect(occupiedSlot).toHaveClass(/mantine-Button-root/);
  });
});

// =============================================================================
// G3: Form Validation on Booking Confirmation
// =============================================================================

test.describe('G3: Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to confirmation page with valid flow
    await page.goto(`${WEB_BASE_URL}/book`);

    // Select event type
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.INTRO_CALL.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    // Select date
    const futureDate = getFutureDate(4, 11, 0);
    await selectDateInCalendar(page, futureDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Select time slot
    const timeString = formatTimeForSlot(futureDate);
    await page
      .getByRole('button')
      .filter({ hasText: timeString })
      .filter({ hasNotText: 'Booked' })
      .first()
      .click();
    await page.getByRole('button', { name: 'Continue to Booking' }).click();

    // Verify on confirmation page
    await expect(page.getByRole('heading', { name: 'Complete Your Booking' })).toBeVisible();
  });

  test('empty name field shows validation error', async ({ page }) => {
    const nameInput = page.getByLabel('Your Name');
    const emailInput = page.getByLabel('Your Email');

    // Leave name empty, fill email
    await emailInput.fill(SAMPLE_GUESTS.JOHN_DOE.email);

    // Try to submit
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify name field shows error
    await expect(page.getByText('Name is required')).toBeVisible();
  });

  test('empty email field shows validation error', async ({ page }) => {
    const nameInput = page.getByLabel('Your Name');
    const emailInput = page.getByLabel('Your Email');

    // Fill name, leave email empty
    await nameInput.fill(SAMPLE_GUESTS.JOHN_DOE.name);

    // Try to submit
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify email field shows error
    await expect(page.getByText('Email is required')).toBeVisible();
  });

  test('invalid email format shows validation error', async ({ page }) => {
    const nameInput = page.getByLabel('Your Name');
    const emailInput = page.getByLabel('Your Email');

    // Fill valid name, invalid email
    await nameInput.fill(SAMPLE_GUESTS.JOHN_DOE.name);
    await emailInput.fill('invalid-email');

    // Try to submit
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify email field shows validation error
    await expect(page.getByText('Please enter a valid email')).toBeVisible();
  });

  test('multiple validation errors appear simultaneously', async ({ page }) => {
    // Click submit without filling any fields
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify both errors appear
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
  });

  test('form clears errors when valid data is entered', async ({ page }) => {
    // First trigger errors
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();

    // Fill valid data
    await page.getByLabel('Your Name').fill(SAMPLE_GUESTS.JOHN_DOE.name);
    await page.getByLabel('Your Email').fill(SAMPLE_GUESTS.JOHN_DOE.email);

    // Submit again - should succeed and show success modal
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify success modal appears (errors are cleared and booking succeeds)
    const successModal = page.locator('.mantine-Modal-root');
    await expect(successModal.getByRole('heading', { name: 'Booking Confirmed!' })).toBeVisible();
  });

  test('form does not submit with invalid data', async ({ page }) => {
    // Fill only invalid email
    await page.getByLabel('Your Name').fill(SAMPLE_GUESTS.JOHN_DOE.name);
    await page.getByLabel('Your Email').fill('not-an-email');

    // Try to submit
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify still on confirmation page (not submitted)
    await expect(page.getByRole('heading', { name: 'Complete Your Booking' })).toBeVisible();

    // Verify error message
    await expect(page.getByText('Please enter a valid email')).toBeVisible();

    // Verify no success modal
    await expect(page.locator('.mantine-Modal-root')).not.toBeVisible();
  });
});

// =============================================================================
// G4: Navigate Back Through Booking Flow
// =============================================================================

test.describe('G4: Navigate Back Through Flow', () => {
  test('back button on confirmation page returns to time slots with preserved state', async ({ page }) => {
    // Navigate through flow to confirmation page
    await page.goto(`${WEB_BASE_URL}/book`);

    // Select event type
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.CONSULTATION.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    // Select date
    const futureDate = getFutureDate(3, 13, 0);
    await selectDateInCalendar(page, futureDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Select time slot
    const timeString = formatTimeForSlot(futureDate);
    const slotButton = page
      .getByRole('button')
      .filter({ hasText: timeString })
      .filter({ hasNotText: 'Booked' })
      .first();
    await slotButton.click();

    // Continue to confirmation
    await page.getByRole('button', { name: 'Continue to Booking' }).click();
    await expect(page.getByRole('heading', { name: 'Complete Your Booking' })).toBeVisible();

    // Step 1: Click Back on confirmation page
    await page.getByRole('button', { name: 'Back' }).first().click();

    // Verify returned to time slots page
    await expect(page).toHaveURL(new RegExp(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.CONSULTATION.id}/slots`));
    await expect(page.getByRole('heading', { name: 'Select a Time' })).toBeVisible();

    // Verify slot is still selected (should have filled variant)
    await expect(slotButton).toHaveAttribute('data-variant', 'filled');
  });

  test('back button on time slots page returns to calendar with preserved date', async ({ page }) => {
    // Navigate to time slots page
    await page.goto(`${WEB_BASE_URL}/book`);
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.INTRO_CALL.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    const futureDate = getFutureDate(6, 9, 0);
    await selectDateInCalendar(page, futureDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify on time slots page
    await expect(page.getByRole('heading', { name: 'Select a Time' })).toBeVisible();

    // Step 2: Click Back on time slots page
    await page.getByRole('button', { name: 'Back' }).first().click();

    // Verify returned to calendar page
    await expect(page).toHaveURL(new RegExp(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.INTRO_CALL.id}`));
    await expect(page.getByRole('heading', { name: 'Select a Date' })).toBeVisible();

    // Verify date is still selected (Continue button should be enabled)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  test('back button on calendar page returns to event types', async ({ page }) => {
    // Navigate to calendar page
    await page.goto(`${WEB_BASE_URL}/book`);
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.QUICK_CHAT.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    // Verify on calendar page
    await expect(page.getByRole('heading', { name: 'Select a Date' })).toBeVisible();

    // Step 3: Click Back on calendar page
    await page.getByRole('button', { name: 'Back' }).first().click();

    // Verify returned to event types page
    await expect(page).toHaveURL(`${WEB_BASE_URL}/book`);
    await expect(page.getByRole('heading', { name: 'Select an Event Type' })).toBeVisible();
  });

  test('navigating forward after going back preserves selections', async ({ page }) => {
    // Complete flow and go back
    await page.goto(`${WEB_BASE_URL}/book`);
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.CONSULTATION.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    const futureDate = getFutureDate(2, 16, 0);
    await selectDateInCalendar(page, futureDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    const timeString = formatTimeForSlot(futureDate);
    const slotButton = page
      .getByRole('button')
      .filter({ hasText: timeString })
      .filter({ hasNotText: 'Booked' })
      .first();
    await slotButton.click();
    await page.getByRole('button', { name: 'Continue to Booking' }).click();

    // Go back to time slots
    await page.getByRole('button', { name: 'Back' }).first().click();
    await expect(page.getByRole('heading', { name: 'Select a Time' })).toBeVisible();

    // Go back to calendar
    await page.getByRole('button', { name: 'Back' }).first().click();
    await expect(page.getByRole('heading', { name: 'Select a Date' })).toBeVisible();

    // Continue forward again - date should still be selected
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Select a Time' })).toBeVisible();

    // Continue to confirmation - slot should need reselection or still be selected
    await expect(page.getByRole('button', { name: 'Continue to Booking' })).toBeVisible();
  });
});

// =============================================================================
// G5: Booking Flow State Persistence
// =============================================================================

test.describe('G5: State Persistence', () => {
  test('state persists during in-app navigation', async ({ page }) => {
    // Navigate to event types and select event type
    await page.goto(`${WEB_BASE_URL}/book`);
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.INTRO_CALL.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    // Select date
    const futureDate = getFutureDate(3, 11, 30);
    await selectDateInCalendar(page, futureDate);

    // Navigate to home page
    await page.goto(`${WEB_BASE_URL}/`);
    await expect(page.getByRole('button', { name: 'Book' })).toBeVisible();

    // Navigate back to book page
    await page.goto(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.INTRO_CALL.id}`);

    // Verify date is still selected (Continue button enabled)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  test('page refresh on confirmation page shows error', async ({ page }) => {
    // Navigate to confirmation page
    await page.goto(`${WEB_BASE_URL}/book`);
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.QUICK_CHAT.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    const futureDate = getFutureDate(4, 14, 0);
    await selectDateInCalendar(page, futureDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    const timeString = formatTimeForSlot(futureDate);
    await page
      .getByRole('button')
      .filter({ hasText: timeString })
      .filter({ hasNotText: 'Booked' })
      .first()
      .click();
    await page.getByRole('button', { name: 'Continue to Booking' }).click();

    // Verify on confirmation page
    await expect(page.getByRole('heading', { name: 'Complete Your Booking' })).toBeVisible();

    // Refresh the page
    await page.reload();

    // Verify error message appears (state is lost on refresh)
    await expect(page.getByText('Missing booking information. Please start over.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Over' })).toBeVisible();
  });

  test('direct URL access to confirmation page without flow shows error', async ({ page }) => {
    // Try to access confirmation page directly
    await page.goto(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.INTRO_CALL.id}/confirm`);

    // Verify error message
    await expect(page.getByText('Missing booking information. Please start over.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Over' })).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('start over button redirects to event types page', async ({ page }) => {
    // Access confirmation page directly to trigger error
    await page.goto(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.CONSULTATION.id}/confirm`);

    // Verify error state
    await expect(page.getByText('Missing booking information. Please start over.')).toBeVisible();

    // Click Start Over button
    await page.getByRole('button', { name: 'Start Over' }).click();

    // Verify redirected to event types page
    await expect(page).toHaveURL(`${WEB_BASE_URL}/book`);
    await expect(page.getByRole('heading', { name: 'Select an Event Type' })).toBeVisible();
  });

  test('state lost on direct URL access to slots page', async ({ page }) => {
    // Try to access slots page directly without selecting date
    await page.goto(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.INTRO_CALL.id}/slots`);

    // Verify error message about missing date
    await expect(page.getByText('No date selected. Please go back and select a date.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go Back' })).toBeVisible();
  });

  test('booking flow works after error recovery', async ({ page }) => {
    // Start with invalid state (direct access)
    await page.goto(`${WEB_BASE_URL}/book/${TEST_EVENT_TYPES.QUICK_CHAT.id}/confirm`);
    await expect(page.getByText('Missing booking information. Please start over.')).toBeVisible();

    // Click Start Over
    await page.getByRole('button', { name: 'Start Over' }).click();

    // Now complete the full flow successfully
    await expect(page.getByRole('heading', { name: 'Select an Event Type' })).toBeVisible();

    // Select event type
    await page
      .locator('.mantine-Card-root')
      .filter({ hasText: TEST_EVENT_TYPES.QUICK_CHAT.name })
      .first()
      .getByRole('button', { name: 'Select' })
      .click();

    // Select date and time
    const futureDate = getFutureDate(5, 10, 30);
    await selectDateInCalendar(page, futureDate);
    await page.getByRole('button', { name: 'Continue' }).click();

    const timeString = formatTimeForSlot(futureDate);
    await page
      .getByRole('button')
      .filter({ hasText: timeString })
      .filter({ hasNotText: 'Booked' })
      .first()
      .click();
    await page.getByRole('button', { name: 'Continue to Booking' }).click();

    // Fill form and submit
    await page.getByLabel('Your Name').fill(SAMPLE_GUESTS.SARAH_CORP.name);
    await page.getByLabel('Your Email').fill(SAMPLE_GUESTS.SARAH_CORP.email);
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify success
    const successModal = page.locator('.mantine-Modal-root');
    await expect(successModal.getByRole('heading', { name: 'Booking Confirmed!' })).toBeVisible();
  });
});

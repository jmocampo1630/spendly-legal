# Spendly Privacy Policy

Last updated: July 16, 2026

Spendly is a local-first budgeting and reminder app. This policy explains what data the app handles and where it goes.

## Data Stored On Your Device

Spendly stores your app data locally on your device, including:

- sessions, budgets, stores, items, categories, deductions, and cashback entries
- reminders for bills and expirations
- onboarding and app preference flags

This data is stored in the app's local SQLite database. Spendly account features do not upload your local sessions, items, reminders, categories, stores, or backup files unless a future sync or backup feature is explicitly added.

## Account Data And Scan Credits

If you sign in with Google, Spendly stores basic account data in Supabase, including your user ID, display name, email address from Google authentication, account tier, and any account-owned paid AI scan entitlement or ledger.

Free AI scans are assigned to the device rather than to each account. On Android, the app reads the app-signing-key, Android-user, and device-scoped Android identifier. On other supported platforms, Spendly creates a random installation identifier. The identifier is sent only to Spendly's Edge Function, converted to a keyed one-way pseudonymous hash, and never stored in raw form in the Spendly database. The device wallet stores the monthly period, allowance, and minimal deduction records needed to prevent account deletion or account switching from resetting free scans. It is not linked by a foreign key to your account and does not contain your email, budgeting data, scanned images, or extracted scan contents.

Device free-scan records expire after their period is no longer needed and are deleted after a 90-day retention window. Paid AI scan allowances remain account-owned and are not shared with other accounts on the device.

The scan wallet also records short-lived scan reservations and finalized scan deductions so Spendly can show the correct balance, prevent concurrent overspending, and avoid duplicate charges when a network request is retried. It does not store your local budgeting database or scanned images.

Spendly may also store internal AI scan usage metadata, such as scan type, image count, AI model/provider, result status, credit consumed, and input/output token counts. This is used for cost monitoring, abuse prevention, diagnostics, and service improvement. It does not include scanned images or raw prompts.

After a successful scan, Spendly temporarily keeps the parsed result for a 24-hour recovery window so the same request can recover from a lost response without calling the AI provider or charging an additional scan. A parsed result may contain extracted receipt contents, prices, merchant names, line items, or reminder details. It is not used as cloud storage or added to your local budgeting data automatically. After the recovery window it can no longer be returned and is removed by the scan-service cleanup process.

## AI Scanning And Image Uploads

When you scan a receipt, price tag, checklist, bill, or expiration item while signed in, Spendly sends the selected image to a Spendly Supabase Edge Function. The function reserves an available AI scan and relays the image and scan prompt to Google's Gemini API. One AI scan is deducted after Spendly receives a complete, successful Gemini response, even if the response does not contain enough usable information to fill the requested fields. Requests that fail validation before Gemini, time out, receive a non-successful Gemini response, or receive an incomplete or corrupt response release the reservation without a deduction.

Spendly uses the response to fill in details inside the app, such as item names, prices, stores, due dates, or reminder details.

Spendly does not store your scanned images on its own servers. Google's handling of submitted images is governed by Google's applicable terms and privacy policies.

## Notifications

Spendly can schedule local notifications for reminders you create. Notification schedules are stored on your device and are used to alert you before bills or expirations are due.

## Backups And Imports

If you export a backup, Spendly creates a JSON backup file containing your app data. You choose where to save or share that file. If you import a backup, the selected file is read by Spendly and used to replace the app's local data.

## Analytics, Ads, And Crash Reporting

Spendly does not include advertising or general analytics tracking.

Spendly uses Sentry for crash reporting so the developer can find and fix app errors. Crash reports may include technical information such as the app version, device model, operating system version, error stack trace, time of the crash, and basic runtime diagnostics. Crash reports are used only to diagnose reliability problems.

Spendly does not intentionally send your sessions, budgets, reminders, backup files, account credit ledger, or scanned images to Sentry.

## Data Deletion

Settings provides two account-deletion choices. **Delete account** permanently deletes the authentication account and associated cloud account data while keeping the local device workspace. **Delete account and erase this device** also removes Spendly's local database, settings, cached files, and notifications from that device. Backup files that you exported to Downloads, Drive, email, or another app are separate copies and are not deleted automatically.

You can also use the [Spendly web account-deletion page](delete-account/) to delete your authentication account and associated cloud data without reinstalling the app. Web deletion cannot remotely reach any device. Clear Spendly's app storage or uninstall it on every device where local budgets, reminders, settings, caches, or notifications should also be removed.

The pseudonymous device free-scan counter described above is retained separately for up to 90 days for fraud prevention and does not reset when an account is deleted. This limited record cannot be used to restore the deleted account or its budgeting data.

You can also delete individual sessions, reminders, and eligible categories. Uninstalling Spendly removes the local app database and locally stored settings from your device, subject to the operating system's storage and backup behavior.

## Contact

For privacy questions or account-deletion assistance, contact [spendly.app.support@gmail.com](mailto:spendly.app.support@gmail.com).

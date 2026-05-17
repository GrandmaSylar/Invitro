# Changelog

All notable updates to this project will be documented here in plain, easy-to-understand language.

## Version 0.2

### Standalone Desktop Application
- **Windows Desktop App**: Released a standalone desktop application for Windows. You can now launch and run the system directly from your computer without needing to open a web browser.
- **Welcome Screen**: Added a beautiful welcome loading screen that appears when you launch the application.
- **Custom Application Icon**: Created a customized, glowing blue laboratory flask icon for the application shortcut, window, and desktop installer.
- **Automatic Background Updates**: Added an automatic update feature. The application will now silently download updates in the background and show a friendly notification to restart and apply them when ready.

### Improvements & Refinements
- **Live Dashboard Analytics**: Connected the dashboard charts to live data with accurate accounting logic to show true daily collections.
- **Manual Update Check**: Added a "Check for Updates" button in Settings -> About & Version to manually trigger an update check.
- **Instant Test Suggestions**: When typing the name of a test in the Test Builder, the system now displays a quick dropdown of matching tests, allowing you to select them instantly without searching the entire library.
- **Easy Library Search**: Added a search bar to the "From Library" popup window so you can quickly find tests by name, code, or measurement units.
- **Activity History Tracking**: Added a secure background log that automatically keeps track of when users log in or out, ensuring better security.
- **Full Database Backup & Restore**: Completely upgraded the backup system. You can now save your entire database (including patients, tests, billing, and system settings) into a single backup file and restore it easily with one click.
- **Layout and Header Cleanups**: Cleaned up the main dashboard layout, removed unnecessary text headers, and made all text on the top lab banner crisp white for a cleaner look.

### Bug Fixes
- **Startup Connection Fix**: Fixed an issue where the application would show a "Page Not Found (404)" error when launched.
- **Laboratory Banner Fix**: Fixed a bug where the top laboratory banner image would not load in the installed application.
- **Clinic Settings Loading Fix**: Fixed a bug where your custom clinic logo and name would revert to defaults when opening the application on a new computer. Settings will now load instantly when you log in.
- **Test List Dropdown Alignment**: Fixed the "Select tests to add" dropdown menu in the Patients tab so it correctly aligns and expands to the full width of the trigger button.
- **Layout Overlaps Resolved**: Corrected overlapping text fields in the Test Builder between the "New Department" input and the "Test Cost" fields.
- **Data Protection Controls**: Added friendly confirmation prompts before editing patients, modifying tests, or saving results to prevent accidental changes.

---

## Version 0.1

### Patient Billing & Receipts
- **Customized Receipts & Reports**: Receipts and laboratory reports now automatically print with your custom clinic name, address, phone number, email, and logo loaded from your settings.
- **Automatic Receipt Printing**: The system now automatically opens a printable receipt preview as soon as you register a new patient or save an add-on test payment.
- **Logo Uploader**: Added an easy uploader in system settings to let you change your clinic's printed logo (supports standard image files up to 5MB).
- **Sticky Payment Panel**: Redesigned the payment panel so it stays pinned to the screen while you scroll through long lists of tests, keeping your totals always visible.
- **Compact Invoice Summaries**: Compressed the history of previous payments into a small, neat card so it doesn't crowd the screen.

### Search and Navigation
- **Unified Screen Layout**: Redesigned the entire application interface to remove multiple inner scrollbars, allowing you to scroll through the Dashboard, Test Register, and Patient pages using one clean scrollbar.
- **Quick Catalog Search**: Added search bars to the registered tests, test library, and department lists for quicker navigation.
- **Bulk Actions**: Added the ability to select and delete multiple tests, departments, or antibiotics at once to save time.
- **Patient Sorting & Filtering**: Added the ability to sort and filter your patient list by name, age, date of birth, or registration date.

### System Enhancements & Fixes
- **Doctor & Location Automation**: Registering a doctor now automatically fills in their hospital location and address details when you select their hospital.
- **Immediate Profile Updates**: Updating a user profile or editing user roles now updates the screen instantly without needing a page refresh.
- **Print Layout Optimizations**: Configured printer settings to hide sidebars and navigation menus automatically when printing receipts or reports.
- **Duplicate Data Cleanups**: Resolved a database issue where duplicate test results were being displayed on certain screens, ensuring your data is always accurate and unique.

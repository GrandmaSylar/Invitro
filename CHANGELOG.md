# Changelog

All notable updates to this project will be documented here in plain, easy-to-understand language.

## Version 1.1.3

### New Features
- **Local Temporary Sequences ("Fix 2")**: Resolved sequence collisions in multi-device setups by introducing temporary offline sequence numbers (e.g. `TEMP-A[DDMMYYYY]-[DEVICE_SUFFIX]-[SEQ]` and `TEMP-RCPT-[YYYYMMDD]-[DEVICE_SUFFIX]-[SEQ]`). If online, official sequences are retrieved immediately. If offline, the temporary sequences are converted to standard official formats on the cloud and local SQLite database upon online reconnection.
- **Strict Single-Device Login**: Implemented a security enforcement policy that restricts user accounts to exactly one active device login at a time. Secondary logins register the new device ID in the user's `permission_overrides` on Supabase, prompting a silent session invalidation, session expired notification, and automatic redirection to the login screen on the primary device within 15 seconds.
- **Manual Auto-Update Controls**: Configured manual update checks and downloads, allowing users to view update notes, click "Download Update" manually, track download progress percentage, and click "Install & Restart" once completed.
- **Resilient Database Inbound Sync**: Fixed database synchronization blockers under unauthenticated main process sessions by fetching public catalog tables anonymously.

## Version 1.1.2

### Bug Fixes
- **Inbound Database Synchronization Blocker**: Resolved a critical bug where inbound syncing from Supabase failed and stalled on the `departments` table due to the remote database lacking an `updated_at` column. Configured lookup tables (`departments` and `antibiotics`) to sync on their `created_at` timestamp.
- **Persistent SafeStorage Key Creation**: Fixed a crash on database key generation (`safeStorage.encryptBuffer is not a function`) by converting the buffer key to a hex string before encrypting and decrypting it with Electron's supported `safeStorage.encryptString`/`safeStorage.decryptString` methods.
- **Local Lab Number Preview & Generation**: Added missing `localGenerateLabNumber` and `localPreviewLabNumber` helpers in the main process handlers to prevent errors when previewing lab numbers.

## Version 1.1.1

### Bug Fixes
- **Electron Database API Call Errors**: Fixed database IPC errors where methods on the frontend (`window.electronAPI.db`) were failing due to missing flat method exports in the Electron preload script. Exposed all database actions as flat functions directly on the db API to resolve compatibility with the existing frontend `dbAdapter` implementation.

## Version 1.1.0

### Offline-First Architecture & Secure Database Sync
- **Local SQLite Integration**: Set up local SQLite database storage using `better-sqlite3` to cache all application tables locally, enabling the application to start up and run completely offline without an internet connection.
- **Double-Shield Database Encryption**: Implemented AES-256 local database encryption using unique cryptographic keys generated per machine, stored securely in Electron's safe storage (DPAPI on Windows), ensuring local clinical data is encrypted at rest.
- **Dynamic Background Synchronization**: Developed a generic local-to-remote synchronization engine that tracks changes locally with a single-serial queue, handling conflicts and syncing actions asynchronously to Supabase.
- **Local Receipt & Sequence Generation**: Implemented a local receipt number generator that mimics the remote Supabase trigger to ensure correct receipt formats and unique tracking numbers even when offline.
- **Customized Receipts & Reports**: Upgraded the receipt and laboratory report system to print/preview with custom layout dimensions, supporting standard roll receipt format, customizable branding/details, and professional margins.

## Version 1.0.1

### Major UI & Theming Engine Overhaul
- **Theme Preset System**: Introduced a new `ThemePresetSection` allowing users to quickly swap between curated color themes and appearances.
- **Global Search**: Added a powerful `GlobalSearch` component with a command palette (`Ctrl+K`) for instantly jumping to patients, tests, settings, and other resources.
- **Login Experience**: Redesigned the `LoginPage` for a smoother authentication flow and improved aesthetics.
- **Centralized Dialog Management**: Refactored application modals into `GlobalDialogs` to reduce overlapping windows, fix Z-index issues, and streamline user workflows.
- **Release Ready**: Graduated from the `0.x` beta phase into a stable `1.0.0` major release, solidifying the core architecture and UI components.

## Version 0.2.6

### System-Wide Visual Redesign & Close Interception
- **Close Window Confirmation**: Added a dynamic, theme-matched confirmation dialog screen when the user clicks the top-right close window (`X`) button in the titlebar or the power icon on the login page, preventing accidental exits.
- **Unified Brand Color Palette**: Standardized the system-wide accent highlights using a signature deep corporate navy (`#0c2e5a`) in Light Mode and vibrant cobalt blue (`#3b82f6`) in Dark Mode, seamlessly propagated across active sidebar tabs, interactive charts, stats cards, and input indicators.
- **Standardized Border Curvature (8px)**: Mapped all container, card, button, and input corner roundness styles to exactly `8px` (`0.5rem`) via global Tailwind config tokens, ensuring absolute visual consistency.
- **Hero Banner Styling & Fade Refinements**: Refined the main dashboard's Welcome Banner by removing the drop shadow and reducing the bottom white gradient length from `128px` to `80px` to create a flatter, cleaner design that blends smoothly with the background.
- **Auxiliary Screens Overhaul**: Refreshed the 404 page, profile avatar fallback gradients, input focus ring highlights, and catalog registration buttons with responsive, theme-consistent styling.

## Version 0.2.5

### User Management & Account Creation
- **Direct Account Creation**: Replaced the email-invite workflow with a direct creation system. Users with the 'Dev' role can now manually create accounts, assign roles, and set passwords directly within the app without requiring email verification.
- **UI Freeze Fixes**: Resolved critical UI freezing issues caused by overlapping Radix UI dialogs. Removed redundant confirmation dialogs for saving changes and creating users.
- **Direct Auth API Integration**: Refactored the user creation backend to use direct HTTP fetch requests to Supabase Auth. This prevents session overrides and avoids conflicts with the active admin session.
- **Smooth Success Notifications**: Replaced blocking modal dialogs with smooth, non-intrusive toast notifications for successful user creation and updates.

## Version 0.2

### Standalone Desktop Application
- **Windows Desktop App**: Released a standalone desktop application for Windows. You can now launch and run the system directly from your computer without needing to open a web browser.
- **Welcome Screen**: Added a beautiful welcome loading screen that appears when you launch the application.
- **Custom Application Icon**: Created a customized, glowing blue laboratory flask icon for the application shortcut, window, and desktop installer.
- **Automatic Background Updates**: Added an automatic update feature. The application will now silently download updates in the background and show a friendly notification to restart and apply them when ready.

### Improvements & Refinements
- **Custom Window Title Bar**: Replaced the generic Windows title bar with a sleek, theme-aware custom title bar that matches your dark or light mode setting.
- **Redesigned Welcome Screen**: Refreshed the startup splash screen with a modern teal color scheme, floating animations, and a smooth bouncing loader.
- **Skeleton Loading Screens**: Added polished loading placeholders across all pages so you see a smooth animated preview instead of blank screens while data loads.
- **Smooth Page Transitions**: Navigating between pages now plays a calm fade-and-slide animation for a more seamless experience.
- **Hover & Click Effects**: Added subtle lift-on-hover animations to cards and buttons, and a satisfying press effect when clicking for a more responsive feel.
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

# Changelog

All notable updates to this project will be documented here in plain, easy-to-understand language.

## Version 1.1.10

### New Features & Improvements
- **Functional Stat Comparisons**: Replaced static percentage placeholders on the dashboard stat cards with functional, dynamic daily rise/fall trend calculations for patients today, tests ordered today, pending results backlog, and daily revenue in both online and offline data modes.

## Version 1.1.9

### New Features & Improvements
- **Interactive Analytics Drilldowns**: Enabled direct metric click-through on dashboard indicators (daily payments, patient volumes) leading to pre-filtered registers and lists.
- **Arrears Recovery Ledger**: Added a dedicated ledger view to track outstanding debts, view recovery metrics, and access payment tools.
- **RBAC Sandbox & Tutorials**: Introduced step-by-step role guides, privilege testing matrices, and simulation sandboxes for user training.
- **Contrast & Light Mode Refinements**: Rectified overlaps, input text borders, text/background styling on active navigation tabs, and progress bar contrasts.
- **Collector Tracking**: Automated recording and fetching of the collector's name on payments, replacing the default 'system' placeholder, backed by a migration.
- **Trademark Attribution**: Added subtle, design-compliant PhiNova branding attributions inside layout bars, login screens, and about details.

## Version 1.1.8

### Improvements & Fixes
- **Parameter ID Format Standardized**: Changed new parameter codes to use the `P###` sequence (e.g., `P004` or `P330`) instead of `PRM-####`, maintaining complete formatting consistency with the seeded laboratory test catalog.

## Version 1.1.7

### New Features & Improvements
- **New Help & Guided Tutorials Center**: Added step-by-step user guides tailored to clinical roles (Receptionists, Lab Technicians, and Administrators) including a guided tour of the main features.
- **Official Laboratory Catalog Loaded**: Set up the official system test library with 223 standard tests and 329 diagnostic parameters.
- **One-Click Installer**: Upgraded the setup package to install silently with a single click, create desktop shortcuts, and launch automatically.
- **First-Run Welcome Screen**: Added a clean, modern welcome modal that displays what is new in the latest version when the application first starts up.

## Version 1.1.6

### Improvements & Fixes
- **Reliable Data Syncing**: Fixed an issue where logging in while offline could temporarily prevent patient and payment history from syncing. The application now syncs database changes more smoothly in the background.
- **Automatic Data Healing**: The application now automatically detects if any local data tables are empty on login and fetches the missing cloud records automatically.

## Version 1.1.5

### New Features
- **Username Login Support**: You can now log in using either your username or your email address.
- **Secure Offline Login**: Your login credentials are now securely encrypted and saved on your device, allowing you to log in even when you have no internet connection.

### Improvements & Fixes
- **Smarter Background Syncing**: Improved security checks during data synchronization to prevent sync errors and avoid hitting server rate limits.
- **Receipt Customization Syncing**: Enabled synchronization for receipt layouts, ensuring that custom receipt setups are automatically shared across all your computers.
- **Data Save Corrections**: Fixed an internal schema issue that was causing save errors on certain test selections and payments.

## Version 1.1.4

### Improvements & Fixes
- **Resilient Synchronization**: Improved the background sync engine so that if one type of data fails to sync due to network or permission issues, other data (like patients, payments, and test lists) will continue syncing successfully instead of halting the entire process.
- **Audit Logs Stability**: Fixed a background database error to ensure user activity logs are recorded reliably without interrupting the user experience.

## Version 1.1.3

### New Features
- **Smart Offline Numbering**: Introduced temporary sequence numbers for receipts and patient registers while offline. The system automatically converts these into official formats on the cloud as soon as you reconnect, preventing conflicts when multiple devices are used offline.
- **Single-Session Security**: Restricted user accounts to one active device login at a time. Logging in on a new device will securely log you out of your previous session to prevent unauthorized access.
- **Manual Update Control**: Added manual update options in Settings, allowing you to check for updates, view release notes, see download progress, and restart the app to apply the update.

## Version 1.1.2

### Improvements & Fixes
- **Sync Catalog Blocker Fix**: Fixed a bug where data updates would get stuck when syncing departments or antibiotics from the cloud.
- **Security Storage Fix**: Fixed a startup crash related to how data encryption keys were created and stored securely on Windows.
- **Lab Number Preview**: Added missing internal helpers so you can correctly preview laboratory numbers on the screen.

## Version 1.1.1

### Improvements & Fixes
- **Database Connection Stability**: Resolved internal communication errors between the frontend interface and the local database system.

## Version 1.1.0

### Offline-First Architecture & Secure Database Sync
- **Full Offline Capabilities**: Added support for running the app entirely offline. You can now register patients, save results, and generate receipts without an active internet connection.
- **Secure Data Encryption**: Implemented banking-grade encryption for local database storage on your computer, ensuring all patient and clinical records are fully protected at rest.
- **Automatic Cloud Sync**: Created a background sync system that automatically updates and uploads offline changes to the cloud once an internet connection is established.
- **Offline Receipt Generation**: Receipts and invoice sequences are now generated correctly offline, matching the standard layout and format of online invoices.
- **Enhanced Receipt Customization**: Upgraded the print/preview system to support standard roll receipts and custom formatting options (margins, logos, and custom headings).

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

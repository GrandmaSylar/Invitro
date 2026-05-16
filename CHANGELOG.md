# Changelog

All notable changes to this project will be documented in this file.

## [0.1.4] - 2026-05-16

### Added
- **Global Confirmation System**: Implemented a unified, system-themed modal system to replace all generic browser `window.confirm` prompts across the application.
- **Action Success Feedback**: Added custom, visually engaging success overlays immediately following critical CRUD operations to improve user feedback.

### Changed
- **LIMS Safety Controls**: Hardened data integrity by enforcing mandatory confirmation checkpoints prior to patient updates, test modifications, permission adjustments, and results submissions.
- **Database Cleanup Scripts**: Executed system data purging algorithms and properly initialized the clean lab parameters sequence (P001+).

### Fixed
- **React Rendering Hooks**: Resolved "Cannot access 'editingParameterId' before initialization" errors in `TestRegister.tsx`.
- **Typing Integrity**: Fixed the strict TypeScript checking for `Omit<Parameter>` type definitions.

## [0.1.3] - 2026-05-16

### Added
- **Integrated Search**: Added live search bars to the Registered Tests, Parameter Library, and Department lists within the Test Register module.
- **Bulk Actions**: Implemented "Delete Selected" functionality for Tests, Parameters, Departments, and Antibiotics, enabling streamlined catalog management.

### Changed
- **Standardized Selection UI**: Unified the list selection pattern across all catalog registers to match the 'Add-on Test' and 'New Patient' workflows (checkbox-driven, row-highlighting on click).
- **Test Register UX Polish**: Standardized the layout and interaction patterns for all catalog entities (Tests, Parameters, Antibiotics, Departments) for full UI/UX parity.
- **Robust Data Fetching**: Transitioned to `maybeSingle()` for test detail fetching to prevent PostgREST coercion errors during rapid state invalidations.

### Fixed
- **Duplicate RLS Policies**: Resolved a critical database issue where overlapping `FOR SELECT` and `FOR ALL` policies caused duplicated query results and application crashes.
- **List Rendering Warnings**: Fixed React "unique key" warnings in the Test Register by implementing keyed Fragments for list mapping.

## [0.1.2] - 2026-05-15

### Added
- **Global Receipt Details**: Receipts and Laboratory Test Reports now dynamically fetch Clinic Name, Address, Phone, Email, and Logo from the Application Identity settings.
- **Automated Receipt Popups**: Saving an Add-on Test or recording a payment for an existing patient now automatically pops open the printable receipt preview immediately upon success.
- **Logo Storage Integration**: Built a direct-to-Supabase file uploader for the clinic logo within system settings, including file type verification and a 5MB size limit.

### Changed
- **Flattened Navigation UI**: System-wide redesign to remove nested cards and embedded scrollable areas across Dashboard, Test Register, Hospital Records, and Results Entry, consolidating pages to use a single global vertical scrollbar.
- **Sticky Payment Panel**: Restructured the Add-on Test workflow to utilize a sticky layout, ensuring payment fields remain visible while scrolling through lengthy test lists.
- **Compact Payment Summaries**: Redesigned the "Previous Summary" in the Add-on Test workflow into a slim, compact card that summarizes historical cost, paid amounts, and arrears without consuming excessive screen real estate.

### Fixed
- **Multiple Scrollbars**: Eliminated hardcoded max-height properties (`max-h-48`, `max-h-64`) and `overflow-auto` wrappers in the Test Register, allowing tables to properly flow with the unified page structure.

## [0.1.1] - 2026-05-02

### Added
- **Receipt Generation Module**: Added printable, professionally formatted invoices for new patient registrations and historical lab records.
- **Account Security Improvements**: Introduced secure password reset functionality and a visibility toggle to the User Account Editor.
- **Advanced Patient Sorting**: Implemented robust table-based sorting (`created_at`, `name`, `age`, `dob`) and filtering across the existing patients registry.

### Changed
- **Add-on Test Workflow Refactor**: Upgraded the add-on test module to utilize a centralized, searchable patient catalog instead of manual ID entry. 
- **Permissions Synchronization**: Re-architected the 'My Permissions' modal to query and reflect real-time individual overrides and implicit `developer` access.
- **Form Automation**: Improved the Doctor Registration workflow to automatically populate associated location and address inputs upon hospital selection.

### Fixed
- **User State Management**: Patched user mutation handling to ensure changes to the profile and user editor instantly reflect across the active session without page reloads.
- **Print Optimization**: Configured native CSS media print utilities to suppress non-essential navigational elements during document printing.

## [0.1.0] - 2026-04-30

### Added
- **Analytics Dashboard**: Integrated `recharts` to provide visual insights on the main dashboard.
  - Activity Trend (Area/Line): 7-day visualization of patient registrations and tests.
  - Department Breakdown (Donut): Distribution of tests across lab departments.
  - Revenue Trend (Bar): 30-day daily payment collection visualization.
  - Result Flags (Donut): Distribution of Normal, Abnormal, and Critical findings.
- **Server-side Lab Numbers**: Implemented a PostgreSQL sequence for unique, auto-incrementing lab numbers (format: `LAB-00001`).
- **Database Migrations**: Formalized Supabase migrations for schema updates and RPC functions.
- **DOB Persistence**: Added `dob` (Date of Birth) column to the `patients` table and ensured full routing from the UI through the service layer to Supabase.

### Changed
- **Dashboard Service**: Expanded to support aggregated analytical queries with optimized parallel Supabase requests.
- **Lab Record Lifecycle**: Refactored `NewPatientTab` and `AddOnTestTab` to utilize the new server-side lab number generation.
- **UI/UX Refinement**: Removed redundant search components from the main layout for a cleaner interface.

### Fixed
- **Backend Routing**: Completed a full audit and end-to-end wiring of all patient registration and lab record fields.
- **Type Safety**: Updated `database.types.ts` and application types to include missing schema fields like `dob`.

---
*Note: This release marks the transition from MVP to a feature-rich Laboratory Information Management System (LIMS).*

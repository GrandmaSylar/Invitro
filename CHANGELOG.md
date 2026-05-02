# Changelog

All notable changes to this project will be documented in this file.

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

# Full Conversation & Feature Evolution Summary — v1.1.16

**Project**: Invitro LIMS (Modern Laboratory Information Management System)  
**Date**: September 17, 2026  
**Version Released**: `v1.1.16`  
**GitHub Repository**: `https://github.com/GrandmaSylar/Invitro`  
**Release Tag**: `v1.1.16`  

---

## Executive Summary

This document provides a comprehensive, structured record of all user requests, architectural enhancements, bug fixes, UI/UX polish, versioning updates, and GitHub release deployment completed during this pair programming session.

---

## 1. Feature Implementations & Refinements

### A. Patient Registration & DOB/Age Auto-Calculation
- **File(s) Modified**: 
  - [`src/features/patients/NewPatientTab.tsx`](file:///c:/Users/berna/bloo/src/features/patients/NewPatientTab.tsx)
  - [`src/features/patients/ExistingPatientTab.tsx`](file:///c:/Users/berna/bloo/src/features/patients/ExistingPatientTab.tsx)
  - [`src/lib/mappers.ts`](file:///c:/Users/berna/bloo/src/lib/mappers.ts)
- **Logic Implemented**:
  - Allowed flexible patient entry for cases where the exact Date of Birth (DOB) is unknown:
    - **Age Only Mode**: Users can enter patient age directly if DOB is unavailable.
    - **DOB Mode**: Entering a Date of Birth automatically calculates the exact age and locks the Age input field, ensuring DOB and Age remain strictly synchronized and uncorrupted.

### B. Login Portal Submission & Form Locking
- **File(s) Modified**: [`src/features/auth/LoginPage.tsx`](file:///c:/Users/berna/bloo/src/features/auth/LoginPage.tsx)
- **UX Refinement**:
  - When the user clicks **"Sign In"**, all login form controls (Email/Username input, Password input, Tab toggle buttons, and "Remember me" checkbox) are immediately disabled and visually dimmed (`opacity-50 pointer-events-none disabled:bg-gray-100`) during request processing to prevent duplicate or accidental resubmissions.

### C. Real-Time Database Connection & Latency Widget
- **File(s) Modified**: [`src/features/auth/LoginPage.tsx`](file:///c:/Users/berna/bloo/src/features/auth/LoginPage.tsx)
- **Features Implemented**:
  - Integrated real-time MSSQL connection status & latency polling via `window.electronAPI.getDbStatus()` (with fallback to `db-get-status`).
  - Rendered an inline **`DB: <ms>`** badge with a pulsing LED indicator (Green = Excellent/Good, Amber = Moderate, Red = Offline) in the login card footer next to the Database Setup Wizard button. Polling runs automatically every 5 seconds.

### D. Database Setup Wizard Access from Login Screen
- **File(s) Modified**: [`src/features/auth/LoginPage.tsx`](file:///c:/Users/berna/bloo/src/features/auth/LoginPage.tsx)
- **Features Implemented**:
  - Added a **"Database Setup Wizard"** button to the bottom of the login card.
  - Clicking the button opens a system-themed warning confirmation prompt (`showConfirm`) asking the user if they wish to clear current local database connection settings.
  - Upon confirmation, resets local database credentials (`window.electronAPI.resetDbConfig()`) and reloads to launch the Database Setup Wizard.

### E. User Management `Last Login` Timestamp Fix
- **File(s) Modified**: 
  - [`electron/mssqlDbHandlers.ts`](file:///c:/Users/berna/bloo/electron/mssqlDbHandlers.ts)
  - [`src/services/authService.ts`](file:///c:/Users/berna/bloo/src/services/authService.ts)
  - [`src/features/rbac/UserTable.tsx`](file:///c:/Users/berna/bloo/src/features/rbac/UserTable.tsx)
- **Bug Fix**:
  - Resolved an issue where user accounts in the Users & Roles management ledger always displayed `"Never"` under `Last Login`.
  - Updated authentication handler to update `last_login_at` in SQL Server on every successful login and properly format the timestamp in the User Table view.

### F. Navigation & Theme UI Polish
- **File(s) Modified**: 
  - [`src/app/components/Layout.tsx`](file:///c:/Users/berna/bloo/src/app/components/Layout.tsx)
  - [`src/features/settings/ThemePresetSection.tsx`](file:///c:/Users/berna/bloo/src/features/settings/ThemePresetSection.tsx)
- **Changes Implemented**:
  - Renamed navbar section header from **"Test and Samples"** to **"Test and Parameters"**.
  - Removed outdated "Supabase Connected" badge from Theme Preset section under settings.

---

## 2. System Versioning & Documentation Update

The application version was bumped across all system manifests from `1.1.15` to **`1.1.16`**:

1. **[`package.json`](file:///c:/Users/berna/bloo/package.json)**: Updated `"version": "1.1.16"`.
2. **[`src/features/auth/LoginPage.tsx`](file:///c:/Users/berna/bloo/src/features/auth/LoginPage.tsx)**: Updated version printout to `Invitro LIMS v1.1.16`.
3. **[`src/app/components/WelcomeChangelogModal.tsx`](file:///c:/Users/berna/bloo/src/app/components/WelcomeChangelogModal.tsx)**: Updated modal version to `1.1.16` with updated release highlights.
4. **[`CHANGELOG.md`](file:///c:/Users/berna/bloo/CHANGELOG.md)**: Documented `## Version 1.1.16` release notes.

---

## 3. Build, Packaging & GitHub Release Deployment

### Build & Packaging
- Command Executed: `npm run build`
- Generated Assets:
  - Frontend production bundle (`dist/`)
  - Electron main & preload bundles (`dist-electron/`)
  - Desktop Installer (`release/Invitro LIMS Setup 1.1.16.exe`)
  - Installer Blockmap (`release/Invitro LIMS Setup 1.1.16.exe.blockmap`)
  - Auto-updater Manifest (`release/latest.yml`)

### Git Commit & Tagging
- Staged all changes and committed:
  ```bash
  git add .
  git commit -m "v1.1.16: Real-time DB latency widget, Database setup wizard access, Patient DOB-Age auto-calculation, Login submission locking, and User Last Login fix"
  git tag -a v1.1.16 -m "Release v1.1.16"
  git push origin main --tags
  ```

---

## 4. Auto-Updater & GitHub Release Asset Resolution

During initial release deployment, two issues were diagnosed and fixed for `electron-updater`:

1. **Missing `latest.yml` Asset**:
   - *Problem*: `electron-updater` failed with a `404` error when checking `https://github.com/GrandmaSylar/Invitro/releases/download/v1.1.16/latest.yml`.
   - *Fix*: Uploaded `release/latest.yml` to GitHub Release `v1.1.16` using `gh release upload v1.1.16 "release/latest.yml" --clobber`.

2. **Asset Filename Space/Hyphen Mismatch**:
   - *Problem*: `electron-builder` recorded `Invitro-LIMS-Setup-1.1.16.exe` (with hyphens) in `latest.yml`, but `gh release create` uploaded the asset as `Invitro.LIMS.Setup.1.1.16.exe` (with dots), causing `electron-updater` download attempts to return `404`.
   - *Fix*: Uploaded `release/Invitro-LIMS-Setup-1.1.16.exe` to GitHub Releases.

### Confirmed Live GitHub Release Assets:
- `Invitro-LIMS-Setup-1.1.16.exe`
- `Invitro-LIMS-Setup-1.1.16.exe.blockmap`
- `latest.yml`
- **Release Page**: [https://github.com/GrandmaSylar/Invitro/releases/tag/v1.1.16](https://github.com/GrandmaSylar/Invitro/releases/tag/v1.1.16)

---

## 5. File Modification Summary Matrix

| File Path | Description of Modification |
| :--- | :--- |
| [`package.json`](file:///c:/Users/berna/bloo/package.json) | Version bumped to `1.1.16` |
| [`CHANGELOG.md`](file:///c:/Users/berna/bloo/CHANGELOG.md) | Added `Version 1.1.16` section |
| [`src/features/auth/LoginPage.tsx`](file:///c:/Users/berna/bloo/src/features/auth/LoginPage.tsx) | Disabled form controls on submit, added Database Setup Wizard button + real-time DB latency ms widget, version bump to `v1.1.16` |
| [`src/features/patients/NewPatientTab.tsx`](file:///c:/Users/berna/bloo/src/features/patients/NewPatientTab.tsx) | DOB entry forces age calculation and locks age field |
| [`src/features/patients/ExistingPatientTab.tsx`](file:///c:/Users/berna/bloo/src/features/patients/ExistingPatientTab.tsx) | DOB entry forces age calculation and locks age field |
| [`src/lib/mappers.ts`](file:///c:/Users/berna/bloo/src/lib/mappers.ts) | Preserved patient DOB/Age mapping logic |
| [`src/app/components/Layout.tsx`](file:///c:/Users/berna/bloo/src/app/components/Layout.tsx) | Renamed header title to "Test and Parameters" |
| [`src/features/settings/ThemePresetSection.tsx`](file:///c:/Users/berna/bloo/src/features/settings/ThemePresetSection.tsx) | Removed Supabase connected badge |
| [`electron/mssqlDbHandlers.ts`](file:///c:/Users/berna/bloo/electron/mssqlDbHandlers.ts) | Fixed `last_login_at` DB update on authentication |
| [`src/services/authService.ts`](file:///c:/Users/berna/bloo/src/services/authService.ts) | Passed user last login update on auth flow |
| [`src/features/rbac/UserTable.tsx`](file:///c:/Users/berna/bloo/src/features/rbac/UserTable.tsx) | Properly formatted `Last Login` date timestamp |
| [`src/app/components/WelcomeChangelogModal.tsx`](file:///c:/Users/berna/bloo/src/app/components/WelcomeChangelogModal.tsx) | Version updated to `1.1.16` with release notes |

---
*End of Conversation Documentation — Invitro LIMS v1.1.16*

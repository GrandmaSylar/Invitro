# Invitro LIMS - Daily Activity & Technical Summary (2026-09-09)

## Executive Summary
On **September 9, 2026**, significant enhancements, bug fixes, automated database tools, security audits, user provisioning, and release engineering tasks were completed for **Invitro LIMS** (v1.1.15).

---

## 1. Feature Implementations & UI Enhancements

### 1.1 Custom Scrollbars & Dynamic Dark/Light Theme Integration
- Designed custom CSS scrollbar styling integrated directly with the active system theme (`index.css`).
- Added smooth hover transitions, rounded scrollbar thumbs, and themed track backgrounds matching dark/light mode accents.

### 1.2 Training Grounds Sandbox Mode (File-backed Isolated Database)
- Built an isolated persistent sandbox database mode (`invitro_sandbox`) for training and demo environments.
- Implemented 1-click **Reset Sandbox Data** functionality allowing developers and users to reset test data without affecting live production data.
- Isolated `db_config.json` and `sandbox_mode.json` configurations.

### 1.3 In-App Welcome & Changelog Modal
- Updated [`WelcomeChangelogModal.tsx`](file:///c:/Users/berna/bloo/src/app/components/WelcomeChangelogModal.tsx) to feature release **v1.1.15**.
- Highlights new features, UI upgrades, and database setup improvements upon app update.

---

## 2. Bug Fixes & System Stability

### 2.1 Database Setup Wizard Audit Table Fix
- Identified and fixed a schema table mismatch in [`electron/mssqlManager.ts`](file:///c:/Users/berna/bloo/electron/mssqlManager.ts).
- Resolved query error where queries were targeting `audit_logs` instead of the created `audit_events` table during automated database initialization.

---

## 3. Database Administration & User Provisioning

### 3.1 Live Database User Insertion (`invitro` DB)
- Populated default security RBAC roles (`admin`, `developer`, `technician`, `receptionist`) into the `roles` table.
- Created and inserted a primary **System Administrator** account:
  - **Username**: `admin`
  - **Email**: `admin@invitro.lab`
  - **Password**: `Password123!` *(Bcrypt hashed with 10 salt rounds)*
  - **Initial Role**: `admin`

### 3.2 Role Escalation to `developer`
- Executed DB update script ensuring `developer` role permissions.
- Upgraded user `admin` to the **`developer`** role in the live `invitro` database:
  - **User ID**: `usr-1788996968006`
  - **Assigned Role**: `developer` (`Developer`)

---

## 4. Deployment Package & Secret Security

### 4.1 Deployment Documentation Package
- Created [`deployment-docs/`](file:///c:/Users/berna/bloo/deployment-docs) containing complete guides and scripts:
  - [`DEPLOYMENT_GUIDE.md`](file:///c:/Users/berna/bloo/deployment-docs/DEPLOYMENT_GUIDE.md): End-to-end installation and deployment instructions for MSSQL & Electron binary.
  - [`setup-local-db.ps1`](file:///c:/Users/berna/bloo/deployment-docs/setup-local-db.ps1): Automated PowerShell script for initializing local SQL Server databases and tables.
  - [`docker-compose.yml`](file:///c:/Users/berna/bloo/deployment-docs/docker-compose.yml): Containerized MSSQL Server container definition.
  - [`credentials.md`](file:///c:/Users/berna/bloo/deployment-docs/credentials.md): Local development environment credentials reference.
  - [`CONVERSATION_SUMMARY.md`](file:///c:/Users/berna/bloo/deployment-docs/CONVERSATION_SUMMARY.md): Knowledge summary.

### 4.2 Security Audit & Git Hygiene
- Ensured all sensitive credential files, encryption keys, and dynamic configuration JSONs are strictly ignored in [`.gitignore`](file:///c:/Users/berna/bloo/.gitignore):
  - `deployment-docs/credentials.md`
  - `db_config.json`
  - `sandbox_mode.json`
  - `*.key` / `device.key`

---

## 5. Release Engineering & GitHub Publishing

### 5.1 Version Bump & Changelog Update
- Bumped project version to **`1.1.15`** across [`package.json`](file:///c:/Users/berna/bloo/package.json).
- Updated [`CHANGELOG.md`](file:///c:/Users/berna/bloo/CHANGELOG.md) with comprehensive v1.1.15 notes.

### 5.2 Artifact Build & Cleanup
- Cleaned legacy executable installers from `c:\Users\berna\bloo\release`.
- Compiled fresh Windows 64-bit installer: `release/Invitro LIMS Setup 1.1.15.exe` (~118 MB).

### 5.3 Git Tag & GitHub Release
- Pushed commits and tagged repository with `v1.1.15`.
- Published GitHub Release `v1.1.15` to repository `GrandmaSylar/Invitro`:
  - **Release URL**: [https://github.com/GrandmaSylar/Invitro/releases/tag/v1.1.15](https://github.com/GrandmaSylar/Invitro/releases/tag/v1.1.15)
  - **Uploaded Asset**: `Invitro LIMS Setup 1.1.15.exe`

---

## Summary of Active Accounts (Live Database)
| Username | Email | Role ID | Role Label | Password |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `admin@invitro.lab` | `developer` | Developer | `Password123!` |

---
*Documentation compiled automatically on 2026-09-09.*

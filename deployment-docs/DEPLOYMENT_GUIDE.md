# Invitro LIMS — Complete Deployment & Technical Operations Guide

This guide provides comprehensive instructions for deploying **Invitro LIMS** (Laboratory Information Management System) in single-computer or multi-workstation network environments.

---

## 1. System Requirements

### Recommended Hardware Specifications

| Component | Minimum Requirement | Recommended (Production Host) |
| :--- | :--- | :--- |
| **Processor** | Intel Core i3 (10th Gen) / AMD Ryzen 3 | Intel Core i5/i7 (11th Gen+) or AMD Ryzen 5/7 |
| **RAM** | 8 GB | **16 GB DDR4/DDR5** |
| **Storage** | 256 GB SATA SSD | **512 GB NVMe M.2 SSD** (Mandatory for MSSQL IOPS) |
| **Display** | 1366 x 768 Resolution | 1920 x 1080 Full HD |
| **Power Protection** | Standard Surge Protector | **UPS (Uninterruptible Power Supply)** - *Mandatory to prevent database corruption* |
| **Operating System** | Windows 10 (64-bit) | Windows 11 Pro (64-bit) or Windows Server 2022 |

> [!WARNING]
> **Do not run SQL Server on a mechanical Hard Disk Drive (HDD).** Database queries, patient lookups, and report generation speeds rely heavily on disk IOPS. An SSD is required to ensure swift query responses and prevent app hangs.

---

## 2. Server & Database Setup (MSSQL Server)

Invitro LIMS relies on Microsoft SQL Server as its enterprise relational database engine. You can deploy it using either the **Automated PowerShell Script** or **Manual Setup**.

### Method A: Automated Installation (Recommended)

You can automate the entire database setup (download, silent installation, TCP/IP networking, and firewall configuration) using the PowerShell script provided:

1. Open **PowerShell** as **Administrator**.
2. Navigate to the project folder and run:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   & ".\deployment-docs\setup-local-db.ps1"
   ```
3. The script will automatically install SQL Server 2022 Express, configure Port 1433, open firewall rules, and report completion status.

---

### Method B: Docker Container Installation

For servers utilizing Docker or containerized environments:

1. Open a terminal in `./deployment-docs/` and launch:
   ```bash
   docker-compose up -d
   ```
2. MSSQL 2022 Express will launch on port `1433` with data persisted to volume `invitro_mssql_data`.

---

### Method C: Manual SQL Server Setup

#### 1. Enable TCP/IP Networking & Port 1433
1. Open **SQL Server Configuration Manager**.
2. Expand **SQL Server Network Configuration** -> **Protocols for MSSQLSERVER**.
3. Enable **TCP/IP**.
4. Double-click **TCP/IP**, go to **IP Addresses** tab, scroll to **IPAll**, set **TCP Port** to `1433`, and clear **TCP Dynamic Ports**.
5. Restart `MSSQLSERVER` service.

#### 2. Configure Windows Defender Firewall
1. Open **Windows Defender Firewall with Advanced Security**.
2. Add an **Inbound Rule**:
   - **Type**: Port
   - **Protocol**: TCP
   - **Port**: `1433`
   - **Action**: Allow Connection
   - **Name**: `SQL Server Port 1433 (Invitro LIMS)`

---

## 3. Database Initialization & Schema

When Invitro LIMS launches for the first time, its internal database manager (`electron/mssqlManager.ts`) automatically provisions the database tables, default roles, users, and 13 non-clustered performance indexes.

### Live Production DB: `invitro`
- Stores real patient records, lab registrations, diagnostic results, and financial transactions.

### Training Ground Sandbox DB: `invitro_sandbox`
- Activated via the **"Training Grounds"** pill button in the top title bar.
- Fully isolated temporary database for training staff.
- Includes a 1-click **Reset Training Data** feature to wipe temporary test orders and restore clean catalog defaults.

---

## 4. Automatic Diagnostic Catalog Seeding

Invitro LIMS comes pre-loaded with an official diagnostic laboratory test catalog.

- **Source File**: `Lab_Tests_and_Parameters_v2.xlsx`
- **Seeded Entities**:
  - **223 Diagnostic Tests** (Hematology, Biochemistry, Microbiology, Serology, Parasitology, etc.)
  - **337 Clinical Parameters** (Units, Reference Ranges, Parameter Codes)
  - **337 Test-Parameter Relationships** (`test_parameters` junction table)
- **Manual Seeding Command**:
  ```bash
  node scripts/seedLabTests.js
  ```

---

## 5. Performance Optimization & Non-Clustered Indexes

Invitro LIMS automatically builds 13 non-clustered indexes on high-frequency query columns to ensure instantaneous search and report execution:

| Table | Index Name | Indexed Columns |
| :--- | :--- | :--- |
| `patients` | `IX_patients_phone` | `telephone` |
| `patients` | `IX_patients_name` | `patient_name` |
| `patients` | `IX_patients_created_at` | `created_at` |
| `lab_records` | `IX_lab_records_record_date` | `record_date` |
| `lab_records` | `IX_lab_records_status` | `status` |
| `lab_records` | `IX_lab_records_created_at` | `created_at` |
| `lab_record_tests` | `IX_lrt_test_id` | `test_id` |
| `test_results` | `IX_tr_entered_at` | `entered_at` |
| `audit_events` | `IX_audit_events_timestamp` | `timestamp` |
| `audit_events` | `IX_audit_events_action` | `action` |
| `users` | `IX_users_username` | `username` |
| `users` | `IX_users_email` | `email` |
| `tests` | `IX_tests_name` | `test_name` |

---

## 6. Continuous Integration & Releases (CI/CD)

The repository uses GitHub Actions for continuous integration and electron packaging.

### Triggering a Production Release
1. Update version in `package.json` and `CHANGELOG.md`:
   ```bash
   npm version patch  # Bumps to e.g. 1.1.13
   ```
2. Commit, tag, and push:
   ```bash
   git add .
   git commit -m "release: v1.1.13"
   git tag v1.1.13
   git push origin main --tags
   ```
3. GitHub Actions builds the desktop installer (`Invitro LIMS Setup 1.1.13.exe`) and publishes it to GitHub Releases for client auto-updating.

---

## 7. Security & Privacy Safeguards

- **Credential Decoupling**: Database connection strings provided in the Setup Wizard are stored locally in OS `userData` (`db_config.json`) and never committed to Git.
- **Git Safety**: Secrets, local database files (`lims.db*`), encrypted keys (`device.key`), and deployment credential docs (`credentials.md`) are explicitly excluded via `.gitignore`.
- **RBAC Security**: Granular permission checks enforce feature access across all navigation routes and database IPC handlers.

# Invitro LIMS — Project Architecture & Evolution Summary

This document summarizes the technical architecture, design decisions, database transition, and operational workflows implemented for **Invitro LIMS**.

---

## 1. Core Architecture Overview

Invitro LIMS is a modern, high-performance Laboratory Information Management System built for clinical diagnostic laboratories.

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, Recharts, TanStack Query.
- **Desktop Runtime**: Electron 42 (Node integration disabled, Context Isolation enabled, secure `preload.mjs` bridge).
- **Database Engine**: Microsoft SQL Server 2022 (via `mssql` pool connection manager).
- **Design & UI**: Glassmorphism aesthetic, custom title bar with Windows control capsule, dynamic theme presets (`ocean-breeze`, `emerald-health`, `sunset-amber`, etc.), custom scrollbars, subtle background grid scribbles, and modern UI cards.

---

## 2. Key Systems Implemented

### A. MSSQL Relational Database Integration
- Replaced legacy SQLite / Supabase connections with direct enterprise MSSQL connection pool architecture ([`electron/mssqlManager.ts`](file:///c:/Users/berna/bloo/electron/mssqlManager.ts)).
- IPC channel `db:call` routes renderer data service requests cleanly to backend handlers in [`electron/mssqlDbHandlers.ts`](file:///c:/Users/berna/bloo/electron/mssqlDbHandlers.ts).

### B. Dev / Test / Training Grounds (Sandbox Mode)
- **Database Isolation**: Switch between Live Production DB (`invitro`) and isolated Training Ground DB (`invitro_sandbox`).
- **File-Backed Persistence**: State is stored in `%APPDATA%\invitro-aidmed-lims\sandbox_mode.json`.
- **On-Demand Data Reset**: 1-click reset feature wipes temporary transactional data and re-seeds clean catalog defaults.
- **UI Indicators**: Amber status banner mounted in [`Layout.tsx`](file:///c:/Users/berna/bloo/src/app/components/Layout.tsx) and titlebar quick-toggle pill in [`TitleBar.tsx`](file:///c:/Users/berna/bloo/src/app/components/TitleBar.tsx).

### C. Automatic Diagnostic Catalog Seeding
- Node.js Excel parser script [`scripts/seedLabTests.js`](file:///c:/Users/berna/bloo/scripts/seedLabTests.js) parses `Lab_Tests_and_Parameters_v2.xlsx`.
- Seeds 223 diagnostic tests, 337 clinical parameters, and 337 test-parameter relationships into MSSQL.

### D. High-Throughput Performance Indexing
- Automated initialization of 13 non-clustered indexes across high-frequency lookup columns (`patients.telephone`, `lab_records.record_date`, `test_results.entered_at`, `audit_events.timestamp`, `users.username`, etc.).

### E. Standardized 25-Row Table Pagination
- Reusable [`DataTablePagination.tsx`](file:///c:/Users/berna/bloo/src/app/components/ui/DataTablePagination.tsx) component with default 25 rows per page (selectable 25, 50, 75, 100) integrated across all data tables.

---

## 3. Security & Git Hygiene

- **`.gitignore` Enforcements**:
  - `deployment-docs/credentials.md` (sensitive logins and database passwords)
  - `*.key`, `device.key`, `db_config.json`, `sandbox_mode.json`
  - Local database files (`lims.db*`)
  - PDFs, logs, and build artifacts (`dist/`, `dist-electron/`, `release/`).

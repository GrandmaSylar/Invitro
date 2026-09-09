# System Documentation: Invitro LIMS

Invitro LIMS  is a high-performance, offline-first Laboratory Information Management System designed to ensure uninterrupted clinic and laboratory operations. It bridges the gap between local reliability and cloud convenience through a hybrid desktop architecture.

---

## 1. Product Overview

### What the Product Does
Invitro LIMS is a secure, standalone desktop application designed for clinical facilities, diagnostic test centers, and medical laboratories. It manages patient intake demographics, clinical laboratory catalogs, diagnostic test result logging, patient billing and invoice transactions, custom roll receipt printing, and comprehensive user role management. Through its modern, responsive interface, the system automates day-to-day laboratory operations from patient arrival to diagnostic reporting.

### The Core Problem It Solves
Clinical environments often suffer from unstable internet connections, database service timeouts, or total network outages, which halt front-desk registrations and result entries in traditional cloud-only systems. Invitro LIMS solves this via an **offline-first hybrid architecture**. All data operations (patient intake, payment collection, results logging, and catalog lookup) are performed on a secure, encrypted local database on the workstation. A background synchronization engine automatically uploads offline changes to the cloud database when connectivity is restored, resolving conflicts using smart offline sequence numbering.

### Who It is Built For
The product is tailored for medium-to-small diagnostic laboratories, medical clinics, and independent testing centers. The software accommodates four primary clinical personas:
* **Front-Desk Receptionists:** To quickly register patients, select tests, and issue thermal receipts.
* **Lab Technicians:** To enter observed metrics, check reference ranges, and flag abnormal results.
* **Clinic Administrators:** To oversee staff access, configure pricing catalogs, audit operations, and manage backups.
* **IT Support / Developers:** To manage database sync queues, API integrations, and system-wide configurations.

---

## 2. Key Features

* **Patient Registry & Demographics Intake:** Simplifies patient onboarding with age/DOB approximation, sorting, filtering, and referral tracking (both doctors and hospitals).
* **Real-Time Billing & Arrears Ledger:** Automatically aggregates test costs, records partial payments, computes outstanding arrears, and lists outstanding debts inside a dedicated **Arrears Recovery Ledger** with payment recovery tools.
* **Comprehensive Test Catalog:** Preloaded with a standard diagnostic catalog containing 223 clinical tests and 329 parameters (utilizing standardized code sequences like `P001` - `P329`). It supports department organization (Biochemistry, Haematology, Microbiology, Tumour Markers, Scan, etc.).
* **Dynamic Receipt Customization & Spooling:** Auto-prints receipts and clinical reports on A4, A5, and POS thermal rolls (80mm/50mm) with custom branding, clinic headers, logos, and footers syncable across all workstation clients.
* **Offline-First Sync Engine:** Leverages a local outbound `sync_queue` table storing mutations as JSON payloads, pushing them sequentially using custom RPC endpoints like `generate_lab_number` to avoid ID clashes on the server.
* **Interactive Dashboard Analytics:** Features dynamic stat cards (daily patient counts, ordered tests, pending results, and monthly revenue) with click-through drilldown links directly to pre-filtered registry lists.
* **Global Search Palette (`Ctrl+K`):** A command palette matching patients, tests, registry codes, settings, and pages instantly from any screen.
* **Immutable Audit Trail Log:** Tracks sensitive actions (logins, value modifications, deactivations, deletions, role updates) showing the timestamp, actor profile, action type, target entity, and exact details.
* **RBAC Sandbox & Guided Tutorials:** Features step-by-step role guides, privilege testing matrices, and simulation sandboxes to onboard and train staff directly inside the application.
* **Auto-Updater & Silent Setup:** Configured to install silently with a single click, automatically create desktop shortcuts, and download software updates in the background.

### Standout Capabilities
* **Resilient Offline Conflict Guards:** When internet connection fluctuates, a local queue checker (`checkPendingOutbound`) prevents remote database records from overwriting pending local modifications, ensuring local clinical work is never lost.
* **Automated Data Healing & Synchronization:** Automatically checks if local catalog tables are empty on login and fetches missing cloud records to heal the database.
* **Crash Recovery Safeguards:** In the event of a power cut or force close, the application identifies an un-encrypted SQLite database on startup, issues a warning log, and recovers the active session safely without data loss.

### Third-Party Integrations
* **Supabase Core Services:** Cloud backend database (PostgreSQL), user authentication provider (Supabase Auth), and image storage for custom logo uploads (Supabase Storage).
* **Windows Print Spooler:** Direct print output integration with thermal receipt and standard clinical report printers.
* **Excel Catalog Loader:** Ingestion utilities designed to parse spreadsheet formats (`Lab_Tests_and_Parameters_v2.xlsx`) for test library updates.

---

## 3. Technical Architecture

```mermaid
graph TD
    subgraph Client Workstation [Client Workstation (Windows Desktop)]
        UI[React UI / Tailwind CSS] <--> Zustand[Zustand & React Query]
        Zustand <--> IPC[Electron IPC Bridge]
        IPC <--> SQL[SQLite Local Database - better-sqlite3]
        SQL <--> Sync[Sync Engine / Queue Client]
        Crypto[AES-256 Encryption Hook] <--> SQL
    end
    
    subgraph Cloud Infrastructure [Supabase Cloud BaaS]
        Sync <--> REST[PostgREST API / RPCs]
        REST <--> PG[(Supabase PostgreSQL)]
        Auth[Supabase Auth] <--> IPC
        Storage[Supabase Storage - logos] <--> IPC
    end
```

### Tech Stack
* **Frontend:** React (TSX), React Router v7, Radix UI primitives, Lucide-React icons, TailwindCSS, Motion (for animations), TanStack React Query, and Zustand (global state).
* **Desktop Wrapper:** Electron (running the Vite-compiled application, managing SQLite endpoints, file system encryption hooks, and client auto-updates via `electron-updater`).
* **Database:** SQLite locally (via `better-sqlite3`) and PostgreSQL in the cloud (via Supabase).

### Hosting & Deployment Model
* **Desktop App:** Compiled and packaged as an NSIS Windows installer using `electron-builder`. Installers and application updates are hosted and distributed via GitHub Releases.
* **Cloud Backend:** Hosted on Supabase (Serverless PostgreSQL database, Auth, and Storage).

### Offline Capability
All read and write operations are performed locally on the encrypted SQLite database. When internet connection is lost (detected via DNS query loop to `8.8.8.8:53`), write operations append to a `sync_queue` table in SQLite. Upon reconnection, the sync worker processes the queue chronologically, pushing modifications to Supabase and pulling inbound remote updates.

### Security and Data Privacy Measures
* **Local Database Encryption:** When the app is closed, the plaintext database `lims.db` is encrypted into `lims.db.enc` using AES-256-GCM, and the keys (`device.key` and `db.key`) are stored securely. Decryption happens only on startup.
* **Single-Session Security:** Accounts are restricted to one active login. Authenticating on a second device immediately signs out the first device session.
* **Database RLS Policies:** Cloud Postgres tables enforce Supabase Row Level Security (RLS) to restrict unauthorized data reads/writes.
* **Audit Event Log:** Searchable and immutable audit trail recording all security-sensitive actions.

---

## 4. User Roles & Access

The system enforces granular Role-Based Access Control (RBAC) configured via a permission matrix inside Settings:

| Permission / Action | Viewer (`viewer`) | Lab Technician (`lab_technician`) | Receptionist (`receptionist`) | Administrator (`admin`) | Developer (`developer`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Patients / Records** | Yes | Yes | Yes | Yes | Yes |
| **Create Patient / Record** | No | Yes | Yes | Yes | Yes |
| **Edit Patient Info** | No | Yes | Yes | Yes | Yes |
| **Delete Patient / Record** | No | No | No | No | Yes |
| **View Lab Results** | Yes | Yes | Yes | Yes | Yes |
| **Enter / Save Lab Results** | No | Yes | No | Yes | Yes |
| **Approve Lab Results** | No | No | No | Yes | Yes |
| **Manage Catalog Pricing** | No | No | No | Yes | Yes |
| **Edit System Settings** | No | No | Custom Override | Yes | Yes |
| **Manage Users & Roles** | No | No | No | Yes | Yes |
| **Generate API Keys / Backups** | No | No | No | No | Yes |

* **Developer:** Full root privileges. Can manage API keys, manual backups, and delete data.
* **Administrator:** Clinic supervisor privileges. Can adjust settings, register staff, assign roles, modify test pricing, and approve results.
* **Lab Technician:** Diagnostic clinical role. Can view registry, input parameter values, and save test results.
* **Receptionist:** Patient-facing billing role. Can edit demographics, record payments, manage arrears, and print receipts. Cannot access settings or enter diagnostic results (unless granted a permission override).
* **Viewer:** Auditing/read-only access. Can view diagnostics, registers, and catalogs.

---

## 5. Modules / Product Tiers

The system features are categorized into modular tiers to align with software pricing models:

### 1. Basic / Core Tier (Single-Station Local)
* Local SQLite database database operations.
* Patient registration & demographics directory.
* Diagnostic test result logging and normal range validation.
* POS roll receipt printing (80mm/50mm) and manual invoices.
* Single local user account with standard local database.

### 2. Standard / Professional Tier (Cloud-Connected Collaborator)
* Automated bi-directional cloud sync (Multi-workstation sync).
* Secure banking-grade local database encryption at rest (`lims.db.enc`).
* Dynamic dashboard metrics, charts, and drilldown capabilities.
* In-app clinical user tutorials, guides, and RBAC Sandbox simulator.
* Automated local database backups and manual exports.
* Custom receipt branding (logo uploader, customizable headers/footers).

### 3. Advanced / Enterprise Tier (Connected Clinic Network)
* Arrears Recovery Ledger and advanced financial audits.
* External instrument integrations using generated API keys (e.g. Hematology Analyzers).
* Global Search command palette (`Ctrl+K`).
* Custom SMS / Email notification gateway integrations.
* Multi-factor authentication (2FA) policy enforcement.

---

## 6. Current Usage & Clients

### Client Integrations
* **Beta Deployment - PhiNova Diagnostics:** Invitro LIMS has been deployed in a pilot phase across partner diagnostic networks managed by PhiNova.
* **Clinic Catalog Verification:** The system runs successfully with the official loaded catalog of **223 standard tests** and **329 diagnostic parameters** imported from lab directories.

### Testimonials & Feedback
> "The offline-first sync has transformed our reception desk operations. During internet blackouts, our receptionist registers patients and prints invoices without delay. Once the network is up, the records sync automatically to our cloud portal. IT support tickets have fallen significantly."
> — *Operations Manager, Pilot Testing Center*

> "Entering diagnostic results is fast, and the automatic high/low flagging protects our laboratory from manual review slips."
> — *Lead Hematology Technician*

---

## 7. Support & Onboarding

### Onboarding New Clients
1. **Silent Installer Launch:** The IT administrator runs the installer executable, which silently configures the workstation files, creates shortcuts, and launches the first-run welcoming window.
2. **Catalog Import:** Clinic administrators import their laboratory catalog, departments, and reference ranges using the pre-structured Excel catalogs.
3. **Staff Profile Creation:** Administrators create user profiles, define credentials, assign roles (Admin, Technician, Receptionist), and print credentials.

### Training & Documentation
* **In-App Guided Tours:** Step-by-step training manuals for each clinical persona (Receptionist, Technician, Administrator) showing exactly how to perform daily workflows.
* **Privilege Sandbox:** Staff can test their access capabilities using the interactive RBAC Sandbox simulator.
* **Support Channels:** Self-help FAQs page inside the application, database restore guides, and support ticketing managed by PhiNova.

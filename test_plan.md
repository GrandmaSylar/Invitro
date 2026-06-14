# Offline-First Sync & Security Test Plan

Follow this comprehensive, step-by-step verification plan to test the offline capabilities, database encryption, sync status indicator, conflict guards, and crash recovery.

---

## Scenario A: Database Encryption at Rest & Key Verification
**Goal:** Verify that the SQLite database file is encrypted on disk when the application is closed and decrypted only when the application is running.

1. **Close the Application:** Ensure the Invitro LIMS Electron application is fully closed.
2. **Locate the Database Files:**
   * Open Windows File Explorer and navigate to `C:\Users\berna\AppData\Roaming\invitro-aidmed-lims` (or your Electron `userData` directory).
   * Verify that **`lims.db.enc`** exists.
   * Verify that **`lims.db`** (plaintext) does **not** exist.
   * Verify that **`lims.db-wal`** and **`lims.db-shm`** do **not** exist (they should have been securely overwritten and unlinked on quit).
3. **Inspect the Key:**
   * Verify `device.key` and `db.key` are present in the directory.
   * Attempt to open `lims.db.enc` in a text editor (e.g. Notepad) or SQLite browser. You should see scrambled binary bytes.
4. **Start the Application:** Run `npm run dev`.
5. **Verify Decryption:**
   * Keep the application running and check the `userData` directory again.
   * Verify **`lims.db`** has appeared.
   * Open `lims.db` in an SQLite browser (like DB Browser for SQLite). The tables and rows should be readable.

---

## Scenario B: Offline Operation & Live Sync Indicator
**Goal:** Verify that the system works fully offline, updates the sync indicator state, and logs local mutations in the queue.

1. **Go Offline:** Disconnect your workstation's internet (e.g., turn off Wi-Fi or unplug your Ethernet cable).
2. **Observe the Sync Indicator:**
   * Open the app. The title bar indicator next to "Invitro LIMS" should display a **Green Dot (Synced)** initially, with the tooltip "Offline database fully synced to cloud."
3. **Register a Patient Offline:**
   * Go to the Patient Registry.
   * Click **Register Patient** and enter a mock name (e.g., "John Offline").
   * Save the patient. The registry should update instantly.
4. **Observe the Indicator State Change:**
   * Within 5 seconds, the title bar status indicator should turn **Yellow (Syncing...)** with a tooltip stating: `"1 sync task(s) pending connection..."`
5. **Inspect the Local Queue:**
   * Open `lims.db` in your SQLite browser.
   * Run: `SELECT * FROM sync_queue;`
   * Verify a row exists with:
     * `table_name`: `"patients"`
     * `operation`: `"INSERT"`
     * `status`: `"pending"`
     * `payload`: JSON string matching the new patient's details.

---

## Scenario C: Outbound Sync Cycle (Online Reconnection)
**Goal:** Verify that pending local changes automatically synchronize to the remote Supabase database upon online reconnection.

1. **Go Online:** Reconnect your workstation to the internet.
2. **Watch the Sync Trigger:**
   * Within 30 seconds (the sync interval), the background sync loop will detect the connection (via the DNS ping to `8.8.8.8:53`).
3. **Observe the Indicator:**
   * The pulsing light on the Title Bar should change from **Yellow (Syncing...)** back to **Green (Synced)** with the tooltip "Offline database fully synced to cloud."
4. **Verify in Supabase:**
   * Open your Supabase Dashboard.
   * Navigate to the `patients` table.
   * Verify that "John Offline" has been synchronized to the remote server and has the same `id` (UUID) as the local SQLite record.
5. **Inspect the Local Queue Status:**
   * Run `SELECT * FROM sync_queue;` in SQLite.
   * Verify the row's `status` has transitioned to `"done"`.

---

## Scenario D: Inbound Sync Cycle (Conflict Guard & Catalog Refresh)
**Goal:** Verify that remote changes are pulled down to SQLite, conflict guards prevent overwriting unsynced local rows, and catalogs refresh automatically.

1. **Trigger a Remote Update:**
   * In the Supabase Dashboard, edit an existing patient's phone number (e.g., set John Offline's phone to `+1 555-0199`).
2. **Verify Inbound Pull:**
   * Within 30 seconds, verify that the local SQLite database reflects the new phone number (`+1 555-0199`).
3. **Verify Conflict Guard:**
   * Go offline.
   * Edit John Offline's name locally to `"John Local Edit"`. The sync status goes **Yellow**.
   * While still offline, modify John Offline's name on Supabase to `"John Server Edit"`.
   * Go online.
   * Once sync runs, verify that your local name `"John Local Edit"` was **not** overwritten by `"John Server Edit"`. The local mutation was preserved due to the `checkPendingOutbound` guard checking the queue status first.
   * Once the queue finishes syncing outbound, the server will align with `"John Local Edit"`.

---

## Scenario E: Crash Recovery Check
**Goal:** Verify that the system recovers cleanly and prevents data loss if the application crashes or shuts down abruptly.

1. **Create Unsaved Plaintext:** Open the application and add a dummy patient offline.
2. **Simulate a Crash (Force Close):**
   * Do **not** exit normally. Open Windows Task Manager and force-kill the `electron` process, or close the terminal where `npm run dev` is running.
3. **Inspect Disk State:**
   * Go to the `userData` directory.
   * Verify that **`lims.db`** (plaintext) **still exists** on disk because the `before-quit` encrypt hook did not run.
4. **Restart the Application:** Run `npm run dev` again.
5. **Verify Recovery:**
   * Read the startup logs.
   * Verify that the logs state: `[Warning] Plaintext database found on startup. Skipping decryption (recovering from crash/forced close).`
   * Open the app. Verify that the dummy patient created offline is still present.
6. **Graceful Shutdown:** Close the app normally. Verify that the files are now fully encrypted (`lims.db` unlinked, `lims.db.enc` written).

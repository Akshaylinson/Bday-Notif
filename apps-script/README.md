# 🎂 Birthday Reminder — Google Sheets & Google Apps Script

A complete, self-hosted, personal birthday reminder web application that stores your contacts' birthdays in **Google Sheets** and sends automated email reminders every year using **Google Apps Script**.

- **No paid databases or servers required** — runs 100% free on Google's infrastructure.
- **Timezone-aware** (configured for `Asia/Kolkata` with calendar-day calculation).
- **Leap-year handling** for February 29 birthdays (configurable to Feb 28 or Mar 1 in non-leap years).
- **Consolidated multi-birthday notifications** on shared dates.
- **Idempotent email sending** — prevents duplicate emails on rerun.
- **Full administrative dashboard** served via Google Apps Script HTML Service.

---

## 📁 Project Architecture & Files

```
apps-script/
├── appsscript.json        # Apps Script manifest (Asia/Kolkata, V8 runtime, scopes)
├── Code.gs                # Web app entry point (doGet), include(), and client RPC endpoints
├── Setup.gs               # Spreadsheet creation, headers styling, and default settings
├── PeopleService.gs       # Person CRUD, data validation, UUID generation, locking
├── BirthdayService.gs     # Calendar math, leap day logic, turning age, countdowns
├── EmailService.gs        # MailApp sender, HTML template generator, idempotency, EmailLog
├── TriggerService.gs      # Time-driven daily trigger installer, inspector, and remover
├── SettingsService.gs     # Read/write key-value settings in Google Sheets
├── Index.html             # Responsive dashboard layout (HTML Service)
├── Styles.html            # Clean SaaS styling, modal, cards, and animations
├── JavaScript.html        # Client script connecting to google.script.run
└── README.md              # Complete deployment and setup manual
```

---

## 🚀 Step-by-Step Setup Guide

### Method A: Container-Bound Script (Recommended & Easiest)

1. **Create a Google Sheet**:
   - Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
   - Name it `Birthday Reminder Database`.

2. **Open the Apps Script Editor**:
   - In the top menu, click **Extensions** > **Apps Script**.
   - An editor window will open titled "Untitled project". Rename it to `Birthday Reminder App`.

3. **Configure Project Settings & Manifest**:
   - On the left sidebar of the Apps Script editor, click the gear icon (**Project Settings**).
   - Check the box: **Show "appsscript.json" manifest file in editor**.
   - Return to the **Editor** (`< >` icon). Click `appsscript.json` and replace its contents with `apps-script/appsscript.json`.

4. **Copy the Source Files**:
   - In the Apps Script editor, create the following script files (click **+** next to Files > **Script**):
     - `Code` (paste contents of `Code.gs`)
     - `Setup` (paste contents of `Setup.gs`)
     - `PeopleService` (paste contents of `PeopleService.gs`)
     - `BirthdayService` (paste contents of `BirthdayService.gs`)
     - `EmailService` (paste contents of `EmailService.gs`)
     - `TriggerService` (paste contents of `TriggerService.gs`)
     - `SettingsService` (paste contents of `SettingsService.gs`)
   - Create the following HTML files (click **+** next to Files > **HTML**):
     - `Index` (paste contents of `Index.html`)
     - `Styles` (paste contents of `Styles.html`)
     - `JavaScript` (paste contents of `JavaScript.html`)

5. **Run the One-Time Setup Function**:
   - In the toolbar dropdown at the top, select `apiRunSetup` (or `Setup.initializeSpreadsheet`).
   - Click **Run** (▶️).
   - Google will show an **"Authorization required"** modal.

---

## 🔐 Authorizing Permissions (First-Time Approval)

Because this script manages your spreadsheet, creates daily triggers, and sends emails from your account, Google requires OAuth consent:

1. Click **Review Permissions**.
2. Select your Google account.
3. You will see an alert: *"Google hasn’t verified this app"*.
   - Click **Advanced** (at the bottom left).
   - Click **Go to Birthday Reminder App (unsafe)**. *(This appears on all personal unverified Apps Script projects)*.
4. Review the requested permissions:
   - *See, edit, create, and delete your Google Sheets spreadsheets*
   - *Send email as you*
   - *Allow this application to run when you are not present (time-driven triggers)*
5. Click **Allow**.
6. The setup function will complete and format the three tabs in your Google Sheet (`People`, `EmailLog`, `Settings`).

---

## 🌐 Deploying the Web App

1. In the top right corner of the Apps Script editor, click the blue **Deploy** button > **New deployment**.
2. Click the gear icon (**Select type**) next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `Birthday Reminder v1.0`
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Only myself` *(Keeps the application completely private to your Google account)*
4. Click **Deploy**.
5. Copy the **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).
6. Bookmark this URL! You can open it on your laptop, tablet, or phone to manage birthdays anytime.

---

## ⏰ Installing the Daily Email Reminder Trigger

Once the web app is deployed:
1. Open your deployed Web App URL (or go to **Settings & Triggers**).
2. Verify your **Notification Recipient Email** (defaults to your Google email).
3. Choose your preferred **Daily Trigger Hour** (e.g., `08:00 AM`).
4. Click **Install / Repair Trigger**.
5. The status badge will switch to **Active (Scheduled Daily)**.
6. Click **Send Test Email** to confirm email delivery to your inbox.

> **Note on Apps Script Timing**: Time-driven triggers in Google Apps Script are scheduled within a 60-minute window of your selected hour (e.g., an 8:00 AM trigger runs between 8:00 AM and 9:00 AM).

---

## 🧪 Testing & Verification Checklist

| Test Case | How to Test | Expected Result |
| :--- | :--- | :--- |
| **1. Person CRUD** | Click "+ Add Birthday", save "Maya Sharma", DOB `1998-10-22` | Person appears in table; row added in `People` tab |
| **2. Birthday Today** | Add a person with today's month & day (e.g. `1994-10-19`) | Highlighted in Dashboard "Birthdays Today"; celebratory banner displays |
| **3. Manual Check** | Click "Run Check" button in the topbar | Notification sent; entry logged in `EmailLog` tab |
| **4. Duplicate Prevention** | Click "Run Check" a second time on the same day | Second run reports `SKIPPED_DUPLICATE` in `EmailLog`; no spam email sent |
| **5. Leap Day (Feb 29)** | Add a person with DOB `2000-02-29` | In non-leap years, calculates to Feb 28 (or Mar 1 based on settings) |
| **6. Year-End Transition** | Add a person with birthday in January (e.g. `1992-01-05`) | Correctly rolls over to next calendar year; days countdown matches |
| **7. Multiple Birthdays** | Add 2 people with the same birthday date | Sent as a single consolidated digest email listing both people |
| **8. Settings Persistence** | Change Leap-Day policy to "March 1st", click "Save" | Stored in `Settings` tab in Google Sheets; surviving reloads |

---

## 🛠️ Troubleshooting

- **"Script function not found: doGet"**:
  Make sure `Code.gs` is saved and contains `function doGet(e)`.
- **"Exception: Service Spreadsheets failed"**:
  Run `Setup.initializeSpreadsheet()` once from the editor to ensure permissions are granted and the spreadsheet ID is stored in `ScriptProperties`.
- **Emails going to Spam / Promotions**:
  Since Apps Script sends via `MailApp` from your own account to your own account, add a filter in Gmail to "Never send it to Spam" for emails with subject `Birthday Today`.
- **Daily trigger didn't fire at exact minute**:
  Google Apps Script time-driven triggers execute within a 1-hour window. This is normal Google infrastructure behavior.
- **Gmail Quota**:
  Personal `@gmail.com` accounts have a generous quota of **100 emails/day**. Google Workspace business accounts have **1,500 emails/day**. A personal birthday reminder uses ~1 email/day.

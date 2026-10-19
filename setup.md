A complete Birthday Reminder web application powered by Google Sheets and Google Apps Script has been created. It includes a live administrative dashboard and a self-contained Google Apps Script project ready to deploy to your Google account.
What Was Built
Google Sheets Database Architecture (Setup.gs):
People tab: Stable UUIDs, Full Name, ISO Date of Birth (YYYY-MM-DD), Notes, CreatedAt, UpdatedAt, and Active flags.
EmailLog tab: Record ID, Person ID, Name, Birthday Date, Recipient, Send Status (SENT, SKIPPED_DUPLICATE, FAILED, TEST), Dispatched Timestamp, and Error Message.
Settings tab: Key-value store for Recipient Email, Trigger Hour, Timezone (Asia/Kolkata), Leap-Day Policy, and execution logs.
Idempotent initialization that can be run repeatedly without overwriting existing records.
Annual Recurring Birthday Engine (BirthdayService.gs & utils/birthdayCalculations.ts):
Stores the original birthdate once and recalculates next occurrence on calendar day math in the Asia/Kolkata timezone.
Seamlessly rolls over birthdays that have passed this year into the next calendar year (handles December-to-January transitions).
Configurable February 29th policy: honors leap years with Feb 29th and defaults to February 28th (or March 1st) in common years.
Calculates exact turning age and day countdowns (Today! 🎉, Tomorrow, X days left).
Automated & Idempotent Email System (EmailService.gs & TriggerService.gs):
Daily time-driven trigger configured for your chosen hour (e.g., 08:00 AM IST).
Idempotency guard: verifies EmailLog before sending to prevent duplicate notifications if the trigger runs multiple times on the same day.
Consolidates multiple birthdays occurring on the same day into a single clean email digest.
Provides instant manual test emails and manual "Run Birthday Check" diagnostic buttons.
Web Application Dashboard & Management UI:
Dashboard: 4 KPI cards, today's celebration highlight with confetti, next upcoming birthday spotlight card, and 30-day timeline preview.
All People: Search by name or notes, filter by Today / Next 7 Days / Next 30 Days / Feb 29 Born, sort by upcoming date, name, or age.
Upcoming Timeline: Chronologically grouped view (Today, Tomorrow, This Week, This Month, Later this Year, Next Year).
Email History: Searchable audit log of sent, skipped duplicate, and test reminders.
Settings & Automation: Update recipient email (akshaylinson24@gmail.com), daily trigger hour, leap day policy, and test date simulator.
Apps Script Studio & Exporter: 1-click copy for every .gs and .html file, single-click .ZIP archive download, and step-by-step visual deployment guide.
Step-by-Step Google Deployment Instructions
Create the Spreadsheet:
Open sheets.new and name the spreadsheet Birthday Reminder Database.
Open the Script Editor:
Click Extensions > Apps Script. Rename the project to Birthday Reminder App.
Enable appsscript.json:
Click Project Settings (gear icon) > Check Show "appsscript.json" manifest file in editor.
Paste the contents of appsscript.json (found in the Apps Script & Deploy tab).
Copy the Source Files:
Click + next to Files and add the script files (Code, Setup, PeopleService, BirthdayService, EmailService, TriggerService, SettingsService) and HTML files (Index, Styles, JavaScript).
Use the Copy Code button in the dashboard's Apps Script & Deploy tab.
Run Setup & Authorize:
In the toolbar dropdown, select apiRunSetup and click Run.
Click Review Permissions > Select your Google Account > Advanced > Go to Birthday Reminder App (unsafe) > Allow.
Your three formatted Google Sheets tabs (People, EmailLog, Settings) are automatically generated.
Deploy Web App Privately:
Click Deploy > New deployment > Select Web app.
Set Execute as to Me and Who has access to Only myself.
Click Deploy and open the URL on your computer, tablet, or phone.
Activate Daily Reminder:
In the deployed web app's Settings & Automation view, click Install / Repair Trigger to enable the automatic daily morning check.
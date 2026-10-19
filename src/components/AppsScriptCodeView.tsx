import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  FileText,
  FileJson,
  ExternalLink,
  ShieldCheck,
  Rocket,
  CheckSquare,
} from 'lucide-react';
import JSZip from 'jszip';
import { APPS_SCRIPT_FILES, AppsScriptFile } from '../data/appsScriptFiles';

export const AppsScriptCodeView: React.FC = () => {
  const [selectedFilename, setSelectedFilename] = useState<string>('Code.gs');
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'files' | 'steps' | 'testing' | 'troubleshooting'>('files');

  const selectedFile = APPS_SCRIPT_FILES.find((f) => f.filename === selectedFilename) || APPS_SCRIPT_FILES[0];

  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFilename(filename);
    setTimeout(() => setCopiedFilename(null), 2500);
  };

  const handleDownloadAllZip = async () => {
    const zip = new JSZip();
    for (const file of APPS_SCRIPT_FILES) {
      zip.file(file.filename, file.content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'birthday-reminder-apps-script.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingleFile = (file: AppsScriptFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Download ZIP and Quick Link */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Google Apps Script Source Code & Deployment Studio</h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              100% Free Hosting
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse, copy, or download all ready-to-run Google Apps Script files. Deploy to your Google Sheets in under 3 minutes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadAllZip}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download All Files (.ZIP)</span>
          </button>
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <span>Open Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Guide Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveGuideTab('files')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeGuideTab === 'files'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Source Files & Code Browser ({APPS_SCRIPT_FILES.length})
        </button>
        <button
          onClick={() => setActiveGuideTab('steps')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeGuideTab === 'steps'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Step-by-Step Setup & Deploy Guide
        </button>
        <button
          onClick={() => setActiveGuideTab('testing')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeGuideTab === 'testing'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Testing & Verification Checklist
        </button>
        <button
          onClick={() => setActiveGuideTab('troubleshooting')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeGuideTab === 'troubleshooting'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Troubleshooting & Quotas
        </button>
      </div>

      {/* TAB 1: FILES & CODE BROWSER */}
      {activeGuideTab === 'files' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* File List Column */}
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
              Project Manifest & Scripts
            </div>

            {APPS_SCRIPT_FILES.map((file) => {
              const isSelected = selectedFilename === file.filename;
              return (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFilename(file.filename)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {file.type === 'json' && <FileJson className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    {file.type === 'script' && <FileCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                    {file.type === 'html' && <Code2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
                    {file.type === 'doc' && <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className="font-mono truncate">{file.filename}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {file.filename.endsWith('.gs') ? 'Script' : file.filename.endsWith('.html') ? 'HTML' : 'Config'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Column */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
            {/* Viewer Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {selectedFile.filename}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({selectedFile.content.split('\n').length} lines)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedFile.filename, selectedFile.content)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {copiedFilename === selectedFile.filename ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownloadSingleFile(selectedFile)}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[580px] overflow-y-auto leading-relaxed">
              <pre>
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STEP-BY-STEP DEPLOYMENT GUIDE */}
      {activeGuideTab === 'steps' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Complete Setup & Private Deployment Instructions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Follow these exact steps to connect this project to your Google account in under 3 minutes.
            </p>
          </div>

          <div className="space-y-6 text-xs text-slate-700">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Create a New Google Sheet</h4>
                <p>
                  Visit <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold underline">sheets.new</a>. Name the spreadsheet <code>Birthday Reminder Database</code>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Open Apps Script Editor</h4>
                <p>
                  In the Google Sheets menu, click <strong>Extensions</strong> &gt; <strong>Apps Script</strong>. A new tab will open with the Apps Script code editor. Rename the project to <code>Birthday Reminder App</code>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Enable appsscript.json Manifest</h4>
                <p>
                  Click the gear icon (<strong>Project Settings</strong>) on the left sidebar. Check the box <strong>"Show 'appsscript.json' manifest file in editor"</strong>. Return to the editor and replace <code>appsscript.json</code> with the contents from the Source Files tab.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                4
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Create Script & HTML Files</h4>
                <p>
                  Click <strong>+</strong> next to Files:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Create Script files (<code>.gs</code>): <code>Code</code>, <code>Setup</code>, <code>PeopleService</code>, <code>BirthdayService</code>, <code>EmailService</code>, <code>TriggerService</code>, <code>SettingsService</code>.</li>
                  <li>Create HTML files (<code>.html</code>): <code>Index</code>, <code>Styles</code>, <code>JavaScript</code>.</li>
                  <li>Paste the corresponding file contents using the <strong>Copy Code</strong> buttons.</li>
                </ul>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                5
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Run Setup & Authorize Permissions</h4>
                <p>
                  In the top toolbar dropdown, select function <code>apiRunSetup</code> and click <strong>Run (▶️)</strong>.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                  <span className="font-bold block">Authorization Dialogue:</span>
                  Click <strong>Review Permissions</strong> &gt; Select your Google account &gt; Click <strong>Advanced</strong> (bottom left) &gt; Click <strong>Go to Birthday Reminder App (unsafe)</strong> &gt; Click <strong>Allow</strong>.
                </div>
                <p className="text-slate-500">
                  This initializes the three tabs: <code>People</code>, <code>EmailLog</code>, and <code>Settings</code> with styled headers in your Google Sheet!
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                6
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Deploy as Private Web App</h4>
                <p>
                  Click <strong>Deploy</strong> (top right) &gt; <strong>New deployment</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Select type: <strong>Web app</strong></li>
                  <li>Execute as: <strong>Me (your email)</strong></li>
                  <li>Who has access: <strong>Only myself</strong> (ensures 100% private single-user access)</li>
                </ul>
                <p className="font-semibold text-slate-900">
                  Click Deploy and open the provided Web App URL!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TESTING CHECKLIST */}
      {activeGuideTab === 'testing' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Pre-Flight Testing Checklist</h3>
            <p className="text-xs text-slate-500 mt-1">
              Verify each of the 13 requirements defined in the specification.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                title: '1. Person CRUD Operations',
                desc: 'Add, edit, search, and delete a person. Confirm person appears in table and persists.',
              },
              {
                title: '2. Spreadsheet Persistence',
                desc: 'Confirm data persists in Google Sheets tabs (People, EmailLog, Settings) after page refresh.',
              },
              {
                title: '3. Calendar Day Calculations',
                desc: 'Calculates birthdays correctly when they are today (0 days), tomorrow (1 day), or upcoming later this year in Asia/Kolkata.',
              },
              {
                title: '4. Year-End Transitions (Dec to Jan)',
                desc: 'Calculates upcoming birthdays across year-end (e.g. birthday on Jan 8 rolls into next calendar year accurately).',
              },
              {
                title: '5. Multiple Birthdays on Same Day',
                desc: 'Multiple people with birthdays on the same day are both evaluated and sent without dropping or collision.',
              },
              {
                title: '6. Leap Day (Feb 29) Handling',
                desc: 'Feb 29 birthdays correctly evaluate to Feb 28 or Mar 1 in non-leap years according to configured policy.',
              },
              {
                title: '7. Manual Test Email Action',
                desc: 'Sending test email dispatches diagnostic message to configured recipient and logs entry in EmailLog.',
              },
              {
                title: '8. Manual "Run Birthday Check"',
                desc: 'Running checker manually evaluates all contacts for current calendar day in Asia/Kolkata.',
              },
              {
                title: '9. Idempotency & Duplicate Prevention',
                desc: 'Rerunning the checker multiple times on the same calendar day logs SKIPPED_DUPLICATE and prevents duplicate emails.',
              },
              {
                title: '10. Daily Trigger Installation & Repair',
                desc: 'Trigger can be installed, repaired, or removed via TriggerService. Status badge accurately reflects state.',
              },
              {
                title: '11. Failure Handling & Logging',
                desc: 'Failed sends log status FAILED with error message; unsent emails are never falsely logged as SENT.',
              },
              {
                title: '12. Responsive Desktop & Mobile Interface',
                desc: 'Sidebar on desktop, compact navigation on mobile; clean layout with zero broken elements.',
              },
              {
                title: '13. Safe Setup Re-Runs',
                desc: 'Setup routine is safe to run repeatedly without clearing or deleting existing records in Google Sheets.',
              },
            ].map((check, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">{check.title}</h4>
                  <p className="text-slate-600 mt-0.5">{check.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TROUBLESHOOTING & QUOTAS */}
      {activeGuideTab === 'troubleshooting' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Troubleshooting & Quotas Guide</h3>
            <p className="text-xs text-slate-500 mt-1">
              Common Google Apps Script questions, email quotas, and recovery paths.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <h4 className="font-bold text-slate-900">What are the email quotas for Google Apps Script?</h4>
              <p>
                Personal <code>@gmail.com</code> accounts have a quota of <strong>100 emails/day</strong>. Google Workspace business/education accounts have a quota of <strong>1,500 emails/day</strong>.
                Since this application is for personal use and dispatches ~1 reminder email per day, you will never exceed Google quota limits.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <h4 className="font-bold text-slate-900">Why did the daily trigger run at 8:14 AM instead of exactly 8:00 AM?</h4>
              <p>
                In Google Apps Script, time-driven triggers are distributed across a 60-minute window (e.g. an 8:00 AM trigger runs between 8:00 AM and 9:00 AM). This is standard Google Cloud infrastructure behavior to prevent server spikes.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <h4 className="font-bold text-slate-900">How do I fix "Exception: Service Spreadsheets failed"?</h4>
              <p>
                Run <code>Setup.initializeSpreadsheet()</code> once directly from the Apps Script editor to grant permission and ensure the <code>SPREADSHEET_ID</code> property is registered in Script Properties.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <h4 className="font-bold text-slate-900">How do I ensure reminder emails never land in Gmail Spam?</h4>
              <p>
                Because Google Apps Script uses <code>MailApp</code> to send emails from your own email to your own email, create a Gmail filter: Search for <code>subject:(Birthday Today)</code> &gt; Click <strong>Create filter</strong> &gt; Check <strong>"Never send it to Spam"</strong> and <strong>"Categorize as Primary"</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

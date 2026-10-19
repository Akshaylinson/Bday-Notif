import React, { useState } from 'react';
import {
  Save,
  Clock,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
  Zap,
  RotateCcw,
  Sliders,
  Database,
  FlaskConical,
} from 'lucide-react';
import { AppSettings, LeapDayPolicy } from '../types/birthday';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => void;
  onSendTestEmail: (customEmail?: string) => void;
  onInstallTrigger: () => void;
  onRemoveTrigger: () => void;
  onRunBirthdayCheck: (simulatedDate?: string) => void;
  onResetDatabase: () => void;
  isSendingTest: boolean;
  isChecking: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onSendTestEmail,
  onInstallTrigger,
  onRemoveTrigger,
  onRunBirthdayCheck,
  onResetDatabase,
  isSendingTest,
  isChecking,
}) => {
  const [email, setEmail] = useState(settings.recipientEmail);
  const [hour, setHour] = useState(settings.dailyTriggerHour);
  const [leapPolicy, setLeapPolicy] = useState<LeapDayPolicy>(settings.leapDayPolicy);
  const [testSimulatedDate, setTestSimulatedDate] = useState('2026-10-19');
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !email.includes('@')) {
      setValidationError('Please provide a valid recipient email address.');
      return;
    }

    onSaveSettings({
      recipientEmail: email.trim(),
      dailyTriggerHour: Number(hour),
      leapDayPolicy: leapPolicy,
    });

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Application Settings & Automation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated daily time-driven triggers, recipient delivery email, and leap-day handling policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {settings.triggerInstalled ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daily Trigger Active (~{settings.dailyTriggerHour}:00 IST)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Trigger Not Installed</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Notification Parameters</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {validationError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Recipient Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. administrator@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                All birthday reminder emails will be delivered to this Google account.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Daily Reminder Check Hour
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={6}>06:00 AM (Early Morning)</option>
                  <option value={7}>07:00 AM</option>
                  <option value={8}>08:00 AM (Standard / Recommended)</option>
                  <option value={9}>09:00 AM</option>
                  <option value={10}>10:00 AM</option>
                  <option value={12}>12:00 PM (Noon)</option>
                  <option value={18}>06:00 PM (Evening)</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Apps Script time-driven triggers execute approximately within this hour window.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Leap-Day Policy (Feb 29 Born in Non-Leap Years)
              </label>
              <select
                value={leapPolicy}
                onChange={(e) => setLeapPolicy(e.target.value as LeapDayPolicy)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="FEB_28">February 28th (Standard legal convention)</option>
                <option value="MAR_01">March 1st (Alternative next-day convention)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Defines when a person born on February 29th receives their birthday reminder in common years.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Application Timezone
              </label>
              <input
                type="text"
                value={settings.timezone}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-mono cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Countdowns and checks are computed in Asia/Kolkata calendar days.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavedRecently ? 'Settings Saved Successfully!' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Trigger Automation & Database Status */}
        <div className="space-y-6">
          {/* Daily Trigger Manager Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Google Apps Script Daily Trigger</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Google Apps Script creates a scheduled cron trigger on your project. Once installed, it runs unattended every morning, checks the Google Sheet for birthdays, and sends reminder emails.
            </p>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-600">Trigger Status:</span>
              <span className="font-semibold text-slate-900">
                {settings.triggerInstalled ? 'Active & Scheduled' : 'Not Installed'}
              </span>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={onInstallTrigger}
                className="flex-1 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Install / Repair Trigger
              </button>
              <button
                onClick={onRemoveTrigger}
                className="px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Diagnostic & Testing Simulator */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Testing & Date Simulator</h3>
            </div>

            <p className="text-xs text-slate-600">
              Test reminders without waiting for an actual birthday. Pick any test date or dispatch a sample preview email.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  onClick={() => onSendTestEmail(email)}
                  disabled={isSendingTest}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isSendingTest ? 'Sending...' : 'Send Test Email'}</span>
                </button>

                <button
                  onClick={() => onRunBirthdayCheck()}
                  disabled={isChecking}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isChecking ? 'Checking...' : 'Check Today'}</span>
                </button>
              </div>

              {/* Date Simulator */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Simulate Arbitrary Calendar Date:
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={testSimulatedDate}
                    onChange={(e) => setTestSimulatedDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <button
                    onClick={() => onRunBirthdayCheck(testSimulatedDate)}
                    disabled={isChecking}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                  >
                    Simulate Date
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      setTestSimulatedDate('2026-10-19');
                      onRunBirthdayCheck('2026-10-19');
                    }}
                    className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50 text-slate-600"
                  >
                    Oct 19 (2 Birthdays)
                  </button>
                  <button
                    onClick={() => {
                      setTestSimulatedDate('2026-02-28');
                      onRunBirthdayCheck('2026-02-28');
                    }}
                    className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50 text-slate-600"
                  >
                    Feb 28 (Leap Policy Test)
                  </button>
                  <button
                    onClick={() => {
                      setTestSimulatedDate('2027-01-08');
                      onRunBirthdayCheck('2027-01-08');
                    }}
                    className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50 text-slate-600"
                  >
                    Jan 8 (Year-End Rollover)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Database Info Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Google Sheets Database Structure</h3>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5">
              <div>
                Spreadsheet ID: <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">{settings.spreadsheetId}</code>
              </div>
              <div>
                Configured Tabs: <span className="font-semibold text-slate-700">People</span>, <span className="font-semibold text-slate-700">EmailLog</span>, <span className="font-semibold text-slate-700">Settings</span>
              </div>
              {settings.lastRunSummary && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px]">
                  <span className="font-semibold text-slate-700 block">Latest Execution Log:</span>
                  <span className="text-slate-500">{settings.lastRunSummary}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={onResetDatabase}
                className="w-full text-xs text-slate-600 hover:text-slate-900 py-1.5 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Reset Demo Database to Default Contacts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

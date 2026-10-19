import React from 'react';
import { Calendar, Plus, Zap, Clock } from 'lucide-react';
import { getNowInTimezone } from '../utils/birthdayCalculations';

interface HeaderProps {
  currentTab: string;
  timezone: string;
  onOpenAddModal: () => void;
  onRunBirthdayCheck: () => void;
  isChecking: boolean;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard Overview',
  people: 'All Saved People',
  upcoming: 'Upcoming Birthdays Timeline',
  logs: 'Email History & Logs',
  settings: 'Settings & Automation',
  deploy: 'Apps Script Code & Deployment',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  timezone,
  onOpenAddModal,
  onRunBirthdayCheck,
  isChecking,
}) => {
  const currentNow = getNowInTimezone(timezone);
  const title = TAB_TITLES[currentTab] || 'Birthday Reminder';

  // Format date display
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[currentNow.month - 1];
  const dateFormatted = `${currentNow.day} ${monthName} ${currentNow.year}`;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Contextual Title */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate">
          {title}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="tabular-nums">{dateFormatted}</span>
          <span className="text-slate-300">·</span>
          <span>{timezone.replace('_', ' ')}</span>
        </span>
      </div>

      {/* Zone 2: Navigation Status / Quick Indicator */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Daily Trigger Active (08:00 IST)</span>
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Google Sheets Database</span>
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRunBirthdayCheck}
          disabled={isChecking}
          title="Run idempotent birthday check for today"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          <Zap className={`w-3.5 h-3.5 text-amber-500 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking...' : 'Run Check'}</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Birthday</span>
        </button>
      </div>
    </header>
  );
};

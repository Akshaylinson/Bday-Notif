import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MailCheck,
  Settings,
  Code2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  peopleCount: number;
  triggerInstalled: boolean;
  timezone: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  peopleCount,
  triggerInstalled,
  timezone,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'people',
      label: 'All People',
      icon: Users,
      badge: peopleCount.toString(),
    },
    {
      id: 'upcoming',
      label: 'Upcoming Birthdays',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'logs',
      label: 'Email History',
      icon: MailCheck,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings & Automation',
      icon: Settings,
      badge: null,
    },
    {
      id: 'deploy',
      label: 'Apps Script & Deploy',
      icon: Code2,
      badge: 'Ready',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Zone */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" role="img" aria-label="Birthday cake">🎂</span>
            <div>
              <div className="font-bold text-sm tracking-tight text-white">Birthday Reminder</div>
              <div className="text-[11px] text-slate-400 font-medium">Google Sheets Database</div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-800/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md tabular-nums ${
                      isActive
                        ? 'bg-indigo-900 text-indigo-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & trigger status */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Trigger Status</span>
            <div className="flex items-center gap-1.5 font-medium">
              {triggerInstalled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Daily Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300">Disabled</span>
                </>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 space-y-0.5">
            <div className="flex justify-between">
              <span>Timezone:</span>
              <span className="text-slate-400 font-mono text-[10px]">{timezone}</span>
            </div>
            <div className="flex justify-between">
              <span>Runtime:</span>
              <span className="text-slate-400">Apps Script V8</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

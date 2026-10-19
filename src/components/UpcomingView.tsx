import React, { useMemo } from 'react';
import { Calendar, Sparkles, Clock, CalendarDays, Plus } from 'lucide-react';
import { BirthdayCalculation } from '../types/birthday';

interface UpcomingViewProps {
  calculations: BirthdayCalculation[];
  onOpenAddModal: () => void;
  timezone: string;
}

export const UpcomingView: React.FC<UpcomingViewProps> = ({
  calculations,
  onOpenAddModal,
  timezone,
}) => {
  // Group calculations chronologically
  const groups = useMemo(() => {
    const sorted = [...calculations].sort((a, b) => a.daysRemaining - b.daysRemaining);

    const today: BirthdayCalculation[] = [];
    const tomorrow: BirthdayCalculation[] = [];
    const thisWeek: BirthdayCalculation[] = [];
    const thisMonth: BirthdayCalculation[] = [];
    const laterThisYear: BirthdayCalculation[] = [];
    const nextYear: BirthdayCalculation[] = [];

    const currentYear = new Date().getFullYear();

    for (const item of sorted) {
      if (item.daysRemaining === 0) {
        today.push(item);
      } else if (item.daysRemaining === 1) {
        tomorrow.push(item);
      } else if (item.daysRemaining <= 7) {
        thisWeek.push(item);
      } else if (item.daysRemaining <= 30) {
        thisMonth.push(item);
      } else if (item.nextBirthdayYear === currentYear) {
        laterThisYear.push(item);
      } else {
        nextYear.push(item);
      }
    }

    return [
      { id: 'today', title: 'Birthdays Today 🎉', items: today, highlight: true },
      { id: 'tomorrow', title: 'Tomorrow', items: tomorrow, highlight: false },
      { id: 'week', title: 'This Week (Days 2 to 7)', items: thisWeek, highlight: false },
      { id: 'month', title: 'This Month (Days 8 to 30)', items: thisMonth, highlight: false },
      { id: 'later', title: 'Later this Year', items: laterThisYear, highlight: false },
      { id: 'nextYear', title: 'Next Calendar Year (Year-End Rollover)', items: nextYear, highlight: false },
    ].filter((g) => g.items.length > 0);
  }, [calculations]);

  return (
    <div className="space-y-6">
      {/* Intro header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Upcoming Birthdays Timeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Grouped chronologically by occurrence in {timezone}. Year-end transitions and leap-day adjustments calculated automatically.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Birthday</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No birthdays saved in database</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "+ Add Birthday" to save family, friends, or team members.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`bg-white border rounded-xl overflow-hidden shadow-xs ${
                group.highlight ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'
              }`}
            >
              <div
                className={`px-5 py-3.5 border-b flex items-center justify-between ${
                  group.highlight
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span>{group.title}</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({group.items.length} {group.items.length === 1 ? 'person' : 'people'})
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.person.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {item.person.name}
                        </span>
                        {item.isToday && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                            Today 🎉
                          </span>
                        )}
                        {item.isLeapBorn && (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                            Leap Day (Feb 29)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>Birthday: <strong className="text-slate-700 font-semibold">{item.formattedShortDate}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Born: <span className="font-mono tabular-nums">{item.person.dateOfBirth}</span></span>
                        <span aria-hidden="true">·</span>
                        <span>{item.zodiacSign}</span>
                      </div>

                      {item.person.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/60 rounded-md p-2 mt-1">
                          <span className="font-medium text-slate-700">Note:</span> {item.person.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-base sm:text-lg font-bold text-indigo-600 font-mono tabular-nums">
                          Turning {item.turningAge}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5 font-mono tabular-nums">
                          {item.daysRemaining === 0 ? (
                            <span className="text-indigo-600 font-bold">Happening Today!</span>
                          ) : item.daysRemaining === 1 ? (
                            <span className="text-amber-600 font-semibold">Tomorrow (1 day)</span>
                          ) : (
                            `${item.daysRemaining} days away`
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

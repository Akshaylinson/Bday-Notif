import React from 'react';
import {
  Users,
  PartyPopper,
  CalendarCheck,
  CalendarClock,
  Sparkles,
  ArrowRight,
  Plus,
  Mail,
  HeartHandshake,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Person, BirthdayCalculation, DashboardStats } from '../types/birthday';

interface DashboardViewProps {
  stats: DashboardStats;
  upcomingList: BirthdayCalculation[];
  todayList: BirthdayCalculation[];
  onOpenAddModal: () => void;
  onNavigateToPeople: () => void;
  onNavigateToUpcoming: () => void;
  onSendWish: (person: Person) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  upcomingList,
  todayList,
  onOpenAddModal,
  onNavigateToPeople,
  onNavigateToUpcoming,
  onSendWish,
}) => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const nextPerson = stats.nextBirthday;

  return (
    <div className="space-y-6">
      {/* Today's Special Celebration Alert Banner */}
      {todayList.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-xs shrink-0">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-emerald-950">
                  {todayList.length === 1
                    ? `Birthday Today: ${todayList[0].person.name}!`
                    : `${todayList.length} Birthdays Happening Today!`}
                </h2>
                <button
                  onClick={triggerConfetti}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                >
                  🎉 Celebrate
                </button>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                {todayList.map((item) => (
                  <span key={item.person.id} className="mr-3">
                    <strong>{item.person.name}</strong> is turning{' '}
                    <span className="tabular-nums font-semibold">{item.turningAge}</span> today!
                    {item.person.notes && ` (${item.person.notes})`}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onSendWish(todayList[0].person)}
              className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Send Birthday Wish</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI 4-Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total People Saved</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.totalPeople}
            </span>
            <span className="text-xs text-slate-400">contacts</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Birthdays Today</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight tabular-nums ${
                stats.birthdaysToday > 0 ? 'text-indigo-600' : 'text-slate-900'
              }`}
            >
              {stats.birthdaysToday}
            </span>
            <span className="text-xs text-slate-400">active now</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Upcoming (Next 7 Days)</span>
            <CalendarCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.upcomingIn7Days}
            </span>
            <span className="text-xs text-slate-400">this week</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Upcoming (Next 30 Days)</span>
            <CalendarClock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.upcomingIn30Days}
            </span>
            <span className="text-xs text-slate-400">this month</span>
          </div>
        </div>
      </div>

      {/* Spotlight: Next Birthday Card */}
      {nextPerson ? (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
                <span className="uppercase tracking-widest text-[11px] font-semibold text-indigo-400">
                  Next Upcoming Birthday
                </span>
                <span aria-hidden="true">·</span>
                <span>{nextPerson.zodiacSign}</span>
                {nextPerson.isLeapBorn && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300">Leap Day Baby</span>
                  </>
                )}
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {nextPerson.person.name}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-indigo-200">
                <span>Turning <strong>{nextPerson.turningAge}</strong> years old</span>
                <span aria-hidden="true">·</span>
                <span>Date: <strong>{nextPerson.formattedDate}</strong></span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">Born {nextPerson.person.dateOfBirth}</span>
              </div>

              {nextPerson.person.notes && (
                <p className="text-xs text-indigo-200/90 bg-indigo-900/40 border border-indigo-700/50 rounded-lg p-2.5 mt-2">
                  <span className="font-semibold text-indigo-200">Notes:</span> {nextPerson.person.notes}
                </p>
              )}
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-8">
              <div className="text-left sm:text-right">
                <div className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
                  {nextPerson.daysRemaining === 0 ? 'TODAY' : nextPerson.daysRemaining}
                </div>
                <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mt-1">
                  {nextPerson.daysRemaining === 0
                    ? 'Celebration Day!'
                    : nextPerson.daysRemaining === 1
                    ? 'Day Left (Tomorrow)'
                    : 'Days Left'}
                </div>
              </div>

              <button
                onClick={() => onSendWish(nextPerson.person)}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Prepare Reminder</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No birthdays saved yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add friends, family, and colleagues to store their birthdays in Google Sheets and receive annual email reminders.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Birthday</span>
          </button>
        </div>
      )}

      {/* Upcoming Birthdays (Next 30 Days) Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming in the Next 30 Days</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronologically sorted by upcoming occurrence in Asia/Kolkata
            </p>
          </div>
          <button
            onClick={onNavigateToUpcoming}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            <span>View Full Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No birthdays found in the next 30 days. Check the full timeline or add more people.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Original Birthday</th>
                  <th className="py-3 px-4">Next Occurrence</th>
                  <th className="py-3 px-4 text-right">Age Turning</th>
                  <th className="py-3 px-4 text-right">Countdown</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {upcomingList.slice(0, 6).map((item) => (
                  <tr
                    key={item.person.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.isToday ? 'bg-indigo-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{item.person.name}</span>
                        {item.isToday && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                            Today
                          </span>
                        )}
                        {item.isTomorrow && (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                            Tomorrow
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 tabular-nums">
                      {item.person.dateOfBirth}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700">{item.formattedShortDate}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">({item.zodiacSign.split(' ')[0]})</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-indigo-700">
                      {item.turningAge} yrs
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {item.daysRemaining === 0 ? (
                        <span className="font-bold text-indigo-600">Today! 🎉</span>
                      ) : item.daysRemaining === 1 ? (
                        <span className="font-semibold text-amber-600">1 day</span>
                      ) : (
                        <span className="text-slate-600">{item.daysRemaining} days</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {item.person.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

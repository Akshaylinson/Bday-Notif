import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  User,
  Info,
} from 'lucide-react';
import { Person, BirthdayCalculation, PersonSortOption, PersonFilterOption } from '../types/birthday';

interface PeopleViewProps {
  people: Person[];
  calculations: BirthdayCalculation[];
  onOpenAddModal: () => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  people,
  calculations,
  onOpenAddModal,
  onEditPerson,
  onDeletePerson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<PersonSortOption>('upcoming');
  const [filterOption, setFilterOption] = useState<PersonFilterOption>('all');
  const [selectedPerson, setSelectedPerson] = useState<BirthdayCalculation | null>(null);

  // Map calculations by person id
  const calcMap = useMemo(() => {
    const map = new Map<string, BirthdayCalculation>();
    for (const c of calculations) {
      map.set(c.person.id, c);
    }
    return map;
  }, [calculations]);

  // Filtered and sorted results
  const filteredAndSorted = useMemo(() => {
    let list = people.filter((p) => p.active);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q)) ||
          p.dateOfBirth.includes(q)
      );
    }

    // Segment filter
    if (filterOption !== 'all') {
      list = list.filter((p) => {
        const c = calcMap.get(p.id);
        if (!c) return false;
        if (filterOption === 'today') return c.isToday;
        if (filterOption === 'week') return c.isThisWeek;
        if (filterOption === 'month') return c.isThisMonth;
        if (filterOption === 'leap') return c.isLeapBorn;
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      const ca = calcMap.get(a.id);
      const cb = calcMap.get(b.id);

      if (sortOption === 'upcoming') {
        const daysA = ca ? ca.daysRemaining : 999;
        const daysB = cb ? cb.daysRemaining : 999;
        return daysA - daysB;
      }
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
      if (sortOption === 'dob-asc') return a.dateOfBirth.localeCompare(b.dateOfBirth);
      if (sortOption === 'dob-desc') return b.dateOfBirth.localeCompare(a.dateOfBirth);
      if (sortOption === 'recently-added') return b.createdAt.localeCompare(a.createdAt);
      return 0;
    });

    return list;
  }, [people, calcMap, searchQuery, sortOption, filterOption]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search people by name, notes, or birthdate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right: Filter tabs & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFilterOption('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterOption === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterOption('today')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterOption === 'today'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilterOption('week')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterOption === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 7 Days
            </button>
            <button
              onClick={() => setFilterOption('month')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterOption === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 30 Days
            </button>
            <button
              onClick={() => setFilterOption('leap')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterOption === 'leap'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Feb 29 Born
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as PersonSortOption)}
              className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="upcoming">Next Birthday</option>
              <option value="name-asc">Name (A to Z)</option>
              <option value="name-desc">Name (Z to A)</option>
              <option value="dob-asc">Age (Oldest First)</option>
              <option value="dob-desc">Age (Youngest First)</option>
              <option value="recently-added">Recently Added</option>
            </select>
          </div>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Person</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredAndSorted.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <User className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">No matching contacts found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No people matched your query "${searchQuery}". Try clearing filters.`
                : 'No birthdays added yet. Click "+ Add Person" to get started.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterOption('all');
                }}
                className="text-xs text-indigo-600 font-semibold underline cursor-pointer"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Date of Birth</th>
                  <th className="py-3 px-4">Next Birthday</th>
                  <th className="py-3 px-4 text-right">Age Turning</th>
                  <th className="py-3 px-4 text-right">Days Left</th>
                  <th className="py-3 px-4">Notes / Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredAndSorted.map((person) => {
                  const calc = calcMap.get(person.id);
                  if (!calc) return null;

                  return (
                    <tr
                      key={person.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        calc.isToday ? 'bg-indigo-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPerson(calc)}
                            className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer text-left"
                          >
                            {person.name}
                          </button>
                          {calc.isToday && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                              Today 🎉
                            </span>
                          )}
                          {calc.isLeapBorn && (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                              Feb 29
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 tabular-nums">
                        {person.dateOfBirth}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium">{calc.formattedShortDate}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5">
                          {calc.nextBirthdayYear}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-indigo-700">
                        {calc.turningAge} yrs
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {calc.daysRemaining === 0 ? (
                          <span className="font-bold text-indigo-600">Today!</span>
                        ) : calc.daysRemaining === 1 ? (
                          <span className="font-semibold text-amber-600">Tomorrow</span>
                        ) : (
                          <span className="text-slate-600">{calc.daysRemaining} days</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-slate-500 truncate">
                        {person.notes || <span className="text-slate-300">None</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedPerson(calc)}
                            title="View details"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditPerson(person)}
                            title="Edit person"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePerson(person)}
                            title="Delete person"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Person Detail Drawer / Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                  Person Record Details
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {selectedPerson.person.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Original Date of Birth</span>
                <span className="text-slate-800 font-mono text-sm font-semibold mt-0.5 block tabular-nums">
                  {selectedPerson.person.dateOfBirth}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Next Birthday Occurrence</span>
                <span className="text-slate-800 font-mono text-sm font-semibold mt-0.5 block tabular-nums">
                  {selectedPerson.nextBirthdayDate}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Turning Age</span>
                <span className="text-indigo-600 text-sm font-bold mt-0.5 block tabular-nums">
                  {selectedPerson.turningAge} years old
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Days Remaining</span>
                <span className="text-slate-800 text-sm font-bold mt-0.5 block tabular-nums">
                  {selectedPerson.daysRemaining === 0 ? 'Today! 🎉' : `${selectedPerson.daysRemaining} days`}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Zodiac Sign</span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {selectedPerson.zodiacSign}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Database Record ID</span>
                <span className="text-slate-600 font-mono text-[11px] mt-0.5 block truncate">
                  {selectedPerson.person.id}
                </span>
              </div>
            </div>

            {selectedPerson.person.notes ? (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Notes & Relationship</span>
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-slate-700">
                  {selectedPerson.person.notes}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No notes attached to this person.</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const p = selectedPerson.person;
                  setSelectedPerson(null);
                  onEditPerson(p);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Edit Information
              </button>
              <button
                onClick={() => setSelectedPerson(null)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

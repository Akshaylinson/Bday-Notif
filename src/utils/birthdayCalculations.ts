import { Person, LeapDayPolicy, BirthdayCalculation, DashboardStats } from '../types/birthday';

/**
 * Checks whether a given year is a leap year in Gregorian calendar
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns the current date components (year, month 1-12, day 1-31) in a given timezone
 */
export function getNowInTimezone(timezone: string = 'Asia/Kolkata', customDate?: Date): {
  year: number;
  month: number;
  day: number;
  dateString: string; // YYYY-MM-DD
} {
  const d = customDate || new Date();
  
  // Format to parts in the specified timezone
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(d); // en-CA gives YYYY-MM-DD
    const [yearStr, monthStr, dayStr] = parts.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    return {
      year,
      month,
      day,
      dateString: `${yearStr}-${monthStr}-${dayStr}`,
    };
  } catch (e) {
    // Fallback if timezone string is invalid
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, dateString };
  }
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD dates.
 * Disregards time of day, timezone offset differences, and daylight saving skips.
 */
export function calendarDayDifference(currentDateStr: string, targetDateStr: string): number {
  const [cy, cm, cd] = currentDateStr.split('-').map(Number);
  const [ty, tm, td] = targetDateStr.split('-').map(Number);

  // Use UTC midnight for calendar arithmetic to avoid any DST shifts
  const d1 = Date.UTC(cy, cm - 1, cd);
  const d2 = Date.UTC(ty, tm - 1, td);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2 - d1) / msPerDay);
}

/**
 * Determine the next birthday date string (YYYY-MM-DD) for a given birthdate
 * taking into account leap year policies and whether it has passed this year.
 */
export function getNextBirthdayDate(
  dobStr: string,
  currentDateStr: string,
  leapPolicy: LeapDayPolicy = 'FEB_28'
): { nextBirthdayStr: string; nextYear: number } {
  const [birthYear, birthMonth, birthDay] = dobStr.split('-').map(Number);
  const [currYear] = currentDateStr.split('-').map(Number);

  const isFeb29 = birthMonth === 2 && birthDay === 29;

  const determineMonthDay = (targetYear: number): { m: number; d: number } => {
    if (!isFeb29) {
      return { m: birthMonth, d: birthDay };
    }
    // Person is born on Feb 29
    if (isLeapYear(targetYear)) {
      return { m: 2, d: 29 };
    }
    // In non-leap years, apply policy
    return leapPolicy === 'FEB_28' ? { m: 2, d: 28 } : { m: 3, d: 1 };
  };

  // Check this year's occurrence
  const thisYearMD = determineMonthDay(currYear);
  const thisYearBirthdayStr = `${currYear}-${String(thisYearMD.m).padStart(2, '0')}-${String(thisYearMD.d).padStart(2, '0')}`;

  const diffThisYear = calendarDayDifference(currentDateStr, thisYearBirthdayStr);

  if (diffThisYear >= 0) {
    // Birthday is today or upcoming later this year
    return {
      nextBirthdayStr: thisYearBirthdayStr,
      nextYear: currYear,
    };
  }

  // Birthday has already passed this year, next occurrence is next year
  const nextYear = currYear + 1;
  const nextYearMD = determineMonthDay(nextYear);
  const nextYearBirthdayStr = `${nextYear}-${String(nextYearMD.m).padStart(2, '0')}-${String(nextYearMD.d).padStart(2, '0')}`;

  return {
    nextBirthdayStr: nextYearBirthdayStr,
    nextYear,
  };
}

/**
 * Returns zodiac sign based on month (1-12) and day (1-31)
 */
export function getZodiacSign(month: number, day: number): string {
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius ♒';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces ♓';
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries ♈';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus ♉';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini ♊';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer ♋';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo ♌';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo ♍';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra ♎';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio ♏';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius ♐';
  return 'Capricorn ♑';
}

/**
 * Formats YYYY-MM-DD into human-readable string (e.g., "October 22, 1998")
 */
export function formatReadableDate(dateStr: string, includeYear: boolean = true): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  };
  if (includeYear) {
    options.year = 'numeric';
  }
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Formats YYYY-MM-DD into short human-readable string (e.g., "Oct 22")
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Calculates comprehensive birthday metrics for a single Person
 */
export function calculateBirthdayInfo(
  person: Person,
  timezone: string = 'Asia/Kolkata',
  leapPolicy: LeapDayPolicy = 'FEB_28',
  customCurrentDate?: string
): BirthdayCalculation {
  const currentInfo = customCurrentDate
    ? {
        year: parseInt(customCurrentDate.split('-')[0], 10),
        month: parseInt(customCurrentDate.split('-')[1], 10),
        day: parseInt(customCurrentDate.split('-')[2], 10),
        dateString: customCurrentDate,
      }
    : getNowInTimezone(timezone);

  const [birthYear, birthMonth, birthDay] = person.dateOfBirth.split('-').map(Number);
  const isLeapBorn = birthMonth === 2 && birthDay === 29;

  const { nextBirthdayStr, nextYear } = getNextBirthdayDate(
    person.dateOfBirth,
    currentInfo.dateString,
    leapPolicy
  );

  const daysRemaining = calendarDayDifference(currentInfo.dateString, nextBirthdayStr);
  const turningAge = nextYear - birthYear;

  const isToday = daysRemaining === 0;
  const isTomorrow = daysRemaining === 1;
  const isThisWeek = daysRemaining >= 0 && daysRemaining <= 7;
  const isThisMonth = daysRemaining >= 0 && daysRemaining <= 30;

  return {
    person,
    birthYear,
    birthMonth,
    birthDay,
    isLeapBorn,
    nextBirthdayDate: nextBirthdayStr,
    nextBirthdayYear: nextYear,
    daysRemaining,
    turningAge,
    isToday,
    isTomorrow,
    isThisWeek,
    isThisMonth,
    formattedDate: formatReadableDate(nextBirthdayStr, true),
    formattedShortDate: formatShortDate(nextBirthdayStr),
    zodiacSign: getZodiacSign(birthMonth, birthDay),
  };
}

/**
 * Compute dashboard stats from an array of persons
 */
export function computeDashboardStats(
  people: Person[],
  timezone: string = 'Asia/Kolkata',
  leapPolicy: LeapDayPolicy = 'FEB_28',
  customCurrentDate?: string
): DashboardStats {
  const activePeople = people.filter((p) => p.active);
  const calculations = activePeople.map((p) =>
    calculateBirthdayInfo(p, timezone, leapPolicy, customCurrentDate)
  );

  // Sort by days remaining to find the next birthday
  const sorted = [...calculations].sort((a, b) => a.daysRemaining - b.daysRemaining);

  const birthdaysToday = calculations.filter((c) => c.isToday).length;
  const upcomingIn7Days = calculations.filter((c) => c.daysRemaining > 0 && c.daysRemaining <= 7).length;
  const upcomingIn30Days = calculations.filter((c) => c.daysRemaining > 0 && c.daysRemaining <= 30).length;

  return {
    totalPeople: activePeople.length,
    birthdaysToday,
    upcomingIn7Days,
    upcomingIn30Days,
    nextBirthday: sorted.length > 0 ? sorted[0] : null,
  };
}

/**
 * @fileoverview Birthday calculation engine handling calendar math, timezone shifts, leap years, and countdowns.
 * @license Apache-2.0
 */

var BirthdayService = (function () {
  /**
   * Checks whether a year is a leap year.
   */
  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Returns current date parts (year, month 1-12, day 1-31) in the specified timezone.
   * Defaults to 'Asia/Kolkata'.
   */
  function getCurrentDateInTimezone(timezone, overrideDate) {
    var tz = timezone || 'Asia/Kolkata';
    var d = overrideDate || new Date();

    // Use Utilities.formatDate in Apps Script for accurate timezone conversion
    var formatted = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    var parts = formatted.split('-');

    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
      dateString: formatted
    };
  }

  /**
   * Calendar day difference between two YYYY-MM-DD date strings.
   * Positive if target is in future, 0 if same day, negative if in past.
   */
  function calendarDayDifference(currentDateStr, targetDateStr) {
    var cParts = currentDateStr.split('-');
    var tParts = targetDateStr.split('-');

    var d1 = Date.UTC(parseInt(cParts[0], 10), parseInt(cParts[1], 10) - 1, parseInt(cParts[2], 10));
    var d2 = Date.UTC(parseInt(tParts[0], 10), parseInt(tParts[1], 10) - 1, parseInt(tParts[2], 10));

    var msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((d2 - d1) / msPerDay);
  }

  /**
   * Calculates the next occurrence of a birthday based on DOB, current date and leap-day policy.
   */
  function getNextBirthdayDate(dobStr, currentDateStr, leapPolicy) {
    var bParts = dobStr.split('-');
    var birthYear = parseInt(bParts[0], 10);
    var birthMonth = parseInt(bParts[1], 10);
    var birthDay = parseInt(bParts[2], 10);

    var cParts = currentDateStr.split('-');
    var currYear = parseInt(cParts[0], 10);

    var isFeb29 = birthMonth === 2 && birthDay === 29;

    function getMonthDayForYear(targetYear) {
      if (!isFeb29) {
        return { m: birthMonth, d: birthDay };
      }
      if (isLeapYear(targetYear)) {
        return { m: 2, d: 29 };
      }
      return (leapPolicy === 'MAR_01') ? { m: 3, d: 1 } : { m: 2, d: 28 };
    }

    // Try current year
    var thisYearMD = getMonthDayForYear(currYear);
    var thisYearStr = currYear + '-' +
      ('0' + thisYearMD.m).slice(-2) + '-' +
      ('0' + thisYearMD.d).slice(-2);

    var diff = calendarDayDifference(currentDateStr, thisYearStr);
    if (diff >= 0) {
      return {
        nextBirthdayStr: thisYearStr,
        nextYear: currYear,
        month: thisYearMD.m,
        day: thisYearMD.d
      };
    }

    // Try next year (handles year-end transitions)
    var nextYear = currYear + 1;
    var nextYearMD = getMonthDayForYear(nextYear);
    var nextYearStr = nextYear + '-' +
      ('0' + nextYearMD.m).slice(-2) + '-' +
      ('0' + nextYearMD.d).slice(-2);

    return {
      nextBirthdayStr: nextYearStr,
      nextYear: nextYear,
      month: nextYearMD.m,
      day: nextYearMD.d
    };
  }

  /**
   * Formats a YYYY-MM-DD date into friendly text.
   */
  function formatMonthName(month) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

  /**
   * Calculates full birthday analytics for a list of people.
   */
  function calculateAllBirthdays(people, timezone, leapPolicy, overrideCurrentDate) {
    var tz = timezone || 'Asia/Kolkata';
    var policy = leapPolicy || 'FEB_28';
    var current = getCurrentDateInTimezone(tz, overrideCurrentDate);

    var results = [];
    for (var i = 0; i < people.length; i++) {
      var p = people[i];
      if (!p.active) continue;

      var bParts = p.dateOfBirth.split('-');
      var birthYear = parseInt(bParts[0], 10);
      var birthMonth = parseInt(bParts[1], 10);
      var birthDay = parseInt(bParts[2], 10);

      var nextInfo = getNextBirthdayDate(p.dateOfBirth, current.dateString, policy);
      var daysRemaining = calendarDayDifference(current.dateString, nextInfo.nextBirthdayStr);
      var turningAge = nextInfo.nextYear - birthYear;

      results.push({
        person: p,
        birthYear: birthYear,
        birthMonth: birthMonth,
        birthDay: birthDay,
        isLeapBorn: (birthMonth === 2 && birthDay === 29),
        nextBirthdayDate: nextInfo.nextBirthdayStr,
        nextBirthdayYear: nextInfo.nextYear,
        daysRemaining: daysRemaining,
        turningAge: turningAge,
        isToday: (daysRemaining === 0),
        isTomorrow: (daysRemaining === 1),
        isThisWeek: (daysRemaining >= 0 && daysRemaining <= 7),
        isThisMonth: (daysRemaining >= 0 && daysRemaining <= 30),
        formattedBirthday: formatMonthName(nextInfo.month) + ' ' + nextInfo.day
      });
    }

    // Sort by days remaining ascending
    results.sort(function (a, b) {
      return a.daysRemaining - b.daysRemaining;
    });

    return {
      currentDate: current.dateString,
      timezone: tz,
      calculations: results
    };
  }

  return {
    isLeapYear: isLeapYear,
    getCurrentDateInTimezone: getCurrentDateInTimezone,
    calendarDayDifference: calendarDayDifference,
    getNextBirthdayDate: getNextBirthdayDate,
    calculateAllBirthdays: calculateAllBirthdays
  };
})();

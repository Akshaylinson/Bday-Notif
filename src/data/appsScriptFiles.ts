export interface AppsScriptFile {
  filename: string;
  type: 'script' | 'html' | 'json' | 'doc';
  description: string;
  content: string;
}

export const APPS_SCRIPT_FILES: AppsScriptFile[] = [
  {
    filename: 'appsscript.json',
    type: 'json',
    description: 'Apps Script project manifest specifying Asia/Kolkata timezone, V8 runtime, and OAuth scopes.',
    content: `{
  "timeZone": "Asia/Kolkata",
  "dependencies": {
    "enabledAdvancedServices": []
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "MYSELF"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/script.scriptapp"
  ]
}`
  },
  {
    filename: 'Code.gs',
    type: 'script',
    description: 'Web app entry point (doGet), file include helper, daily trigger handler, and client RPC endpoints.',
    content: `/**
 * @fileoverview Main entry point and RPC endpoints for Birthday Reminder Apps Script.
 * @license Apache-2.0
 */

function doGet(e) {
  try {
    Setup.initializeSpreadsheet();
  } catch (err) {
    Logger.log('Setup warning on doGet: ' + err.message);
  }

  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Birthday Reminder — Google Sheets')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function dailyBirthdayCheck() {
  return EmailService.executeBirthdayCheck(false);
}

// Client RPC Methods
function getInitialData() {
  Setup.initializeSpreadsheet();
  var settings = SettingsService.getSettings();
  var people = PeopleService.getAllPeople();
  var emailLogs = EmailService.getEmailLogs(50);
  var triggerStatus = TriggerService.checkDailyTriggerStatus();

  return {
    people: people,
    settings: settings,
    emailLogs: emailLogs,
    triggerStatus: triggerStatus,
    serverTime: new Date().toISOString()
  };
}

function apiSavePerson(personData) {
  return PeopleService.savePerson(personData);
}

function apiDeletePerson(id) {
  return PeopleService.deletePerson(id);
}

function apiSaveSettings(settingsData) {
  return SettingsService.updateSettings(settingsData);
}

function apiRunBirthdayCheckManual() {
  return EmailService.executeBirthdayCheck(true);
}

function apiSendTestEmailManual() {
  return EmailService.sendTestEmail();
}

function apiInstallTrigger(hour) {
  return TriggerService.installDailyTrigger(hour);
}

function apiRemoveTrigger() {
  return TriggerService.removeDailyTrigger();
}

function apiRunSetup() {
  return Setup.initializeSpreadsheet();
}`
  },
  {
    filename: 'Setup.gs',
    type: 'script',
    description: 'Initializes Google Sheets database, creates People, EmailLog, and Settings tabs with formatting.',
    content: `/**
 * @fileoverview Setup routine for initializing Google Sheets database and default settings.
 * @license Apache-2.0
 */

var Setup = (function () {
  var PEOPLE_SHEET = 'People';
  var EMAIL_LOG_SHEET = 'EmailLog';
  var SETTINGS_SHEET = 'Settings';

  var PEOPLE_HEADERS = ['ID', 'Name', 'DateOfBirth', 'Notes', 'CreatedAt', 'UpdatedAt', 'Active'];
  var EMAIL_LOG_HEADERS = ['ID', 'PersonID', 'PersonName', 'BirthdayDate', 'Recipient', 'Status', 'SentAt', 'ErrorMessage'];
  var SETTINGS_HEADERS = ['Key', 'Value'];

  function getSpreadsheet() {
    var props = PropertiesService.getScriptProperties();
    var storedId = props.getProperty('SPREADSHEET_ID');

    if (storedId) {
      try {
        return SpreadsheetApp.openById(storedId);
      } catch (e) {
        Logger.log('Could not open stored spreadsheet ID: ' + storedId);
      }
    }

    try {
      var active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) {
        props.setProperty('SPREADSHEET_ID', active.getId());
        return active;
      }
    } catch (e) {}

    var newSheet = SpreadsheetApp.create('Birthday Reminder Database');
    props.setProperty('SPREADSHEET_ID', newSheet.getId());
    return newSheet;
  }

  function initializeSpreadsheet() {
    var ss = getSpreadsheet();
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_ID', ss.getId());

    initSheet(ss, PEOPLE_SHEET, PEOPLE_HEADERS, [200, 220, 140, 300, 180, 180, 100]);
    initSheet(ss, EMAIL_LOG_SHEET, EMAIL_LOG_HEADERS, [200, 200, 200, 130, 220, 140, 180, 260]);
    initSheet(ss, SETTINGS_SHEET, SETTINGS_HEADERS, [220, 300]);

    populateDefaultSettings(ss);

    try {
      var defaultSheet = ss.getSheetByName('Sheet1');
      if (defaultSheet && ss.getSheets().length > 1) {
        ss.deleteSheet(defaultSheet);
      }
    } catch (e) {}

    return {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl()
    };
  }

  function initSheet(ss, sheetName, headers, colWidths) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#f8fafc');
    headerRange.setFontWeight('bold');
    headerRange.setFontFamily('Arial');
    headerRange.setFontSize(10);
    headerRange.setVerticalAlignment('middle');
    headerRange.setHorizontalAlignment('center');
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);

    if (colWidths && colWidths.length) {
      for (var c = 0; c < colWidths.length; c++) {
        sheet.setColumnWidth(c + 1, colWidths[c]);
      }
    }
  }

  function populateDefaultSettings(ss) {
    var sheet = ss.getSheetByName(SETTINGS_SHEET);
    if (!sheet) return;

    var existingData = sheet.getDataRange().getValues();
    var existingKeys = {};
    for (var i = 1; i < existingData.length; i++) {
      if (existingData[i][0]) {
        existingKeys[String(existingData[i][0]).trim()] = true;
      }
    }

    var defaultEmail = Session.getActiveUser().getEmail() || '';
    var defaults = [
      ['recipientEmail', defaultEmail],
      ['dailyTriggerHour', '8'],
      ['timezone', 'Asia/Kolkata'],
      ['leapDayPolicy', 'FEB_28'],
      ['lastRunTimestamp', ''],
      ['lastRunStatus', 'IDLE'],
      ['lastRunSummary', '']
    ];

    for (var d = 0; d < defaults.length; d++) {
      var key = defaults[d][0];
      var val = defaults[d][1];
      if (!existingKeys[key]) {
        sheet.appendRow([key, val]);
      }
    }
  }

  return {
    initializeSpreadsheet: initializeSpreadsheet,
    getSpreadsheet: getSpreadsheet,
    PEOPLE_SHEET: PEOPLE_SHEET,
    EMAIL_LOG_SHEET: EMAIL_LOG_SHEET,
    SETTINGS_SHEET: SETTINGS_SHEET
  };
})();`
  },
  {
    filename: 'PeopleService.gs',
    type: 'script',
    description: 'Manages CRUD operations, stable UUID generation, concurrency locking, and ISO date validation.',
    content: `/**
 * @fileoverview People service handling CRUD operations, validation and persistence in Google Sheets.
 * @license Apache-2.0
 */

var PeopleService = (function () {
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function isValidISODate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    var regex = /^\\d{4}-\\d{2}-\\d{2}$/;
    if (!regex.test(dateStr)) return false;
    var parts = dateStr.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return false;

    var dateObj = new Date(Date.UTC(y, m - 1, d));
    return (
      dateObj.getUTCFullYear() === y &&
      dateObj.getUTCMonth() === m - 1 &&
      dateObj.getUTCDate() === d
    );
  }

  function getAllPeople(includeInactive) {
    var ss = Setup.getSpreadsheet();
    var sheet = ss.getSheetByName(Setup.PEOPLE_SHEET);
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];

    var values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    var people = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var id = String(row[0] || '').trim();
      var name = String(row[1] || '').trim();
      var dobRaw = row[2];
      var notes = String(row[3] || '').trim();
      var createdAt = String(row[4] || '');
      var updatedAt = String(row[5] || '');
      var active = row[6] === true || String(row[6]).toLowerCase() === 'true';

      if (!id || !name) continue;

      var dateOfBirth = '';
      if (dobRaw instanceof Date) {
        var y = dobRaw.getFullYear();
        var m = ('0' + (dobRaw.getMonth() + 1)).slice(-2);
        var d = ('0' + dobRaw.getDate()).slice(-2);
        dateOfBirth = y + '-' + m + '-' + d;
      } else {
        dateOfBirth = String(dobRaw || '').trim();
      }

      if (includeInactive || active) {
        people.push({
          id: id,
          name: name,
          dateOfBirth: dateOfBirth,
          notes: notes,
          createdAt: createdAt,
          updatedAt: updatedAt,
          active: active
        });
      }
    }

    return people;
  }

  function savePerson(data) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return { success: false, error: 'Database is currently busy. Please try again.' };
    }

    try {
      if (!data.name || !String(data.name).trim()) {
        return { success: false, error: 'Full name is required.' };
      }
      var name = String(data.name).trim();

      if (!data.dateOfBirth || !isValidISODate(String(data.dateOfBirth).trim())) {
        return { success: false, error: 'Valid Date of Birth (YYYY-MM-DD) is required.' };
      }
      var dob = String(data.dateOfBirth).trim();
      var notes = data.notes ? String(data.notes).trim() : '';

      var ss = Setup.getSpreadsheet();
      var sheet = ss.getSheetByName(Setup.PEOPLE_SHEET);
      if (!sheet) {
        Setup.initializeSpreadsheet();
        sheet = ss.getSheetByName(Setup.PEOPLE_SHEET);
      }

      var lastRow = sheet.getLastRow();
      var nowIso = new Date().toISOString();

      if (data.id) {
        var id = String(data.id).trim();
        var idCol = sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 1).getValues();
        var rowIndex = -1;

        for (var i = 0; i < idCol.length; i++) {
          if (String(idCol[i][0]).trim() === id) {
            rowIndex = i + 2;
            break;
          }
        }

        if (rowIndex === -1) {
          return { success: false, error: 'Person record with ID ' + id + ' not found.' };
        }

        sheet.getRange(rowIndex, 2, 1, 3).setValues([[name, "'" + dob, notes]]);
        sheet.getRange(rowIndex, 6, 1, 2).setValues([[nowIso, true]]);

        return {
          success: true,
          action: 'updated',
          person: { id: id, name: name, dateOfBirth: dob, notes: notes, updatedAt: nowIso, active: true }
        };
      } else {
        var existing = getAllPeople(false);
        for (var e = 0; e < existing.length; e++) {
          if (
            existing[e].name.toLowerCase() === name.toLowerCase() &&
            existing[e].dateOfBirth === dob
          ) {
            return {
              success: false,
              error: 'A person with the same name (' + name + ') and birthday (' + dob + ') already exists.'
            };
          }
        }

        var newId = generateUUID();
        var rowData = [newId, name, "'" + dob, notes, nowIso, nowIso, true];
        sheet.appendRow(rowData);

        return {
          success: true,
          action: 'created',
          person: { id: newId, name: name, dateOfBirth: dob, notes: notes, createdAt: nowIso, updatedAt: nowIso, active: true }
        };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  }

  function deletePerson(id) {
    if (!id) return { success: false, error: 'ID is required.' };

    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return { success: false, error: 'Database is currently busy. Please try again.' };
    }

    try {
      var ss = Setup.getSpreadsheet();
      var sheet = ss.getSheetByName(Setup.PEOPLE_SHEET);
      if (!sheet) return { success: false, error: 'People sheet not found.' };

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { success: false, error: 'No records to delete.' };

      var idCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idCol.length; i++) {
        if (String(idCol[i][0]).trim() === String(id).trim()) {
          var rowIndex = i + 2;
          sheet.getRange(rowIndex, 6, 1, 2).setValues([[new Date().toISOString(), false]]);
          return { success: true, id: id };
        }
      }

      return { success: false, error: 'Person not found.' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  }

  return {
    getAllPeople: getAllPeople,
    savePerson: savePerson,
    deletePerson: deletePerson,
    isValidISODate: isValidISODate
  };
})();`
  },
  {
    filename: 'BirthdayService.gs',
    type: 'script',
    description: 'Calendar math, Asia/Kolkata timezone calculations, leap year Feb 29 handling, and countdowns.',
    content: `/**
 * @fileoverview Birthday calculation engine handling calendar math, timezone shifts, leap years, and countdowns.
 * @license Apache-2.0
 */

var BirthdayService = (function () {
  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function getCurrentDateInTimezone(timezone, overrideDate) {
    var tz = timezone || 'Asia/Kolkata';
    var d = overrideDate || new Date();
    var formatted = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    var parts = formatted.split('-');

    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
      dateString: formatted
    };
  }

  function calendarDayDifference(currentDateStr, targetDateStr) {
    var cParts = currentDateStr.split('-');
    var tParts = targetDateStr.split('-');
    var d1 = Date.UTC(parseInt(cParts[0], 10), parseInt(cParts[1], 10) - 1, parseInt(cParts[2], 10));
    var d2 = Date.UTC(parseInt(tParts[0], 10), parseInt(tParts[1], 10) - 1, parseInt(tParts[2], 10));
    var msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((d2 - d1) / msPerDay);
  }

  function getNextBirthdayDate(dobStr, currentDateStr, leapPolicy) {
    var bParts = dobStr.split('-');
    var birthYear = parseInt(bParts[0], 10);
    var birthMonth = parseInt(bParts[1], 10);
    var birthDay = parseInt(bParts[2], 10);

    var cParts = currentDateStr.split('-');
    var currYear = parseInt(cParts[0], 10);

    var isFeb29 = birthMonth === 2 && birthDay === 29;

    function getMonthDayForYear(targetYear) {
      if (!isFeb29) return { m: birthMonth, d: birthDay };
      if (isLeapYear(targetYear)) return { m: 2, d: 29 };
      return (leapPolicy === 'MAR_01') ? { m: 3, d: 1 } : { m: 2, d: 28 };
    }

    var thisYearMD = getMonthDayForYear(currYear);
    var thisYearStr = currYear + '-' + ('0' + thisYearMD.m).slice(-2) + '-' + ('0' + thisYearMD.d).slice(-2);

    var diff = calendarDayDifference(currentDateStr, thisYearStr);
    if (diff >= 0) {
      return {
        nextBirthdayStr: thisYearStr,
        nextYear: currYear,
        month: thisYearMD.m,
        day: thisYearMD.d
      };
    }

    var nextYear = currYear + 1;
    var nextYearMD = getMonthDayForYear(nextYear);
    var nextYearStr = nextYear + '-' + ('0' + nextYearMD.m).slice(-2) + '-' + ('0' + nextYearMD.d).slice(-2);

    return {
      nextBirthdayStr: nextYearStr,
      nextYear: nextYear,
      month: nextYearMD.m,
      day: nextYearMD.d
    };
  }

  function formatMonthName(month) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

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
})();`
  },
  {
    filename: 'EmailService.gs',
    type: 'script',
    description: 'Generates HTML emails, dispatches via MailApp, enforces idempotency, and logs to EmailLog tab.',
    content: `/**
 * @fileoverview Email notification service, templates, idempotency enforcement, and Google Sheets logging.
 * @license Apache-2.0
 */

var EmailService = (function () {
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getEmailLogs(limit) {
    var max = limit || 50;
    var ss = Setup.getSpreadsheet();
    var sheet = ss.getSheetByName(Setup.EMAIL_LOG_SHEET);
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];

    var rowCount = Math.min(lastRow - 1, max);
    var startRow = Math.max(2, lastRow - rowCount + 1);
    var values = sheet.getRange(startRow, 1, rowCount, 8).getValues();

    var logs = [];
    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      logs.push({
        id: String(row[0] || ''),
        personId: String(row[1] || ''),
        personName: String(row[2] || ''),
        birthdayDate: String(row[3] || ''),
        recipient: String(row[4] || ''),
        status: String(row[5] || ''),
        sentAt: String(row[6] || ''),
        errorMessage: String(row[7] || '')
      });
    }
    return logs;
  }

  function logEmail(entry) {
    try {
      var ss = Setup.getSpreadsheet();
      var sheet = ss.getSheetByName(Setup.EMAIL_LOG_SHEET);
      if (!sheet) {
        Setup.initializeSpreadsheet();
        sheet = ss.getSheetByName(Setup.EMAIL_LOG_SHEET);
      }
      var logId = generateUUID();
      sheet.appendRow([
        logId,
        entry.personId || '',
        entry.personName || '',
        entry.birthdayDate || '',
        entry.recipient || '',
        entry.status,
        entry.sentAt || new Date().toISOString(),
        entry.errorMessage || ''
      ]);
      return logId;
    } catch (e) {
      Logger.log('Failed to write to EmailLog sheet: ' + e.message);
      return null;
    }
  }

  function wasAlreadySentToday(personId, todayDateStr, recipient) {
    var ss = Setup.getSpreadsheet();
    var sheet = ss.getSheetByName(Setup.EMAIL_LOG_SHEET);
    if (!sheet) return false;

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return false;

    var checkCount = Math.min(lastRow - 1, 200);
    var startRow = Math.max(2, lastRow - checkCount + 1);
    var data = sheet.getRange(startRow, 1, checkCount, 8).getValues();

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var loggedPersonId = String(row[1] || '').trim();
      var loggedDate = String(row[3] || '').trim();
      var loggedRecipient = String(row[4] || '').trim().toLowerCase();
      var loggedStatus = String(row[5] || '').trim();
      var sentAtStr = String(row[6] || '');
      var sentAtDay = sentAtStr.substring(0, 10);

      if (
        loggedPersonId === personId &&
        loggedStatus === 'SENT' &&
        loggedRecipient === recipient.toLowerCase() &&
        (loggedDate === todayDateStr || sentAtDay === todayDateStr)
      ) {
        return true;
      }
    }

    return false;
  }

  function buildEmailHtml(birthdays, recipient, isTest) {
    var title = isTest
      ? '[Test Reminder] Birthday Reminder System is Active'
      : (birthdays.length === 1
        ? 'Birthday Today: ' + birthdays[0].person.name + '!'
        : birthdays.length + ' Birthdays Today!');

    var itemsHtml = '';
    for (var i = 0; i < birthdays.length; i++) {
      var b = birthdays[i];
      var ageText = b.turningAge > 0 ? ('Turning ' + b.turningAge + ' years old today') : 'Birthday celebration';
      var noteHtml = b.person.notes
        ? '<div style="margin-top: 8px; font-size: 13px; color: #475569; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #6366f1;"><strong>Notes:</strong> ' + escapeHtml(b.person.notes) + '</div>'
        : '';

      itemsHtml += [
        '<div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; background: #ffffff;">',
        '  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">',
        '    <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">' + escapeHtml(b.person.name) + '</h2>',
        '    <span style="font-size: 13px; font-weight: 600; color: #4f46e5;">' + ageText + '</span>',
        '  </div>',
        '  <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Original Date of Birth: ' + b.person.dateOfBirth + ' (Month/Day: ' + b.formattedBirthday + ')</p>',
        noteHtml,
        '</div>'
      ].join('\\n');
    }

    var testNotice = isTest
      ? '<div style="background: #eef2ff; color: #3730a3; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 13px;"><strong>Test Email Notification:</strong> This is a manual test email sent from your Birthday Reminder Apps Script settings. Your mail delivery and quota configurations are operating normally.</div>'
      : '';

    return [
      '<!DOCTYPE html>',
      '<html>',
      '<head><meta charset="UTF-8"><title>' + title + '</title></head>',
      '<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">',
      '  <table width="100%" border="0" cellspacing="0" cellpadding="0">',
      '    <tr>',
      '      <td align="center">',
      '        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">',
      '          <tr>',
      '            <td style="background: #0f172a; padding: 28px 32px; color: #ffffff;">',
      '              <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Birthday Reminder System</p>',
      '              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #f8fafc;">' + title + '</h1>',
      '            </td>',
      '          </tr>',
      '          <tr>',
      '            <td style="padding: 24px 32px;">',
      testNotice,
      '              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">',
      itemsHtml,
      '              </div>',
      '              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">',
      '                Automated reminder sent to ' + recipient + ' based on Google Sheets database.',
      '              </p>',
      '            </td>',
      '          </tr>',
      '        </table>',
      '      </td>',
      '    </tr>',
      '  </table>',
      '</body>',
      '</html>'
    ].join('\\n');
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function executeBirthdayCheck(isManual) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return { success: false, error: 'Birthday check is already in progress.' };
    }

    var resultSummary = {
      timestamp: new Date().toISOString(),
      checkedCount: 0,
      todayCount: 0,
      sentCount: 0,
      skippedDuplicateCount: 0,
      failedCount: 0,
      details: []
    };

    try {
      var settings = SettingsService.getSettings();
      var recipient = settings.recipientEmail;

      if (!recipient || recipient.indexOf('@') === -1) {
        throw new Error('Recipient email address is not configured or invalid.');
      }

      var people = PeopleService.getAllPeople(false);
      var analysis = BirthdayService.calculateAllBirthdays(
        people,
        settings.timezone,
        settings.leapDayPolicy
      );

      resultSummary.checkedCount = people.length;
      var todayBirthdays = [];

      for (var i = 0; i < analysis.calculations.length; i++) {
        var calc = analysis.calculations[i];
        if (calc.isToday) {
          todayBirthdays.push(calc);
        }
      }

      resultSummary.todayCount = todayBirthdays.length;

      if (todayBirthdays.length === 0) {
        SettingsService.updateSettings({
          lastRunTimestamp: resultSummary.timestamp,
          lastRunStatus: 'SUCCESS',
          lastRunSummary: 'Checked ' + people.length + ' people. No birthdays today (' + analysis.currentDate + ').'
        });
        return { success: true, summary: resultSummary, message: 'No birthdays today.' };
      }

      var toSend = [];
      for (var t = 0; t < todayBirthdays.length; t++) {
        var item = todayBirthdays[t];
        var alreadySent = wasAlreadySentToday(item.person.id, analysis.currentDate, recipient);

        if (alreadySent) {
          resultSummary.skippedDuplicateCount++;
          resultSummary.details.push({
            name: item.person.name,
            status: 'SKIPPED_DUPLICATE',
            message: 'Already sent reminder today'
          });
          logEmail({
            personId: item.person.id,
            personName: item.person.name,
            birthdayDate: analysis.currentDate,
            recipient: recipient,
            status: 'SKIPPED_DUPLICATE',
            errorMessage: 'Duplicate avoided: Reminder already dispatched today'
          });
        } else {
          toSend.push(item);
        }
      }

      if (toSend.length === 0) {
        SettingsService.updateSettings({
          lastRunTimestamp: resultSummary.timestamp,
          lastRunStatus: 'SUCCESS',
          lastRunSummary: 'All ' + todayBirthdays.length + ' birthday(s) today were already notified.'
        });
        return {
          success: true,
          summary: resultSummary,
          message: 'All birthdays for today have already received notifications.'
        };
      }

      var subject = (toSend.length === 1)
        ? '🎂 Birthday Today: ' + toSend[0].person.name + '!'
        : '🎂 ' + toSend.length + ' Birthdays Today (' + analysis.currentDate + ')';

      var htmlBody = buildEmailHtml(toSend, recipient, false);

      try {
        MailApp.sendEmail({
          to: recipient,
          subject: subject,
          htmlBody: htmlBody
        });

        for (var s = 0; s < toSend.length; s++) {
          var pItem = toSend[s];
          resultSummary.sentCount++;
          resultSummary.details.push({
            name: pItem.person.name,
            status: 'SENT',
            message: 'Email successfully sent'
          });
          logEmail({
            personId: pItem.person.id,
            personName: pItem.person.name,
            birthdayDate: analysis.currentDate,
            recipient: recipient,
            status: 'SENT',
            errorMessage: ''
          });
        }

        SettingsService.updateSettings({
          lastRunTimestamp: resultSummary.timestamp,
          lastRunStatus: 'SUCCESS',
          lastRunSummary: 'Sent reminder for ' + toSend.length + ' birthday(s) to ' + recipient + '.'
        });

      } catch (mailErr) {
        resultSummary.failedCount += toSend.length;
        for (var f = 0; f < toSend.length; f++) {
          var fItem = toSend[f];
          logEmail({
            personId: fItem.person.id,
            personName: fItem.person.name,
            birthdayDate: analysis.currentDate,
            recipient: recipient,
            status: 'FAILED',
            errorMessage: mailErr.message
          });
        }

        SettingsService.updateSettings({
          lastRunTimestamp: resultSummary.timestamp,
          lastRunStatus: 'ERROR',
          lastRunSummary: 'Mail send failed: ' + mailErr.message
        });

        throw mailErr;
      }

      return {
        success: true,
        summary: resultSummary,
        message: 'Successfully checked and sent ' + toSend.length + ' birthday reminder(s).'
      };

    } catch (err) {
      Logger.log('Birthday check error: ' + err.message);
      return { success: false, error: err.message, summary: resultSummary };
    } finally {
      lock.releaseLock();
    }
  }

  function sendTestEmail() {
    try {
      var settings = SettingsService.getSettings();
      var recipient = settings.recipientEmail;

      if (!recipient || recipient.indexOf('@') === -1) {
        return { success: false, error: 'Please enter a valid recipient email in settings first.' };
      }

      var testPerson = {
        person: {
          id: 'test-preview-id',
          name: 'Jane Doe (Sample Test)',
          dateOfBirth: '1995-10-22',
          notes: 'Favorite dessert is chocolate cake. Loves outdoor cycling.',
          active: true
        },
        formattedBirthday: 'October 22',
        turningAge: 31
      };

      var subject = '🎂 [Test] Birthday Reminder Configuration Verification';
      var htmlBody = buildEmailHtml([testPerson], recipient, true);

      MailApp.sendEmail({
        to: recipient,
        subject: subject,
        htmlBody: htmlBody
      });

      logEmail({
        personId: 'test-preview-id',
        personName: 'Jane Doe (Sample Test)',
        birthdayDate: new Date().toISOString().substring(0, 10),
        recipient: recipient,
        status: 'TEST',
        errorMessage: ''
      });

      return {
        success: true,
        recipient: recipient,
        message: 'Test email successfully dispatched to ' + recipient + '.'
      };

    } catch (err) {
      logEmail({
        personId: null,
        personName: 'System Test',
        birthdayDate: new Date().toISOString().substring(0, 10),
        recipient: recipient || 'Unknown',
        status: 'FAILED',
        errorMessage: err.message
      });
      return { success: false, error: err.message };
    }
  }

  return {
    getEmailLogs: getEmailLogs,
    executeBirthdayCheck: executeBirthdayCheck,
    sendTestEmail: sendTestEmail,
    logEmail: logEmail
  };
})();`
  },
  {
    filename: 'TriggerService.gs',
    type: 'script',
    description: 'Installs, verifies, and removes time-driven triggers executing dailyBirthdayCheck at selected hour.',
    content: `/**
 * @fileoverview Daily time-driven trigger manager for automated birthday checks.
 * @license Apache-2.0
 */

var TriggerService = (function () {
  var TRIGGER_FUNCTION = 'dailyBirthdayCheck';

  function checkDailyTriggerStatus() {
    var triggers = ScriptApp.getProjectTriggers();
    var count = 0;
    var triggerIds = [];

    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === TRIGGER_FUNCTION) {
        count++;
        triggerIds.push(triggers[i].getUniqueId());
      }
    }

    return {
      isInstalled: count > 0,
      count: count,
      triggerIds: triggerIds
    };
  }

  function installDailyTrigger(hour) {
    var targetHour = (typeof hour === 'number' && hour >= 0 && hour <= 23) ? hour : 8;

    removeDailyTrigger();

    try {
      var trigger = ScriptApp.newTrigger(TRIGGER_FUNCTION)
        .timeBased()
        .everyDays(1)
        .atHour(targetHour)
        .create();

      SettingsService.updateSettings({
        dailyTriggerHour: targetHour,
        triggerInstalled: true
      });

      return {
        success: true,
        triggerId: trigger.getUniqueId(),
        hour: targetHour,
        message: 'Daily trigger successfully installed for approximately ' + targetHour + ':00.'
      };
    } catch (err) {
      return {
        success: false,
        error: 'Failed to create daily trigger: ' + err.message
      };
    }
  }

  function removeDailyTrigger() {
    var triggers = ScriptApp.getProjectTriggers();
    var deletedCount = 0;

    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === TRIGGER_FUNCTION) {
        ScriptApp.deleteTrigger(triggers[i]);
        deletedCount++;
      }
    }

    SettingsService.updateSettings({
      triggerInstalled: false
    });

    return {
      success: true,
      deletedCount: deletedCount,
      message: 'Removed ' + deletedCount + ' existing trigger(s).'
    };
  }

  return {
    checkDailyTriggerStatus: checkDailyTriggerStatus,
    installDailyTrigger: installDailyTrigger,
    removeDailyTrigger: removeDailyTrigger,
    TRIGGER_FUNCTION: TRIGGER_FUNCTION
  };
})();`
  },
  {
    filename: 'SettingsService.gs',
    type: 'script',
    description: 'Reads and persists configuration in Settings sheet with validation and atomic lock protection.',
    content: `/**
 * @fileoverview Settings management service for reading and persisting configuration.
 * @license Apache-2.0
 */

var SettingsService = (function () {
  var DEFAULT_SETTINGS = {
    recipientEmail: '',
    dailyTriggerHour: 8,
    timezone: 'Asia/Kolkata',
    leapDayPolicy: 'FEB_28',
    spreadsheetId: '',
    triggerInstalled: false,
    lastRunTimestamp: '',
    lastRunStatus: 'IDLE',
    lastRunSummary: ''
  };

  function getSettings() {
    var ss = Setup.getSpreadsheet();
    var sheet = ss.getSheetByName(Setup.SETTINGS_SHEET);

    var settings = {};
    for (var k in DEFAULT_SETTINGS) {
      settings[k] = DEFAULT_SETTINGS[k];
    }
    settings.spreadsheetId = ss.getId();

    try {
      if (!settings.recipientEmail) {
        settings.recipientEmail = Session.getActiveUser().getEmail() || '';
      }
    } catch (e) {}

    if (!sheet) return settings;

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return settings;

    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < values.length; i++) {
      var key = String(values[i][0] || '').trim();
      var val = values[i][1];
      if (key) {
        if (key === 'dailyTriggerHour') {
          settings[key] = parseInt(val, 10) || 8;
        } else if (key === 'triggerInstalled') {
          settings[key] = (val === true || String(val).toLowerCase() === 'true');
        } else {
          settings[key] = String(val !== undefined && val !== null ? val : '');
        }
      }
    }

    try {
      var trg = TriggerService.checkDailyTriggerStatus();
      settings.triggerInstalled = trg.isInstalled;
    } catch (te) {}

    return settings;
  }

  function updateSettings(newSettings) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return { success: false, error: 'Settings service is busy. Please try again.' };
    }

    try {
      var ss = Setup.getSpreadsheet();
      var sheet = ss.getSheetByName(Setup.SETTINGS_SHEET);
      if (!sheet) {
        Setup.initializeSpreadsheet();
        sheet = ss.getSheetByName(Setup.SETTINGS_SHEET);
      }

      var lastRow = sheet.getLastRow();
      var existingRows = {};
      if (lastRow > 1) {
        var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < keys.length; i++) {
          var k = String(keys[i][0] || '').trim();
          if (k) existingRows[k] = i + 2;
        }
      }

      for (var key in newSettings) {
        var val = newSettings[key];
        if (key === 'recipientEmail' && val) {
          if (String(val).indexOf('@') === -1) {
            throw new Error('Please provide a valid email address.');
          }
        }
        if (key === 'dailyTriggerHour') {
          var num = parseInt(val, 10);
          if (isNaN(num) || num < 0 || num > 23) {
            throw new Error('Daily trigger hour must be between 0 and 23.');
          }
          val = num;
        }
        if (key === 'leapDayPolicy') {
          if (val !== 'FEB_28' && val !== 'MAR_01') {
            val = 'FEB_28';
          }
        }

        if (existingRows[key]) {
          sheet.getRange(existingRows[key], 2).setValue(val);
        } else {
          sheet.appendRow([key, val]);
          existingRows[key] = sheet.getLastRow();
        }
      }

      return {
        success: true,
        settings: getSettings()
      };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  }

  return {
    getSettings: getSettings,
    updateSettings: updateSettings,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS
  };
})();`
  },
  {
    filename: 'Index.html',
    type: 'html',
    description: 'Apps Script HTML Service primary markup with sidebar, dashboard KPIs, table, and modals.',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Birthday Reminder — Google Sheets</title>
  <?!= include('Styles'); ?>
</head>
<body>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <h1>🎂 Birthday Reminder</h1>
        <p>Google Sheets Database</p>
      </div>

      <nav class="sidebar-nav">
        <button class="nav-btn active" onclick="switchTab('dashboard')">
          <span>📊</span> Dashboard
        </button>
        <button class="nav-btn" onclick="switchTab('people')">
          <span>👥</span> All People (<span id="sidebar-count" class="tabular-nums">0</span>)
        </button>
        <button class="nav-btn" onclick="switchTab('upcoming')">
          <span>🗓️</span> Upcoming Birthdays
        </button>
        <button class="nav-btn" onclick="switchTab('logs')">
          <span>✉️</span> Email History
        </button>
        <button class="nav-btn" onclick="switchTab('settings')">
          <span>⚙️</span> Settings & Triggers
        </button>
      </nav>

      <div class="sidebar-footer">
        <div>Timezone: <strong>Asia/Kolkata</strong></div>
        <div id="sidebar-trigger-status" style="margin-top: 4px;">Trigger: Checking...</div>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div class="topbar-title" id="page-title">Dashboard Overview</div>
        <div class="topbar-actions">
          <button class="btn btn-secondary" onclick="runManualBirthdayCheck()" title="Check for birthdays today and dispatch emails">
            <span>⚡</span> Run Check
          </button>
          <button class="btn btn-primary" onclick="openAddPersonModal()">
            <span>+</span> Add Birthday
          </button>
        </div>
      </header>

      <div class="page-viewport">
        <div id="today-banner" class="today-alert" style="display: none;">
          <div>
            <strong id="today-banner-title">🎉 Birthdays Today!</strong>
            <div id="today-banner-desc" style="font-size: 13px; margin-top: 2px;"></div>
          </div>
          <button class="btn btn-primary" style="background: #059669;" onclick="runManualBirthdayCheck()">Send Reminder Now</button>
        </div>

        <section id="view-dashboard">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total People Saved</div>
              <div class="stat-value tabular-nums" id="stat-total">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Birthdays Today</div>
              <div class="stat-value tabular-nums" id="stat-today" style="color: #4f46e5;">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Upcoming (Next 7 Days)</div>
              <div class="stat-value tabular-nums" id="stat-week">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Upcoming (Next 30 Days)</div>
              <div class="stat-value tabular-nums" id="stat-month">0</div>
            </div>
          </div>

          <div class="next-birthday-hero" id="hero-spotlight">
            <div>
              <span class="hero-tag">Next Upcoming Birthday</span>
              <h2 class="hero-name" id="hero-name">—</h2>
              <p class="hero-sub" id="hero-sub">No upcoming birthdays yet</p>
              <div id="hero-notes" style="margin-top: 8px; font-size: 13px; color: #e0e7ff; max-width: 500px;"></div>
            </div>
            <div class="hero-countdown">
              <div class="hero-days tabular-nums" id="hero-days">—</div>
              <div class="hero-unit" id="hero-unit">Days Left</div>
            </div>
          </div>

          <div class="card-container">
            <div class="card-header">
              <h3 style="font-size: 15px; font-weight: 600;">Upcoming Birthdays (Next 30 Days)</h3>
              <button class="btn btn-secondary" onclick="switchTab('upcoming')">View All</button>
            </div>
            <div id="dashboard-table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date of Birth</th>
                    <th>Next Birthday</th>
                    <th>Turning Age</th>
                    <th>Days Remaining</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody id="dashboard-table-body"></tbody>
              </table>
              <div id="dashboard-empty" class="empty-state" style="display: none;">
                <h3>No birthdays in the next 30 days</h3>
                <p>Click "Add Birthday" above to save people to your Google Sheet.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="view-people" style="display: none;">
          <div class="card-container">
            <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
              <input type="text" id="search-input" class="form-input" style="max-width: 280px;" placeholder="Search by name or note..." oninput="filterPeopleTable()">
              <div style="display: flex; gap: 8px;">
                <select id="filter-select" class="form-select" style="width: auto;" onchange="filterPeopleTable()">
                  <option value="all">All Birthdays</option>
                  <option value="today">Today</option>
                  <option value="week">Next 7 Days</option>
                  <option value="month">Next 30 Days</option>
                  <option value="leap">Feb 29 Born</option>
                </select>
                <select id="sort-select" class="form-select" style="width: auto;" onchange="filterPeopleTable()">
                  <option value="upcoming">Sort: Next Birthday</option>
                  <option value="name-asc">Sort: Name (A-Z)</option>
                  <option value="name-desc">Sort: Name (Z-A)</option>
                  <option value="dob-asc">Sort: Age (Oldest)</option>
                  <option value="dob-desc">Sort: Age (Youngest)</option>
                </select>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date of Birth</th>
                  <th>Next Birthday</th>
                  <th>Days Left</th>
                  <th>Notes</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="people-table-body"></tbody>
            </table>
            <div id="people-empty" class="empty-state" style="display: none;">
              <h3>No matching records found</h3>
              <p>Add a new person or adjust your search filter.</p>
            </div>
          </div>
        </section>

        <section id="view-upcoming" style="display: none;">
          <div id="upcoming-groups-container"></div>
        </section>

        <section id="view-logs" style="display: none;">
          <div class="card-container">
            <div class="card-header">
              <h3 style="font-size: 15px; font-weight: 600;">Email Notification History (Last 50 Records)</h3>
              <button class="btn btn-secondary" onclick="reloadInitialData()">Refresh Logs</button>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Person Name</th>
                  <th>Birthday Date</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Details / Error</th>
                </tr>
              </thead>
              <tbody id="logs-table-body"></tbody>
            </table>
            <div id="logs-empty" class="empty-state" style="display: none;">
              <h3>No email logs recorded yet</h3>
              <p>Logs will automatically record whenever test or daily reminders execute.</p>
            </div>
          </div>
        </section>

        <section id="view-settings" style="display: none;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div class="card-container" style="padding: 24px;">
              <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 20px;">Reminder Configuration</h3>
              <form id="settings-form" onsubmit="handleSaveSettings(event)">
                <div class="form-group">
                  <label class="form-label" for="setting-email">Notification Recipient Email *</label>
                  <input type="email" id="setting-email" class="form-input" required>
                  <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Birthday reminders will be delivered to this address.</p>
                </div>

                <div class="form-group">
                  <label class="form-label" for="setting-hour">Daily Trigger Hour (Asia/Kolkata)</label>
                  <select id="setting-hour" class="form-select">
                    <option value="6">06:00 AM</option>
                    <option value="7">07:00 AM</option>
                    <option value="8" selected>08:00 AM (Recommended)</option>
                    <option value="9">09:00 AM</option>
                    <option value="10">10:00 AM</option>
                    <option value="12">12:00 PM (Noon)</option>
                    <option value="18">06:00 PM</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="setting-leap">Leap-Day Policy (Feb 29 Birthdays in non-leap years)</label>
                  <select id="setting-leap" class="form-select">
                    <option value="FEB_28">February 28th (Default)</option>
                    <option value="MAR_01">March 1st</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Timezone</label>
                  <input type="text" id="setting-tz" class="form-input" value="Asia/Kolkata" readonly style="background: #f1f5f9; cursor: not-allowed;">
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%;">Save Settings</button>
              </form>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="card-container" style="padding: 24px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Daily Automated Trigger</h3>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                  <span>Trigger Status:</span>
                  <span id="trigger-badge" style="font-weight: 600;">Checking...</span>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button class="btn btn-primary" onclick="installTrigger()">Install / Repair Trigger</button>
                  <button class="btn btn-danger" onclick="removeTrigger()">Remove Trigger</button>
                </div>
              </div>

              <div class="card-container" style="padding: 24px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Manual Diagnostic Actions</h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
                  Verify email dispatch or test the idempotent daily birthday checker without waiting.
                </p>
                <div style="display: flex; gap: 10px;">
                  <button class="btn btn-secondary" onclick="sendTestEmail()">Send Test Email</button>
                  <button class="btn btn-secondary" onclick="runManualBirthdayCheck()">Run Birthday Check Now</button>
                </div>
              </div>

              <div class="card-container" style="padding: 24px;">
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Database & Storage</h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
                  Spreadsheet ID: <code id="spreadsheet-id-display" style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Loading...</code>
                </p>
                <button class="btn btn-secondary" onclick="runSetupRoutine()">Verify & Repair Sheet Structure</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>

  <div id="person-modal" class="modal-overlay" style="display: none;">
    <div class="modal-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 id="modal-title" style="font-size: 18px; font-weight: 700;">Add Person</h3>
        <button style="border: none; background: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" onclick="closePersonModal()">&times;</button>
      </div>
      <form id="person-form" onsubmit="handlePersonSubmit(event)">
        <input type="hidden" id="person-id">
        <div class="form-group">
          <label class="form-label" for="person-name">Full Name *</label>
          <input type="text" id="person-name" class="form-input" placeholder="e.g. Maya Sharma" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="person-dob">Date of Birth (YYYY-MM-DD) *</label>
          <input type="date" id="person-dob" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="person-notes">Notes / Relationship (Optional)</label>
          <textarea id="person-notes" class="form-textarea" rows="3" placeholder="e.g. Sister, loves books."></textarea>
        </div>
        <div id="modal-error" style="color: var(--danger); font-size: 13px; margin-bottom: 14px; display: none;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="closePersonModal()">Cancel</button>
          <button type="submit" id="modal-submit-btn" class="btn btn-primary">Save Birthday</button>
        </div>
      </form>
    </div>
  </div>

  <div id="delete-modal" class="modal-overlay" style="display: none;">
    <div class="modal-box">
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Confirm Deletion</h3>
      <p id="delete-confirm-text" style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
        Are you sure you want to delete this person?
      </p>
      <input type="hidden" id="delete-person-id">
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn btn-secondary" onclick="closeDeleteModal()">Cancel</button>
        <button type="button" id="confirm-delete-btn" class="btn btn-danger" onclick="executeDeletePerson()">Delete Record</button>
      </div>
    </div>
  </div>

  <div id="toast" class="toast">
    <span id="toast-icon">ℹ️</span>
    <span id="toast-message">Notification message</span>
  </div>

  <?!= include('JavaScript'); ?>
</body>
</html>`
  },
  {
    filename: 'Styles.html',
    type: 'html',
    description: 'Clean responsive CSS styling for Google Apps Script HTML Service dashboard.',
    content: `<style>
  :root {
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --border: #e2e8f0;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --accent: #4f46e5;
    --accent-hover: #4338ca;
    --accent-soft: #eef2ff;
    --success: #16a34a;
    --warning: #d97706;
    --danger: #dc2626;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", sans-serif;
    background-color: var(--bg-main);
    color: var(--text-primary);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .tabular-nums { font-variant-numeric: tabular-nums; }
  .app-layout { display: flex; min-height: 100vh; }
  .sidebar {
    width: 260px;
    background: #0f172a;
    color: #f8fafc;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; bottom: 0; left: 0;
    z-index: 40;
    border-right: 1px solid #1e293b;
  }
  .sidebar-brand { padding: 24px 20px; border-bottom: 1px solid #1e293b; }
  .sidebar-brand h1 { font-size: 16px; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 8px; }
  .sidebar-brand p { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .sidebar-nav { padding: 16px 12px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .nav-btn {
    display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 14px;
    border-radius: 8px; background: transparent; border: none; color: #94a3b8;
    font-size: 14px; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.15s ease;
  }
  .nav-btn:hover { background: #1e293b; color: #ffffff; }
  .nav-btn.active { background: #312e81; color: #c7d2fe; font-weight: 600; }
  .sidebar-footer { padding: 16px 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; }
  .main-content { flex: 1; margin-left: 260px; min-height: 100vh; display: flex; flex-direction: column; }
  .topbar {
    height: 64px; background: #ffffff; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; padding: 0 32px;
    position: sticky; top: 0; z-index: 30;
  }
  .topbar-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
  .topbar-actions { display: flex; align-items: center; gap: 12px; }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
    cursor: pointer; border: 1px solid transparent; white-space: nowrap; transition: all 0.15s ease;
  }
  .btn-primary { background: var(--accent); color: #ffffff; }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-secondary { background: #ffffff; border-color: var(--border); color: var(--text-primary); }
  .btn-secondary:hover { background: #f1f5f9; }
  .btn-danger { background: #fef2f2; border-color: #fecaca; color: var(--danger); }
  .btn-danger:hover { background: #fee2e2; }
  .page-viewport { padding: 32px; max-width: 1280px; width: 100%; margin: 0 auto; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .stat-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
  .stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); margin-top: 6px; }
  .next-birthday-hero {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    color: #ffffff; border-radius: 14px; padding: 28px 32px; margin-bottom: 28px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .hero-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #a5b4fc; font-weight: 600; }
  .hero-name { font-size: 26px; font-weight: 700; margin: 6px 0 4px 0; }
  .hero-sub { font-size: 14px; color: #c7d2fe; }
  .hero-countdown { text-align: right; }
  .hero-days { font-size: 42px; font-weight: 800; line-height: 1; color: #ffffff; }
  .hero-unit { font-size: 12px; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.05em; }
  .today-alert {
    background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px;
    padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; color: #065f46;
  }
  .card-container { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .card-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .table th {
    text-align: left; padding: 12px 18px; background: #f8fafc; color: var(--text-secondary);
    font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--border);
  }
  .table td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; color: var(--text-primary); }
  .table tr:hover { background: #f8fafc; }
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6);
    display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(2px);
  }
  .modal-box {
    background: #ffffff; border-radius: 14px; width: 100%; max-width: 500px;
    padding: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
  .form-input, .form-select, .form-textarea {
    width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border);
    font-size: 14px; color: var(--text-primary); outline: none; transition: border-color 0.15s ease;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent); }
  .toast {
    position: fixed; bottom: 24px; right: 24px; background: #0f172a; color: #ffffff;
    padding: 14px 20px; border-radius: 10px; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
    z-index: 60; display: flex; align-items: center; gap: 10px; transform: translateY(100px); opacity: 0; transition: all 0.25s ease;
  }
  .toast.show { transform: translateY(0); opacity: 1; }
  .empty-state { padding: 48px 24px; text-align: center; color: var(--text-secondary); }
  .empty-state h3 { font-size: 16px; color: var(--text-primary); margin-bottom: 6px; }
  @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) {
    .sidebar { display: none; }
    .main-content { margin-left: 0; }
    .stats-grid { grid-template-columns: 1fr; }
    .page-viewport { padding: 16px; }
  }
</style>`
  },
  {
    filename: 'JavaScript.html',
    type: 'html',
    description: 'Client-side script invoking google.script.run for CRUD, triggers, manual test runs, and toasts.',
    content: `<script>
  var appState = {
    people: [],
    settings: {
      recipientEmail: '',
      dailyTriggerHour: 8,
      timezone: 'Asia/Kolkata',
      leapDayPolicy: 'FEB_28',
      spreadsheetId: '',
      triggerInstalled: false
    },
    emailLogs: [],
    triggerStatus: { isInstalled: false },
    currentTab: 'dashboard'
  };

  window.addEventListener('DOMContentLoaded', function () {
    loadInitialData();
  });

  function showToast(message, isError) {
    var toast = document.getElementById('toast');
    var msgSpan = document.getElementById('toast-message');
    var iconSpan = document.getElementById('toast-icon');

    msgSpan.textContent = message;
    iconSpan.textContent = isError ? '⚠️' : '✅';
    toast.style.background = isError ? '#991b1b' : '#0f172a';
    toast.classList.add('show');

    setTimeout(function () {
      toast.classList.remove('show');
    }, 4000);
  }

  function loadInitialData() {
    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      console.warn('google.script.run not available in standalone preview.');
      return;
    }

    google.script.run
      .withSuccessHandler(function (response) {
        if (!response) return;
        appState.people = response.people || [];
        appState.settings = response.settings || {};
        appState.emailLogs = response.emailLogs || [];
        appState.triggerStatus = response.triggerStatus || { isInstalled: false };
        renderAll();
      })
      .withFailureHandler(function (error) {
        showToast('Error loading database: ' + error.message, true);
      })
      .getInitialData();
  }

  function reloadInitialData() {
    showToast('Refreshing data from Google Sheets...', false);
    loadInitialData();
  }

  function switchTab(tabName) {
    appState.currentTab = tabName;
    var tabs = ['dashboard', 'people', 'upcoming', 'logs', 'settings'];
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var section = document.getElementById('view-' + t);
      if (section) section.style.display = (t === tabName) ? 'block' : 'none';
    }

    var navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(function (btn, idx) {
      btn.classList.toggle('active', tabs[idx] === tabName);
    });

    var titles = {
      dashboard: 'Dashboard Overview',
      people: 'All Saved People',
      upcoming: 'Upcoming Birthdays Timeline',
      logs: 'Email History & Logs',
      settings: 'Settings & Automation'
    };
    document.getElementById('page-title').textContent = titles[tabName] || 'Birthday Reminder';

    if (tabName === 'people') filterPeopleTable();
    if (tabName === 'upcoming') renderUpcomingTimeline();
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function getClientNowInTz() {
    var tz = appState.settings.timezone || 'Asia/Kolkata';
    try {
      var formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      var parts = formatter.format(new Date()).split('-');
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10),
        day: parseInt(parts[2], 10),
        dateString: parts[0] + '-' + parts[1] + '-' + parts[2]
      };
    } catch (e) {
      var d = new Date();
      var y = d.getFullYear();
      var m = ('0' + (d.getMonth() + 1)).slice(-2);
      var day = ('0' + d.getDate()).slice(-2);
      return { year: y, month: d.getMonth() + 1, day: d.getDate(), dateString: y + '-' + m + '-' + day };
    }
  }

  function calculatePersonMetrics(person) {
    var now = getClientNowInTz();
    var bParts = person.dateOfBirth.split('-');
    var bYear = parseInt(bParts[0], 10);
    var bMonth = parseInt(bParts[1], 10);
    var bDay = parseInt(bParts[2], 10);
    var isFeb29 = (bMonth === 2 && bDay === 29);
    var policy = appState.settings.leapDayPolicy || 'FEB_28';

    function getMD(yr) {
      if (!isFeb29) return { m: bMonth, d: bDay };
      if (isLeapYear(yr)) return { m: 2, d: 29 };
      return (policy === 'MAR_01') ? { m: 3, d: 1 } : { m: 2, d: 28 };
    }

    var thisYearMD = getMD(now.year);
    var thisYearStr = now.year + '-' + ('0' + thisYearMD.m).slice(-2) + '-' + ('0' + thisYearMD.d).slice(-2);

    var d1 = Date.UTC(now.year, now.month - 1, now.day);
    var d2 = Date.UTC(now.year, thisYearMD.m - 1, thisYearMD.d);
    var diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

    var nextStr = thisYearStr;
    var nextYr = now.year;

    if (diffDays < 0) {
      nextYr = now.year + 1;
      var nextMD = getMD(nextYr);
      nextStr = nextYr + '-' + ('0' + nextMD.m).slice(-2) + '-' + ('0' + nextMD.d).slice(-2);
      var dNext = Date.UTC(nextYr, nextMD.m - 1, nextMD.d);
      diffDays = Math.round((dNext - d1) / (1000 * 60 * 60 * 24));
    }

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var targetMD = getMD(nextYr);

    return {
      person: person,
      nextBirthdayStr: nextStr,
      formattedShort: months[targetMD.m - 1] + ' ' + targetMD.d,
      daysRemaining: diffDays,
      turningAge: nextYr - bYear,
      isToday: diffDays === 0,
      isTomorrow: diffDays === 1,
      isWeek: diffDays >= 0 && diffDays <= 7,
      isMonth: diffDays >= 0 && diffDays <= 30
    };
  }

  function renderAll() {
    var people = appState.people || [];
    var calcs = people.map(calculatePersonMetrics);
    calcs.sort(function (a, b) { return a.daysRemaining - b.daysRemaining; });

    var todayList = calcs.filter(function (c) { return c.isToday; });
    var weekList = calcs.filter(function (c) { return c.daysRemaining > 0 && c.daysRemaining <= 7; });
    var monthList = calcs.filter(function (c) { return c.daysRemaining > 0 && c.daysRemaining <= 30; });

    document.getElementById('stat-total').textContent = people.length;
    document.getElementById('stat-today').textContent = todayList.length;
    document.getElementById('stat-week').textContent = weekList.length;
    document.getElementById('stat-month').textContent = monthList.length;
    document.getElementById('sidebar-count').textContent = people.length;

    var todayBanner = document.getElementById('today-banner');
    if (todayList.length > 0) {
      todayBanner.style.display = 'flex';
      var names = todayList.map(function (c) { return c.person.name + ' (' + c.turningAge + ')'; }).join(', ');
      document.getElementById('today-banner-desc').textContent = names;
    } else {
      todayBanner.style.display = 'none';
    }

    var next = calcs.length > 0 ? calcs[0] : null;
    if (next) {
      document.getElementById('hero-name').textContent = next.person.name;
      var ageMsg = next.turningAge > 0 ? ('Turning ' + next.turningAge + ' years old on ' + next.formattedShort) : ('Birthday on ' + next.formattedShort);
      document.getElementById('hero-sub').textContent = ageMsg;
      document.getElementById('hero-notes').textContent = next.person.notes ? ('Note: ' + next.person.notes) : '';

      if (next.daysRemaining === 0) {
        document.getElementById('hero-days').textContent = 'TODAY';
        document.getElementById('hero-unit').textContent = 'Celebration!';
      } else if (next.daysRemaining === 1) {
        document.getElementById('hero-days').textContent = '1';
        document.getElementById('hero-unit').textContent = 'Day Left (Tomorrow)';
      } else {
        document.getElementById('hero-days').textContent = next.daysRemaining;
        document.getElementById('hero-unit').textContent = 'Days Left';
      }
    } else {
      document.getElementById('hero-name').textContent = 'No Birthdays Added';
      document.getElementById('hero-sub').textContent = 'Add your friends and family to begin tracking.';
      document.getElementById('hero-notes').textContent = '';
      document.getElementById('hero-days').textContent = '0';
      document.getElementById('hero-unit').textContent = 'Days';
    }

    var dbBody = document.getElementById('dashboard-table-body');
    var dbEmpty = document.getElementById('dashboard-empty');
    dbBody.innerHTML = '';

    var previewList = calcs.filter(function (c) { return c.daysRemaining >= 0 && c.daysRemaining <= 30; });
    if (previewList.length === 0) {
      dbEmpty.style.display = 'block';
    } else {
      dbEmpty.style.display = 'none';
      for (var i = 0; i < previewList.length; i++) {
        var item = previewList[i];
        var tr = document.createElement('tr');
        var daysText = item.daysRemaining === 0 ? '<strong style="color: #4f46e5;">Today! 🎉</strong>' : (item.daysRemaining === 1 ? 'Tomorrow' : item.daysRemaining + ' days');
        tr.innerHTML = [
          '<td><strong>' + escapeHtml(item.person.name) + '</strong></td>',
          '<td class="tabular-nums">' + item.person.dateOfBirth + '</td>',
          '<td>' + item.formattedShort + '</td>',
          '<td class="tabular-nums">' + item.turningAge + '</td>',
          '<td class="tabular-nums">' + daysText + '</td>',
          '<td style="color: #64748b; font-size: 13px;">' + escapeHtml(item.person.notes || '—') + '</td>'
        ].join('');
        dbBody.appendChild(tr);
      }
    }

    document.getElementById('setting-email').value = appState.settings.recipientEmail || '';
    document.getElementById('setting-hour').value = appState.settings.dailyTriggerHour || 8;
    document.getElementById('setting-leap').value = appState.settings.leapDayPolicy || 'FEB_28';
    document.getElementById('spreadsheet-id-display').textContent = appState.settings.spreadsheetId || 'Active Bound Sheet';

    var isTrg = appState.triggerStatus && appState.triggerStatus.isInstalled;
    var badge = document.getElementById('trigger-badge');
    badge.textContent = isTrg ? 'Active (Scheduled Daily)' : 'Not Installed';
    badge.style.color = isTrg ? '#16a34a' : '#d97706';
    document.getElementById('sidebar-trigger-status').textContent = 'Trigger: ' + (isTrg ? 'Installed' : 'Disabled');

    renderLogs();
  }

  function filterPeopleTable() {
    var search = (document.getElementById('search-input').value || '').toLowerCase().trim();
    var filter = document.getElementById('filter-select').value;
    var sort = document.getElementById('sort-select').value;

    var calcs = appState.people.map(calculatePersonMetrics);

    var filtered = calcs.filter(function (c) {
      var matchesSearch = !search ||
        c.person.name.toLowerCase().indexOf(search) !== -1 ||
        (c.person.notes && c.person.notes.toLowerCase().indexOf(search) !== -1);

      if (!matchesSearch) return false;
      if (filter === 'today') return c.isToday;
      if (filter === 'week') return c.isWeek;
      if (filter === 'month') return c.isMonth;
      if (filter === 'leap') return (c.person.dateOfBirth.slice(5) === '02-29');
      return true;
    });

    filtered.sort(function (a, b) {
      if (sort === 'upcoming') return a.daysRemaining - b.daysRemaining;
      if (sort === 'name-asc') return a.person.name.localeCompare(b.person.name);
      if (sort === 'name-desc') return b.person.name.localeCompare(a.person.name);
      if (sort === 'dob-asc') return a.person.dateOfBirth.localeCompare(b.person.dateOfBirth);
      if (sort === 'dob-desc') return b.person.dateOfBirth.localeCompare(a.person.dateOfBirth);
      return 0;
    });

    var tbody = document.getElementById('people-table-body');
    var empty = document.getElementById('people-empty');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      for (var i = 0; i < filtered.length; i++) {
        var c = filtered[i];
        var tr = document.createElement('tr');
        var daysText = c.daysRemaining === 0 ? '<strong style="color: #4f46e5;">Today! 🎂</strong>' : (c.daysRemaining === 1 ? 'Tomorrow' : c.daysRemaining + ' days');

        tr.innerHTML = [
          '<td><strong>' + escapeHtml(c.person.name) + '</strong></td>',
          '<td class="tabular-nums">' + c.person.dateOfBirth + '</td>',
          '<td>' + c.formattedShort + '</td>',
          '<td class="tabular-nums">' + daysText + '</td>',
          '<td style="color: #64748b; font-size: 13px; max-width: 240px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">' + escapeHtml(c.person.notes || '—') + '</td>',
          '<td style="text-align: right;">' +
            '<button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px; margin-right: 6px;" onclick="openEditPersonModal(\\'' + c.person.id + '\\')">Edit</button>' +
            '<button class="btn btn-danger" style="padding: 4px 10px; font-size: 12px;" onclick="openDeletePersonModal(\\'' + c.person.id + '\\', \\'' + escapeHtml(c.person.name) + '\\')">Delete</button>' +
          '</td>'
        ].join('');
        tbody.appendChild(tr);
      }
    }
  }

  function renderUpcomingTimeline() {
    var container = document.getElementById('upcoming-groups-container');
    container.innerHTML = '';

    var calcs = appState.people.map(calculatePersonMetrics);
    calcs.sort(function (a, b) { return a.daysRemaining - b.daysRemaining; });

    var groups = {
      today: { title: 'Today 🎉', items: [] },
      week: { title: 'This Week', items: [] },
      month: { title: 'This Month', items: [] },
      later: { title: 'Later this Year & Next Year', items: [] }
    };

    for (var i = 0; i < calcs.length; i++) {
      var item = calcs[i];
      if (item.isToday) groups.today.items.push(item);
      else if (item.daysRemaining <= 7) groups.week.items.push(item);
      else if (item.daysRemaining <= 30) groups.month.items.push(item);
      else groups.later.items.push(item);
    }

    var groupKeys = ['today', 'week', 'month', 'later'];
    for (var g = 0; g < groupKeys.length; g++) {
      var grp = groups[groupKeys[g]];
      if (grp.items.length === 0) continue;

      var grpCard = document.createElement('div');
      grpCard.className = 'card-container';
      grpCard.style.marginBottom = '20px';

      var header = document.createElement('div');
      header.className = 'card-header';
      header.innerHTML = '<h3 style="font-size: 15px; font-weight: 600;">' + grp.title + ' (' + grp.items.length + ')</h3>';
      grpCard.appendChild(header);

      var table = document.createElement('table');
      table.className = 'table';
      table.innerHTML = '<thead><tr><th>Name</th><th>Date</th><th>Countdown</th><th>Turning Age</th><th>Notes</th></tr></thead>';
      var tb = document.createElement('tbody');

      for (var k = 0; k < grp.items.length; k++) {
        var it = grp.items[k];
        var tr = document.createElement('tr');
        var countdown = it.daysRemaining === 0 ? '<strong style="color: #4f46e5;">Today!</strong>' : (it.daysRemaining === 1 ? 'Tomorrow' : 'In ' + it.daysRemaining + ' days');
        tr.innerHTML = [
          '<td><strong>' + escapeHtml(it.person.name) + '</strong></td>',
          '<td>' + it.formattedShort + '</td>',
          '<td class="tabular-nums">' + countdown + '</td>',
          '<td class="tabular-nums">' + it.turningAge + ' yrs</td>',
          '<td style="color: #64748b; font-size: 13px;">' + escapeHtml(it.person.notes || '—') + '</td>'
        ].join('');
        tb.appendChild(tr);
      }
      table.appendChild(tb);
      grpCard.appendChild(table);
      container.appendChild(grpCard);
    }
  }

  function renderLogs() {
    var logs = appState.emailLogs || [];
    var tbody = document.getElementById('logs-table-body');
    var empty = document.getElementById('logs-empty');
    tbody.innerHTML = '';

    if (logs.length === 0) {
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      for (var i = 0; i < logs.length; i++) {
        var l = logs[i];
        var tr = document.createElement('tr');
        var statusColor = '#475569';
        if (l.status === 'SENT') statusColor = '#16a34a';
        else if (l.status === 'SKIPPED_DUPLICATE') statusColor = '#4f46e5';
        else if (l.status === 'FAILED') statusColor = '#dc2626';
        else if (l.status === 'TEST') statusColor = '#0284c7';

        tr.innerHTML = [
          '<td><strong>' + escapeHtml(l.personName || 'System') + '</strong></td>',
          '<td class="tabular-nums">' + (l.birthdayDate || '—') + '</td>',
          '<td style="font-size: 13px;">' + escapeHtml(l.recipient || '—') + '</td>',
          '<td><span style="font-size: 12px; font-weight: 600; color: ' + statusColor + ';">' + l.status + '</span></td>',
          '<td class="tabular-nums" style="font-size: 12px; color: #64748b;">' + (l.sentAt ? l.sentAt.replace('T', ' ').substring(0, 19) : '—') + '</td>',
          '<td style="font-size: 13px; color: #64748b;">' + escapeHtml(l.errorMessage || 'Delivered successfully') + '</td>'
        ].join('');
        tbody.appendChild(tr);
      }
    }
  }

  function openAddPersonModal() {
    document.getElementById('modal-title').textContent = 'Add Person';
    document.getElementById('person-id').value = '';
    document.getElementById('person-name').value = '';
    document.getElementById('person-dob').value = '';
    document.getElementById('person-notes').value = '';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('person-modal').style.display = 'flex';
  }

  function openEditPersonModal(id) {
    var person = appState.people.find(function (p) { return p.id === id; });
    if (!person) return;

    document.getElementById('modal-title').textContent = 'Edit Person';
    document.getElementById('person-id').value = person.id;
    document.getElementById('person-name').value = person.name;
    document.getElementById('person-dob').value = person.dateOfBirth;
    document.getElementById('person-notes').value = person.notes || '';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('person-modal').style.display = 'flex';
  }

  function closePersonModal() {
    document.getElementById('person-modal').style.display = 'none';
  }

  function handlePersonSubmit(e) {
    e.preventDefault();
    var id = document.getElementById('person-id').value;
    var name = document.getElementById('person-name').value.trim();
    var dob = document.getElementById('person-dob').value.trim();
    var notes = document.getElementById('person-notes').value.trim();

    var errBox = document.getElementById('modal-error');
    if (!name) {
      errBox.textContent = 'Please enter a full name.';
      errBox.style.display = 'block';
      return;
    }
    if (!dob) {
      errBox.textContent = 'Please enter a valid date of birth.';
      errBox.style.display = 'block';
      return;
    }

    var payload = { id: id || undefined, name: name, dateOfBirth: dob, notes: notes };
    var btn = document.getElementById('modal-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        btn.textContent = 'Save Birthday';
        if (res && res.success) {
          closePersonModal();
          showToast('Person successfully saved to Google Sheet!', false);
          loadInitialData();
        } else {
          errBox.textContent = (res && res.error) ? res.error : 'Failed to save person.';
          errBox.style.display = 'block';
        }
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        btn.textContent = 'Save Birthday';
        errBox.textContent = err.message;
        errBox.style.display = 'block';
      })
      .apiSavePerson(payload);
  }

  function openDeletePersonModal(id, name) {
    document.getElementById('delete-person-id').value = id;
    document.getElementById('delete-confirm-text').textContent =
      'Are you sure you want to delete "' + name + '"?';
    document.getElementById('delete-modal').style.display = 'flex';
  }

  function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
  }

  function executeDeletePerson() {
    var id = document.getElementById('delete-person-id').value;
    var btn = document.getElementById('confirm-delete-btn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        btn.textContent = 'Delete Record';
        closeDeleteModal();
        if (res && res.success) {
          showToast('Record deleted from Google Sheet.', false);
          loadInitialData();
        } else {
          showToast('Error deleting record: ' + (res.error || 'Unknown'), true);
        }
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        btn.textContent = 'Delete Record';
        closeDeleteModal();
        showToast('Delete failed: ' + err.message, true);
      })
      .apiDeletePerson(id);
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    var email = document.getElementById('setting-email').value.trim();
    var hour = parseInt(document.getElementById('setting-hour').value, 10);
    var leap = document.getElementById('setting-leap').value;

    showToast('Saving settings to Google Sheets...', false);
    google.script.run
      .withSuccessHandler(function (res) {
        if (res && res.success) {
          showToast('Settings saved successfully!', false);
          appState.settings = res.settings;
          renderAll();
        } else {
          showToast('Error saving settings: ' + (res.error || 'Unknown'), true);
        }
      })
      .withFailureHandler(function (err) {
        showToast('Settings error: ' + err.message, true);
      })
      .apiSaveSettings({
        recipientEmail: email,
        dailyTriggerHour: hour,
        leapDayPolicy: leap
      });
  }

  function installTrigger() {
    var hour = parseInt(document.getElementById('setting-hour').value, 10) || 8;
    showToast('Installing daily trigger in Google Apps Script...', false);
    google.script.run
      .withSuccessHandler(function (res) {
        if (res && res.success) {
          showToast('Daily reminder trigger installed for ~' + hour + ':00!', false);
          loadInitialData();
        } else {
          showToast('Trigger installation failed: ' + (res.error || 'Unknown'), true);
        }
      })
      .withFailureHandler(function (err) {
        showToast('Trigger error: ' + err.message, true);
      })
      .apiInstallTrigger(hour);
  }

  function removeTrigger() {
    showToast('Removing trigger...', false);
    google.script.run
      .withSuccessHandler(function (res) {
        if (res && res.success) {
          showToast('Daily trigger removed.', false);
          loadInitialData();
        } else {
          showToast('Failed to remove trigger.', true);
        }
      })
      .withFailureHandler(function (err) {
        showToast('Error: ' + err.message, true);
      })
      .apiRemoveTrigger();
  }

  function sendTestEmail() {
    showToast('Sending test email to configured administrator...', false);
    google.script.run
      .withSuccessHandler(function (res) {
        if (res && res.success) {
          showToast('Test email sent to ' + res.recipient + '!', false);
          loadInitialData();
        } else {
          showToast('Test email failed: ' + (res.error || 'Check permissions'), true);
        }
      })
      .withFailureHandler(function (err) {
        showToast('Test email failed: ' + err.message, true);
      })
      .apiSendTestEmailManual();
  }

  function runManualBirthdayCheck() {
    showToast('Executing birthday check in Asia/Kolkata...', false);
    google.script.run
      .withSuccessHandler(function (res) {
        if (res && res.success) {
          showToast(res.message || 'Birthday check completed successfully.', false);
          loadInitialData();
        } else {
          showToast('Check failed: ' + (res.error || 'Unknown error'), true);
        }
      })
      .withFailureHandler(function (err) {
        showToast('Execution error: ' + err.message, true);
      })
      .apiRunBirthdayCheckManual();
  }

  function runSetupRoutine() {
    showToast('Verifying Google Sheets database tabs and formatting...', false);
    google.script.run
      .withSuccessHandler(function (res) {
        if (res && res.success) {
          showToast('Database verified! Spreadsheet ID: ' + res.spreadsheetId, false);
          loadInitialData();
        } else {
          showToast('Setup error: ' + (res.error || 'Failed to initialize sheet'), true);
        }
      })
      .withFailureHandler(function (err) {
        showToast('Setup error: ' + err.message, true);
      })
      .apiRunSetup();
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
</script>`
  },
  {
    filename: 'README.md',
    type: 'doc',
    description: 'Documentation detailing Google Sheets and Apps Script setup, OAuth permissions, web app deployment, and testing.',
    content: `# Birthday Reminder — Google Sheets & Google Apps Script Setup Guide

## Quick Deployment Steps:
1. Open https://sheets.new and create a new sheet named "Birthday Reminder Database".
2. Click Extensions > Apps Script.
3. Replace appsscript.json with the provided manifest.
4. Add the 7 .gs script files and 3 .html files.
5. Run Setup.initializeSpreadsheet() once to create tabs and authorize permissions.
6. Click Deploy > New deployment > Web app (Who has access: Only myself).
7. Open the Web App URL, configure recipient email, and click Install / Repair Trigger.
`
  }
];

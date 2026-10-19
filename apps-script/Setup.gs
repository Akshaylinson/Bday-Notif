/**
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

  /**
   * Retrieves the active or configured Spreadsheet.
   * If container-bound, uses SpreadsheetApp.getActiveSpreadsheet().
   * Otherwise uses SPREADSHEET_ID from ScriptProperties, or creates a new one.
   */
  function getSpreadsheet() {
    var props = PropertiesService.getScriptProperties();
    var storedId = props.getProperty('SPREADSHEET_ID');

    if (storedId) {
      try {
        return SpreadsheetApp.openById(storedId);
      } catch (e) {
        Logger.log('Could not open stored spreadsheet ID: ' + storedId + '. Falling back.');
      }
    }

    try {
      var active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) {
        props.setProperty('SPREADSHEET_ID', active.getId());
        return active;
      }
    } catch (e) {
      // Standalone script
    }

    // If standalone and no spreadsheet configured, create one
    var newSheet = SpreadsheetApp.create('Birthday Reminder Database');
    props.setProperty('SPREADSHEET_ID', newSheet.getId());
    return newSheet;
  }

  /**
   * Safe initialization routine: creates tabs, applies formatting and default settings.
   * Does NOT erase existing rows.
   */
  function initializeSpreadsheet() {
    var ss = getSpreadsheet();
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_ID', ss.getId());

    initSheet(ss, PEOPLE_SHEET, PEOPLE_HEADERS, [200, 220, 140, 300, 180, 180, 100]);
    initSheet(ss, EMAIL_LOG_SHEET, EMAIL_LOG_HEADERS, [200, 200, 200, 130, 220, 140, 180, 260]);
    initSheet(ss, SETTINGS_SHEET, SETTINGS_HEADERS, [220, 300]);

    // Populate default settings if not already present
    populateDefaultSettings(ss);

    // Remove default 'Sheet1' if other sheets exist
    try {
      var defaultSheet = ss.getSheetByName('Sheet1');
      if (defaultSheet && ss.getSheets().length > 1) {
        ss.deleteSheet(defaultSheet);
      }
    } catch (e) {
      // Ignore if cannot delete
    }

    return {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl()
    };
  }

  /**
   * Creates or verifies a sheet, applies headers, and styles.
   */
  function initSheet(ss, sheetName, headers, colWidths) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Check if headers already exist
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      // Verify headers match
      var currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      var needsHeaderUpdate = false;
      for (var i = 0; i < headers.length; i++) {
        if (currentHeaders[i] !== headers[i]) {
          needsHeaderUpdate = true;
          break;
        }
      }
      if (needsHeaderUpdate) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
    }

    // Apply header row styling
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f172a'); // Slate 900
    headerRange.setFontColor('#f8fafc'); // Slate 50
    headerRange.setFontWeight('bold');
    headerRange.setFontFamily('Arial');
    headerRange.setFontSize(10);
    headerRange.setVerticalAlignment('middle');
    headerRange.setHorizontalAlignment('center');
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);

    // Apply column widths
    if (colWidths && colWidths.length) {
      for (var c = 0; c < colWidths.length; c++) {
        sheet.setColumnWidth(c + 1, colWidths[c]);
      }
    }
  }

  /**
   * Populates default configuration values into Settings tab without overwriting.
   */
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

    var defaultEmail = '';
    try { defaultEmail = Session.getActiveUser().getEmail() || ''; } catch (e) {}
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
})();

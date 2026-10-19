/**
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

  /**
   * Retrieves all settings as a key-value object.
   * @return {Object} Application settings.
   */
  function getSettings() {
    var ss = Setup.getSpreadsheet();
    var sheet = ss.getSheetByName(Setup.SETTINGS_SHEET);

    var settings = {};
    for (var k in DEFAULT_SETTINGS) {
      settings[k] = DEFAULT_SETTINGS[k];
    }
    settings.spreadsheetId = ss.getId();

    // Default recipient email from current active user if empty
    try {
      if (!settings.recipientEmail) {
        settings.recipientEmail = Session.getActiveUser().getEmail() || '';
      }
    } catch (e) {
      // Ignore in certain execution contexts
    }

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

    // Check actual trigger installation
    try {
      var trg = TriggerService.checkDailyTriggerStatus();
      settings.triggerInstalled = trg.isInstalled;
    } catch (te) {
      // Ignore
    }

    return settings;
  }

  /**
   * Updates application settings in the Settings sheet.
   * @param {Object} newSettings Key-value object of settings to update.
   * @return {Object} Updated settings.
   */
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
})();

/**
 * @fileoverview Daily time-driven trigger manager for automated birthday checks.
 * @license Apache-2.0
 */

var TriggerService = (function () {
  var TRIGGER_FUNCTION = 'dailyBirthdayCheck';

  /**
   * Checks whether the daily time-driven trigger is installed.
   * @return {Object} Status object with isInstalled and trigger count.
   */
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

  /**
   * Installs or repairs the daily time-driven trigger for the specified hour.
   * Note: Google Apps Script time-driven triggers run within a +/- 15 minute window of the specified hour.
   * @param {number} hour Hour of day (0 to 23).
   * @return {Object} Result object.
   */
  function installDailyTrigger(hour) {
    var targetHour = (typeof hour === 'number' && hour >= 0 && hour <= 23) ? hour : 8;

    // First delete any existing trigger for dailyBirthdayCheck to prevent duplicate runs
    removeDailyTrigger();

    // Create new daily trigger
    try {
      var trigger = ScriptApp.newTrigger(TRIGGER_FUNCTION)
        .timeBased()
        .everyDays(1)
        .atHour(targetHour)
        .create();

      // Update settings with the hour
      SettingsService.updateSettings({
        dailyTriggerHour: targetHour,
        triggerInstalled: true
      });

      return {
        success: true,
        triggerId: trigger.getUniqueId(),
        hour: targetHour,
        message: 'Daily trigger successfully installed for approximately ' + targetHour + ':00 AM/PM.'
      };
    } catch (err) {
      return {
        success: false,
        error: 'Failed to create daily trigger: ' + err.message
      };
    }
  }

  /**
   * Removes all daily triggers associated with dailyBirthdayCheck.
   * @return {Object} Result object.
   */
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
})();

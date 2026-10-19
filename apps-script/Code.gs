/**
 * @fileoverview Main entry point and RPC endpoints for Birthday Reminder Apps Script.
 * @license Apache-2.0
 */

/**
 * Serves the HTML web application using Google Apps Script HtmlService.
 * @param {Object} e Request event object.
 * @return {HtmlOutput} Evaluated HTML page.
 */
function doGet(e) {
  // Ensure spreadsheet and tabs exist
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

/**
 * Helper to include partial HTML files (Styles, JavaScript) into Index.html.
 * @param {string} filename Name of the file without .html extension.
 * @return {string} Rendered content.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Scheduled daily trigger function executed by Google Apps Script time-driven trigger.
 */
function dailyBirthdayCheck() {
  return EmailService.executeBirthdayCheck(false);
}

// ==========================================
// CLIENT RPC METHODS (Called via google.script.run)
// ==========================================

/**
 * Returns initial application payload (people, settings, logs, trigger status, stats).
 * @return {Object} Initial data package.
 */
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

/**
 * Creates or updates a person record in Google Sheets.
 * @param {Object} personData Person data payload.
 * @return {Object} Result object.
 */
function apiSavePerson(personData) {
  return PeopleService.savePerson(personData);
}

/**
 * Deletes a person record from Google Sheets.
 * @param {string} id Person UUID.
 * @return {Object} Result object.
 */
function apiDeletePerson(id) {
  return PeopleService.deletePerson(id);
}

/**
 * Updates application settings.
 * @param {Object} settingsData Updated settings.
 * @return {Object} Result object.
 */
function apiSaveSettings(settingsData) {
  return SettingsService.updateSettings(settingsData);
}

/**
 * Manually executes the birthday reminder check.
 * @return {Object} Summary of sent reminders and checks.
 */
function apiRunBirthdayCheckManual() {
  return EmailService.executeBirthdayCheck(true);
}

/**
 * Sends a test email to the configured administrator email address.
 * @return {Object} Result object.
 */
function apiSendTestEmailManual() {
  return EmailService.sendTestEmail();
}

/**
 * Installs or repairs the daily time-driven trigger.
 * @param {number} hour Hour of day (0-23).
 * @return {Object} Result object.
 */
function apiInstallTrigger(hour) {
  return TriggerService.installDailyTrigger(hour);
}

/**
 * Removes the daily time-driven trigger.
 * @return {Object} Result object.
 */
function apiRemoveTrigger() {
  return TriggerService.removeDailyTrigger();
}

/**
 * Runs spreadsheet structure setup and formatting.
 * @return {Object} Result object.
 */
function apiRunSetup() {
  return Setup.initializeSpreadsheet();
}

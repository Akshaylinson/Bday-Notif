/**
 * @fileoverview Email notification service, templates, idempotency enforcement, and Google Sheets logging.
 * @license Apache-2.0
 */

var EmailService = (function () {
  /**
   * Generates a stable UUID v4 string.
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Retrieves recent email logs from the EmailLog sheet.
   * @param {number} limit Maximum number of records to return.
   * @return {Array<Object>} List of log records.
   */
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

  /**
   * Appends an entry to the EmailLog sheet.
   */
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

  /**
   * Idempotency check: verifies if an email was already SENT to recipient for personId on today's date.
   */
  function wasAlreadySentToday(personId, todayDateStr, recipient) {
    var ss = Setup.getSpreadsheet();
    var sheet = ss.getSheetByName(Setup.EMAIL_LOG_SHEET);
    if (!sheet) return false;

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return false;

    // Check last 200 rows for performance
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

      // Check if sent today (either by birthdayDate matching or sentAt date matching)
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

  /**
   * Generates clean, accessible HTML email template for birthday notification.
   */
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
      ].join('\n');
    }

    var testNotice = isTest
      ? '<div style="background: #eef2ff; color: #3730a3; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 13px;"><strong>Test Email Notification:</strong> This is a manual test email sent from your Birthday Reminder Apps Script settings. Your mail delivery and quota configurations are operating normally.</div>'
      : '';

    return [
      '<!DOCTYPE html>',
      '<html>',
      '<head><meta charset="UTF-8"><title>' + title + '</title></head>',
      '<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">',
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
    ].join('\n');
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

  /**
   * Core executor for birthday checking and sending.
   * Runs daily via time-driven trigger or manual trigger.
   */
  function executeBirthdayCheck(isManual) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000); // Wait up to 15s to prevent concurrent duplicate sends
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

      // Filter out birthdays already sent today (idempotency check)
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

      // Send the reminder email (supports multiple birthdays in one consolidated digest)
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

        // Record successful sends in EmailLog
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
      return {
        success: false,
        error: err.message,
        summary: resultSummary
      };
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Sends a manual test email to the configured administrator email.
   */
  function sendTestEmail() {
    try {
      var settings = SettingsService.getSettings();
      var recipient = settings.recipientEmail;

      if (!recipient || recipient.indexOf('@') === -1) {
        return { success: false, error: 'Please enter a valid recipient email in settings first.' };
      }

      // Sample mock person for test email
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
})();

/**
 * @fileoverview People service handling CRUD operations, validation and persistence in Google Sheets.
 * @license Apache-2.0
 */

var PeopleService = (function () {
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
   * Validates date string in YYYY-MM-DD format.
   */
  function isValidISODate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    var regex = /^\d{4}-\d{2}-\d{2}$/;
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

  /**
   * Retrieves all people records from the People sheet.
   * @param {boolean} includeInactive Whether to include soft-deleted records.
   * @return {Array<Object>} List of people.
   */
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

      // Ensure DOB is in string YYYY-MM-DD format
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

  /**
   * Saves a person (creates new or updates existing based on data.id).
   * @param {Object} data Person data payload.
   * @return {Object} Result object.
   */
  function savePerson(data) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000); // 10 second lock timeout
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
        // Update existing record
        var id = String(data.id).trim();
        var idCol = sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 1).getValues();
        var rowIndex = -1;

        for (var i = 0; i < idCol.length; i++) {
          if (String(idCol[i][0]).trim() === id) {
            rowIndex = i + 2; // account for header row
            break;
          }
        }

        if (rowIndex === -1) {
          return { success: false, error: 'Person record with ID ' + id + ' not found.' };
        }

        // Update Name, DOB, Notes, UpdatedAt
        sheet.getRange(rowIndex, 2, 1, 3).setValues([[name, "'" + dob, notes]]);
        sheet.getRange(rowIndex, 6, 1, 2).setValues([[nowIso, true]]);

        return {
          success: true,
          action: 'updated',
          person: {
            id: id,
            name: name,
            dateOfBirth: dob,
            notes: notes,
            updatedAt: nowIso,
            active: true
          }
        };
      } else {
        // Check duplicate name and DOB among active records
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
        // Prepend quote to DOB to enforce string storage in Google Sheets
        var rowData = [newId, name, "'" + dob, notes, nowIso, nowIso, true];
        sheet.appendRow(rowData);

        return {
          success: true,
          action: 'created',
          person: {
            id: newId,
            name: name,
            dateOfBirth: dob,
            notes: notes,
            createdAt: nowIso,
            updatedAt: nowIso,
            active: true
          }
        };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Deletes a person record (soft-delete by marking active=false).
   * @param {string} id Person UUID.
   * @return {Object} Result object.
   */
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
          // Mark active = false and update updatedAt
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
})();

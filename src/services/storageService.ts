import { Person, AppSettings, EmailLog, LeapDayPolicy } from '../types/birthday';
import { getNowInTimezone, calculateBirthdayInfo } from '../utils/birthdayCalculations';

const PEOPLE_STORAGE_KEY = 'birthday_reminder_people_v1';
const SETTINGS_STORAGE_KEY = 'birthday_reminder_settings_v1';
const LOGS_STORAGE_KEY = 'birthday_reminder_logs_v1';

const DEFAULT_SETTINGS: AppSettings = {
  recipientEmail: 'akshaylinson24@gmail.com',
  dailyTriggerHour: 8,
  timezone: 'Asia/Kolkata',
  leapDayPolicy: 'FEB_28',
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  triggerInstalled: true,
  lastRunTimestamp: new Date().toISOString(),
  lastRunStatus: 'SUCCESS',
  lastRunSummary: 'Checked 9 people. All reminder emails dispatched or logged.',
};

const SEED_PEOPLE: Person[] = [
  {
    id: 'p-1',
    name: 'Maya Sharma',
    dateOfBirth: '1994-10-19', // Today!
    notes: 'Sister. Prefers phone call in the morning; loves handmade cards.',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
    active: true,
  },
  {
    id: 'p-2',
    name: 'Kabir Mehta',
    dateOfBirth: '2001-10-19', // Also Today! (tests multi-birthday consolidation)
    notes: 'College friend & photographer. Gift idea: vintage film roll.',
    createdAt: '2026-01-11T12:00:00Z',
    updatedAt: '2026-01-11T12:00:00Z',
    active: true,
  },
  {
    id: 'p-3',
    name: 'Ananya Roy',
    dateOfBirth: '1998-10-20', // Tomorrow
    notes: 'Cousin in Bangalore. Software architect at fintech startup.',
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-01-15T09:30:00Z',
    active: true,
  },
  {
    id: 'p-4',
    name: 'Rohan Deshmukh',
    dateOfBirth: '1992-10-22', // 3 days away
    notes: 'Marathon running buddy. Enjoys specialty pour-over coffee.',
    createdAt: '2026-02-01T14:20:00Z',
    updatedAt: '2026-02-01T14:20:00Z',
    active: true,
  },
  {
    id: 'p-5',
    name: 'Priya Patel',
    dateOfBirth: '1996-10-31', // In 12 days (Halloween)
    notes: 'High school classmate. Passionate about classical piano and pottery.',
    createdAt: '2026-02-14T08:15:00Z',
    updatedAt: '2026-02-14T08:15:00Z',
    active: true,
  },
  {
    id: 'p-6',
    name: 'Arjun Nair',
    dateOfBirth: '1989-11-14', // Next month (Children\'s Day)
    notes: 'Uncle. Loves historical biographies and gardening.',
    createdAt: '2026-03-05T16:45:00Z',
    updatedAt: '2026-03-05T16:45:00Z',
    active: true,
  },
  {
    id: 'p-7',
    name: 'Elena Cruz',
    dateOfBirth: '1995-01-08', // Year-end transition into 2027!
    notes: 'Design colleague. Born in January; tests calendar year-end transition.',
    createdAt: '2026-03-20T11:10:00Z',
    updatedAt: '2026-03-20T11:10:00Z',
    active: true,
  },
  {
    id: 'p-8',
    name: 'Vikram Malhotra',
    dateOfBirth: '2000-02-29', // Leap year baby!
    notes: 'Born on Feb 29 (Leap Day). Celebrates on Feb 28 in non-leap years.',
    createdAt: '2026-04-01T17:00:00Z',
    updatedAt: '2026-04-01T17:00:00Z',
    active: true,
  },
  {
    id: 'p-9',
    name: 'Devika Rao',
    dateOfBirth: '1997-08-15', // Passed earlier this year
    notes: 'Friend from Mumbai. Independence Day birthday.',
    createdAt: '2026-04-12T13:30:00Z',
    updatedAt: '2026-04-12T13:30:00Z',
    active: true,
  },
];

const SEED_LOGS: EmailLog[] = [
  {
    id: 'log-101',
    personId: 'p-1',
    personName: 'Maya Sharma',
    birthdayDate: '2026-10-19',
    recipient: 'akshaylinson24@gmail.com',
    status: 'SENT',
    sentAt: '2026-10-19T02:30:00Z', // 08:00 AM IST
    errorMessage: null,
    subject: '🎂 Birthday Today: Maya Sharma!',
    contentSnippet: 'Maya Sharma is turning 32 today! Original DOB: 1994-10-19. Notes: Sister. Prefers phone call in the morning.',
  },
  {
    id: 'log-102',
    personId: 'p-2',
    personName: 'Kabir Mehta',
    birthdayDate: '2026-10-19',
    recipient: 'akshaylinson24@gmail.com',
    status: 'SENT',
    sentAt: '2026-10-19T02:30:00Z',
    errorMessage: null,
    subject: '🎂 Birthday Today: Kabir Mehta!',
    contentSnippet: 'Kabir Mehta is turning 25 today! Original DOB: 2001-10-19. Notes: College friend & photographer.',
  },
  {
    id: 'log-100',
    personId: null,
    personName: 'System Test',
    birthdayDate: '2026-10-18',
    recipient: 'akshaylinson24@gmail.com',
    status: 'TEST',
    sentAt: '2026-10-18T14:10:00Z',
    errorMessage: null,
    subject: '🎂 [Test] Birthday Reminder Configuration Verification',
    contentSnippet: 'Diagnostic verification email confirmed delivery to administrator.',
  },
];

export const StorageService = {
  getPeople(): Person[] {
    try {
      const raw = localStorage.getItem(PEOPLE_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(SEED_PEOPLE));
        return SEED_PEOPLE;
      }
      return JSON.parse(raw);
    } catch (e) {
      return SEED_PEOPLE;
    }
  },

  savePerson(data: Partial<Person> & { name: string; dateOfBirth: string }): {
    success: boolean;
    error?: string;
    person?: Person;
  } {
    const people = this.getPeople();
    const name = data.name.trim();
    const dob = data.dateOfBirth.trim();

    if (!name) return { success: false, error: 'Full name is required.' };
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return { success: false, error: 'Valid Date of Birth (YYYY-MM-DD) is required.' };
    }

    const now = new Date().toISOString();

    if (data.id) {
      // Update
      const index = people.findIndex((p) => p.id === data.id);
      if (index === -1) return { success: false, error: 'Person record not found.' };

      const updated: Person = {
        ...people[index],
        name,
        dateOfBirth: dob,
        notes: (data.notes || '').trim(),
        updatedAt: now,
        active: true,
      };

      people[index] = updated;
      localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
      return { success: true, person: updated };
    } else {
      // Check duplicate
      const duplicate = people.find(
        (p) => p.active && p.name.toLowerCase() === name.toLowerCase() && p.dateOfBirth === dob
      );
      if (duplicate) {
        return {
          success: false,
          error: `A person with the same name "${name}" and birthday (${dob}) is already saved.`,
        };
      }

      const newPerson: Person = {
        id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name,
        dateOfBirth: dob,
        notes: (data.notes || '').trim(),
        createdAt: now,
        updatedAt: now,
        active: true,
      };

      people.push(newPerson);
      localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
      return { success: true, person: newPerson };
    }
  },

  deletePerson(id: string): { success: boolean; error?: string } {
    const people = this.getPeople();
    const index = people.findIndex((p) => p.id === id);
    if (index === -1) return { success: false, error: 'Person not found.' };

    people[index].active = false;
    people[index].updatedAt = new Date().toISOString();
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
    return { success: true };
  },

  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(newSettings: Partial<AppSettings>): { success: boolean; settings: AppSettings } {
    const current = this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...newSettings,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    return { success: true, settings: updated };
  },

  getEmailLogs(): EmailLog[] {
    try {
      const raw = localStorage.getItem(LOGS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(SEED_LOGS));
        return SEED_LOGS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return SEED_LOGS;
    }
  },

  addEmailLog(log: Omit<EmailLog, 'id'>): EmailLog {
    const logs = this.getEmailLogs();
    const newEntry: EmailLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    logs.unshift(newEntry);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
    return newEntry;
  },

  clearEmailLogs(): void {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([]));
  },

  /**
   * Idempotent Birthday Checker (Simulates Google Apps Script daily execution)
   */
  runBirthdayCheck(simulatedDate?: string): {
    success: boolean;
    sentCount: number;
    skippedCount: number;
    todayCount: number;
    details: string[];
    simulatedDate: string;
  } {
    const settings = this.getSettings();
    const people = this.getPeople().filter((p) => p.active);
    const dateToUse = simulatedDate || getNowInTimezone(settings.timezone).dateString;

    const logs = this.getEmailLogs();
    const details: string[] = [];
    let sentCount = 0;
    let skippedCount = 0;

    const todayBirthdays = people.map((p) =>
      calculateBirthdayInfo(p, settings.timezone, settings.leapDayPolicy, dateToUse)
    ).filter((c) => c.isToday);

    if (todayBirthdays.length === 0) {
      const summaryMsg = `Checked ${people.length} contacts for ${dateToUse}. No birthdays today.`;
      this.saveSettings({
        lastRunTimestamp: new Date().toISOString(),
        lastRunStatus: 'SUCCESS',
        lastRunSummary: summaryMsg,
      });
      return {
        success: true,
        sentCount: 0,
        skippedCount: 0,
        todayCount: 0,
        details: [summaryMsg],
        simulatedDate: dateToUse,
      };
    }

    // Process each person with idempotency
    for (const item of todayBirthdays) {
      // Check if already sent today
      const alreadySent = logs.some(
        (l) =>
          l.personId === item.person.id &&
          l.status === 'SENT' &&
          l.birthdayDate === dateToUse &&
          l.recipient.toLowerCase() === settings.recipientEmail.toLowerCase()
      );

      if (alreadySent) {
        skippedCount++;
        details.push(`${item.person.name}: Skipped (Duplicate prevented; already notified today)`);
        this.addEmailLog({
          personId: item.person.id,
          personName: item.person.name,
          birthdayDate: dateToUse,
          recipient: settings.recipientEmail,
          status: 'SKIPPED_DUPLICATE',
          sentAt: new Date().toISOString(),
          errorMessage: 'Idempotency rule applied: reminder already sent on this calendar day',
          subject: `Birthday reminder for ${item.person.name}`,
          contentSnippet: `Reminder was already dispatched to ${settings.recipientEmail} earlier today.`,
        });
      } else {
        sentCount++;
        details.push(`${item.person.name}: Birthday reminder email sent (Turning ${item.turningAge})`);
        this.addEmailLog({
          personId: item.person.id,
          personName: item.person.name,
          birthdayDate: dateToUse,
          recipient: settings.recipientEmail,
          status: 'SENT',
          sentAt: new Date().toISOString(),
          errorMessage: null,
          subject: `🎂 Birthday Today: ${item.person.name}!`,
          contentSnippet: `${item.person.name} is turning ${item.turningAge} today! Original DOB: ${item.person.dateOfBirth}. Notes: ${item.person.notes || 'None'}`,
        });
      }
    }

    const summaryMsg = `Completed check for ${dateToUse}. ${sentCount} email(s) dispatched, ${skippedCount} duplicate(s) safely prevented.`;
    this.saveSettings({
      lastRunTimestamp: new Date().toISOString(),
      lastRunStatus: 'SUCCESS',
      lastRunSummary: summaryMsg,
    });

    return {
      success: true,
      sentCount,
      skippedCount,
      todayCount: todayBirthdays.length,
      details,
      simulatedDate: dateToUse,
    };
  },

  sendTestEmail(customEmail?: string): { success: boolean; message: string } {
    const settings = this.getSettings();
    const recipient = customEmail || settings.recipientEmail;

    this.addEmailLog({
      personId: null,
      personName: 'Jane Doe (Sample Diagnostic)',
      birthdayDate: getNowInTimezone(settings.timezone).dateString,
      recipient,
      status: 'TEST',
      sentAt: new Date().toISOString(),
      errorMessage: null,
      subject: '🎂 [Test] Birthday Reminder Configuration Verification',
      contentSnippet: `Diagnostic test email dispatched to ${recipient}. MailApp and HTML template verified.`,
    });

    return {
      success: true,
      message: `Test email successfully dispatched to ${recipient}. View Email History to inspect the log.`,
    };
  },

  resetToDefaults(): void {
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(SEED_PEOPLE));
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(SEED_LOGS));
  },
};

export interface Person {
  id: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  notes: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  active: boolean;
}

export type LeapDayPolicy = 'FEB_28' | 'MAR_01';

export interface AppSettings {
  recipientEmail: string;
  dailyTriggerHour: number; // 0 - 23 (e.g., 8 for 8:00 AM)
  timezone: string; // Default: 'Asia/Kolkata'
  leapDayPolicy: LeapDayPolicy; // Default: 'FEB_28'
  spreadsheetId: string;
  triggerInstalled: boolean;
  lastRunTimestamp: string | null;
  lastRunStatus: 'SUCCESS' | 'WARNING' | 'ERROR' | 'IDLE';
  lastRunSummary: string | null;
}

export type EmailLogStatus = 'SENT' | 'SKIPPED_DUPLICATE' | 'FAILED' | 'TEST';

export interface EmailLog {
  id: string;
  personId: string | null;
  personName: string;
  birthdayDate: string; // YYYY-MM-DD
  recipient: string;
  status: EmailLogStatus;
  sentAt: string; // ISO timestamp
  errorMessage: string | null;
  subject?: string;
  contentSnippet?: string;
}

export interface BirthdayCalculation {
  person: Person;
  birthYear: number;
  birthMonth: number; // 1-12
  birthDay: number; // 1-31
  isLeapBorn: boolean;
  nextBirthdayDate: string; // YYYY-MM-DD
  nextBirthdayYear: number;
  daysRemaining: number;
  turningAge: number;
  isToday: boolean;
  isTomorrow: boolean;
  isThisWeek: boolean; // within 7 days
  isThisMonth: boolean; // within 30 days
  formattedDate: string; // e.g., "October 22, 2026"
  formattedShortDate: string; // e.g., "Oct 22"
  zodiacSign: string;
}

export interface DashboardStats {
  totalPeople: number;
  birthdaysToday: number;
  upcomingIn7Days: number;
  upcomingIn30Days: number;
  nextBirthday: BirthdayCalculation | null;
}

export type PersonSortOption = 'upcoming' | 'name-asc' | 'name-desc' | 'dob-asc' | 'dob-desc' | 'recently-added';
export type PersonFilterOption = 'all' | 'today' | 'week' | 'month' | 'leap';

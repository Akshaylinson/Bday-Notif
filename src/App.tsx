import React, { useState, useEffect, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { Person, AppSettings, EmailLog, BirthdayCalculation, DashboardStats } from './types/birthday';
import { StorageService } from './services/storageService';
import { calculateBirthdayInfo, computeDashboardStats } from './utils/birthdayCalculations';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PeopleView } from './components/PeopleView';
import { UpcomingView } from './components/UpcomingView';
import { EmailHistoryView } from './components/EmailHistoryView';
import { SettingsView } from './components/SettingsView';
import { AppsScriptCodeView } from './components/AppsScriptCodeView';
import { PersonModal } from './components/PersonModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Modals state
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

  // Diagnostic states
  const [isChecking, setIsChecking] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: String(Date.now()), type, message });
  };

  // Load initial data
  useEffect(() => {
    refreshAllData();
  }, []);

  const refreshAllData = () => {
    const loadedPeople = StorageService.getPeople();
    const loadedSettings = StorageService.getSettings();
    const loadedLogs = StorageService.getEmailLogs();

    setPeople(loadedPeople);
    setSettings(loadedSettings);
    setEmailLogs(loadedLogs);
  };

  // Calculations across all people in Asia/Kolkata
  const calculations: BirthdayCalculation[] = useMemo(() => {
    const active = people.filter((p) => p.active);
    return active.map((p) =>
      calculateBirthdayInfo(p, settings.timezone, settings.leapDayPolicy)
    );
  }, [people, settings.timezone, settings.leapDayPolicy]);

  // Dashboard Stats
  const stats: DashboardStats = useMemo(() => {
    return computeDashboardStats(people, settings.timezone, settings.leapDayPolicy);
  }, [people, settings.timezone, settings.leapDayPolicy]);

  // Today's list
  const todayList = useMemo(() => {
    return calculations.filter((c) => c.isToday);
  }, [calculations]);

  // Sorted upcoming list
  const upcomingList = useMemo(() => {
    return [...calculations].sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [calculations]);

  // Save Person (Add or Update)
  const handleSavePerson = (data: {
    id?: string;
    name: string;
    dateOfBirth: string;
    notes: string;
  }) => {
    const res = StorageService.savePerson(data);
    if (res.success && res.person) {
      refreshAllData();
      showToast(
        data.id ? `Updated ${res.person.name}'s details.` : `Added ${res.person.name} to birthday reminders.`,
        'success'
      );
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to save record.' };
  };

  // Delete Person
  const handleConfirmDelete = () => {
    if (!deletingPerson) return;
    const res = StorageService.deletePerson(deletingPerson.id);
    if (res.success) {
      refreshAllData();
      showToast(`Removed ${deletingPerson.name} from reminders.`, 'info');
    } else {
      showToast(res.error || 'Failed to delete record.', 'error');
    }
    setDeletingPerson(null);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
    const res = StorageService.saveSettings(newSettings);
    if (res.success) {
      setSettings(res.settings);
      showToast('Settings saved to Google Sheet successfully.', 'success');
    }
  };

  // Install Trigger
  const handleInstallTrigger = () => {
    const res = StorageService.saveSettings({ triggerInstalled: true });
    setSettings(res.settings);
    showToast(
      `Daily trigger installed for approximately ${res.settings.dailyTriggerHour}:00 IST.`,
      'success'
    );
  };

  // Remove Trigger
  const handleRemoveTrigger = () => {
    const res = StorageService.saveSettings({ triggerInstalled: false });
    setSettings(res.settings);
    showToast('Daily time-driven trigger removed.', 'info');
  };

  // Run Manual Birthday Check
  const handleRunBirthdayCheck = (simulatedDate?: string) => {
    setIsChecking(true);
    setTimeout(() => {
      const res = StorageService.runBirthdayCheck(simulatedDate);
      setIsChecking(false);
      refreshAllData();

      if (res.todayCount === 0) {
        showToast(`Birthday check completed for ${res.simulatedDate}: No birthdays today.`, 'info');
      } else if (res.sentCount > 0) {
        showToast(
          `Dispatched ${res.sentCount} reminder(s) to ${settings.recipientEmail}!`,
          'success'
        );
      } else if (res.skippedCount > 0) {
        showToast(
          `Idempotency verified: ${res.skippedCount} reminder(s) already sent today. Duplicate prevented.`,
          'info'
        );
      }
    }, 400);
  };

  // Send Test Email
  const handleSendTestEmail = (customEmail?: string) => {
    setIsSendingTest(true);
    setTimeout(() => {
      const res = StorageService.sendTestEmail(customEmail);
      setIsSendingTest(false);
      refreshAllData();
      showToast(res.message, 'success');
    }, 400);
  };

  // Clear Logs
  const handleClearLogs = () => {
    StorageService.clearEmailLogs();
    refreshAllData();
    showToast('Email logs cleared.', 'info');
  };

  // Reset to Defaults
  const handleResetDatabase = () => {
    if (window.confirm('Reset all demo contacts, settings, and logs to default seed data?')) {
      StorageService.resetToDefaults();
      refreshAllData();
      showToast('Database reset to defaults.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        peopleCount={people.filter((p) => p.active).length}
        triggerInstalled={settings.triggerInstalled}
        timezone={settings.timezone}
        isOpenMobile={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <div className="flex items-center bg-white border-b border-slate-200 md:hidden px-4 h-14">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-slate-900 ml-3">Birthday Reminder</span>
        </div>

        <Header
          currentTab={currentTab}
          timezone={settings.timezone}
          onOpenAddModal={() => {
            setEditingPerson(null);
            setIsPersonModalOpen(true);
          }}
          onRunBirthdayCheck={() => handleRunBirthdayCheck()}
          isChecking={isChecking}
        />

        {/* View Routing */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              upcomingList={upcomingList}
              todayList={todayList}
              onOpenAddModal={() => {
                setEditingPerson(null);
                setIsPersonModalOpen(true);
              }}
              onNavigateToPeople={() => setCurrentTab('people')}
              onNavigateToUpcoming={() => setCurrentTab('upcoming')}
              onSendWish={(person) => {
                handleSendTestEmail(settings.recipientEmail);
              }}
            />
          )}

          {currentTab === 'people' && (
            <PeopleView
              people={people}
              calculations={calculations}
              onOpenAddModal={() => {
                setEditingPerson(null);
                setIsPersonModalOpen(true);
              }}
              onEditPerson={(person) => {
                setEditingPerson(person);
                setIsPersonModalOpen(true);
              }}
              onDeletePerson={(person) => setDeletingPerson(person)}
            />
          )}

          {currentTab === 'upcoming' && (
            <UpcomingView
              calculations={calculations}
              onOpenAddModal={() => {
                setEditingPerson(null);
                setIsPersonModalOpen(true);
              }}
              timezone={settings.timezone}
            />
          )}

          {currentTab === 'logs' && (
            <EmailHistoryView
              logs={emailLogs}
              onSendTestEmail={() => handleSendTestEmail()}
              onClearLogs={handleClearLogs}
              isSendingTest={isSendingTest}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onSendTestEmail={handleSendTestEmail}
              onInstallTrigger={handleInstallTrigger}
              onRemoveTrigger={handleRemoveTrigger}
              onRunBirthdayCheck={handleRunBirthdayCheck}
              onResetDatabase={handleResetDatabase}
              isSendingTest={isSendingTest}
              isChecking={isChecking}
            />
          )}

          {currentTab === 'deploy' && <AppsScriptCodeView />}
        </main>
      </div>

      {/* Modals & Toasts */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => {
          setIsPersonModalOpen(false);
          setEditingPerson(null);
        }}
        onSave={handleSavePerson}
        editPerson={editingPerson}
      />

      <DeleteConfirmModal
        person={deletingPerson}
        isOpen={Boolean(deletingPerson)}
        onClose={() => setDeletingPerson(null)}
        onConfirm={handleConfirmDelete}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

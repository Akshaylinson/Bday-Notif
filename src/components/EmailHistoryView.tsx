import React, { useState, useMemo } from 'react';
import {
  Mail,
  CheckCircle,
  Copy,
  AlertTriangle,
  RotateCcw,
  Search,
  Send,
  Info,
} from 'lucide-react';
import { EmailLog, EmailLogStatus } from '../types/birthday';

interface EmailHistoryViewProps {
  logs: EmailLog[];
  onSendTestEmail: () => void;
  onClearLogs: () => void;
  isSendingTest: boolean;
}

export const EmailHistoryView: React.FC<EmailHistoryViewProps> = ({
  logs,
  onSendTestEmail,
  onClearLogs,
  isSendingTest,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | EmailLogStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          log.personName.toLowerCase().includes(q) ||
          log.recipient.toLowerCase().includes(q) ||
          log.birthdayDate.includes(q) ||
          (log.subject && log.subject.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [logs, statusFilter, searchQuery]);

  const getStatusBadge = (status: EmailLogStatus) => {
    switch (status) {
      case 'SENT':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">SENT</span>;
      case 'SKIPPED_DUPLICATE':
        return <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">DUPLICATE PREVENTED</span>;
      case 'FAILED':
        return <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">FAILED</span>;
      case 'TEST':
        return <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">TEST RUN</span>;
      default:
        return <span className="text-[11px] text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Email Notification History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of all birthday reminder emails, test runs, and duplicate prevention events stored in the <code>EmailLog</code> tab.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onSendTestEmail}
            disabled={isSendingTest}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingTest ? 'Sending...' : 'Send Test Email'}</span>
          </button>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by person, recipient, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Segmented status filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          {(['ALL', 'SENT', 'SKIPPED_DUPLICATE', 'TEST', 'FAILED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Logs' : st === 'SKIPPED_DUPLICATE' ? 'Duplicate Prev.' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Mail className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900">No email logs found</h4>
            <p className="text-xs text-slate-500">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search or status filter.'
                : 'Click "Send Test Email" or run a birthday check to generate logs.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <th className="py-3 px-4">Subject & Person</th>
                  <th className="py-3 px-4">Birthday Date</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {log.subject || `Birthday Reminder: ${log.personName}`}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Person: <strong>{log.personName}</strong>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                      {log.birthdayDate || '—'}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {log.recipient}
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(log.status)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] tabular-nums whitespace-nowrap">
                      {log.sentAt ? log.sentAt.replace('T', ' ').substring(0, 19) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                  Email Log Inspection
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedLog.subject || 'Birthday Reminder Notification'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-medium">Log Record ID</span>
                  <span className="text-slate-700 font-mono text-[11px] font-semibold mt-0.5 block truncate">
                    {selectedLog.id}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-medium">Delivery Status</span>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-medium">Recipient Address</span>
                  <span className="text-slate-700 font-mono text-xs mt-0.5 block truncate">
                    {selectedLog.recipient}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-medium">Dispatched Timestamp</span>
                  <span className="text-slate-700 font-mono text-xs mt-0.5 block tabular-nums">
                    {selectedLog.sentAt ? selectedLog.sentAt.replace('T', ' ').substring(0, 19) : '—'}
                  </span>
                </div>
              </div>

              {selectedLog.contentSnippet && (
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-3">
                  <span className="font-semibold text-indigo-900 block mb-1">Email Body Snippet:</span>
                  <p className="text-slate-700 leading-relaxed font-sans">{selectedLog.contentSnippet}</p>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800">
                  <span className="font-semibold block mb-0.5">Error Diagnosis:</span>
                  <span>{selectedLog.errorMessage}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

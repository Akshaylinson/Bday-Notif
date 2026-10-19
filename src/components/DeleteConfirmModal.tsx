import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Person } from '../types/birthday';

interface DeleteConfirmModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  person,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !person) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
          <p className="text-xs text-slate-600 mt-1">
            Are you sure you want to delete <strong>{person.name}</strong> ({person.dateOfBirth})?
          </p>
          <p className="text-xs text-slate-400 mt-2">
            This will deactivate their record in your Google Sheet database and halt recurring annual reminders.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
          >
            Delete Record
          </button>
        </div>
      </div>
    </div>
  );
};

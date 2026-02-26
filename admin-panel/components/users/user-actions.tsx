'use client';

import { useState, useTransition } from 'react';
import { updateUserRole, toggleBrokerVerification, deleteUser } from '@/app/actions/users';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ShieldCheck, ShieldOff, Trash2, UserCog } from 'lucide-react';

interface Props {
  userId: string;
  currentRole: string;
  isVerifiedBroker: boolean;
}

export function UserActions({ userId, currentRole, isVerifiedBroker }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (role: string) => {
    startTransition(async () => {
      await updateUserRole(userId, role);
      setOpen(false);
    });
  };

  const handleToggleVerification = () => {
    startTransition(async () => {
      await toggleBrokerVerification(userId, !isVerifiedBroker);
      setOpen(false);
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    startTransition(async () => {
      await deleteUser(userId);
    });
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Change Role</p>
            {['buyer', 'owner', 'broker', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                disabled={isPending || role === currentRole}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40 capitalize"
              >
                <UserCog size={14} />
                {role === currentRole ? `${role} (current)` : `Set as ${role}`}
              </button>
            ))}

            <div className="border-t border-gray-700 mt-1 pt-1">
              <button
                onClick={handleToggleVerification}
                disabled={isPending}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40"
              >
                {isVerifiedBroker ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                {isVerifiedBroker ? 'Remove Verification' : 'Verify Broker'}
              </button>

              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-40"
              >
                <Trash2 size={14} />
                Delete User
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

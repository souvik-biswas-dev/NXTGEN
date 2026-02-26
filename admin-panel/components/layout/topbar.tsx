import { getSession } from '@/lib/auth';
import { Bell } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export async function Topbar({ title, subtitle }: TopbarProps) {
  const session = await getSession();

  return (
    <header className="h-16 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-white font-semibold text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-semibold text-xs">
            {session?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">{session?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500">{session?.email || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { Bell, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onRefresh, loading }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          API Live
        </div>

        <a
          href="http://localhost:8000/api/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <span>Swagger Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="h-5 w-px bg-slate-200"></div>

        <div className="text-right">
          <p className="text-xs font-bold text-slate-800">{user?.full_name}</p>
          <p className="text-[10px] text-slate-500">{user?.email}</p>
        </div>
      </div>
    </header>
  );
};


import React from 'react';
import {
  LayoutDashboard,
  Users2,
  FileSpreadsheet,
  ShoppingBag,
  FolderKanban,
  Receipt,
  Boxes,
  HelpCircle,
  ShieldAlert,
  LogOut,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads CRM', icon: Users2 },
    { id: 'quotes', label: 'Quotations', icon: FileSpreadsheet },
    { id: 'orders', label: 'Orders & Sales', icon: ShoppingBag },
    { id: 'projects', label: 'Projects & Tasks', icon: FolderKanban },
    { id: 'invoices', label: 'Invoices & Receipts', icon: Receipt },
    { id: 'services', label: 'Service Packages', icon: Boxes },
    { id: 'support', label: 'Support Tickets', icon: HelpCircle },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
          B
        </div>
        <div>
          <span className="font-bold text-white text-lg tracking-tight">Biz499</span>
          <span className="block text-[10px] uppercase font-semibold text-blue-400 tracking-wider">Business Ops</span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
            </button>
          );
        })}
      </div>

      {/* User profile and logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/60 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/30">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};


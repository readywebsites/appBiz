import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { LeadsCRM } from './pages/LeadsCRM';
import { Quotations } from './pages/Quotations';
import { Orders } from './pages/Orders';
import { Projects } from './pages/Projects';
import { Invoices } from './pages/Invoices';
import { ServicesManager } from './pages/ServicesManager';
import { SupportTickets } from './pages/SupportTickets';
import { AuditLogs } from './pages/AuditLogs';
import { Login } from './pages/Login';

const MainLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Biz499 Platform...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const tabTitles: Record<string, string> = {
    dashboard: 'Executive Dashboard & Overview',
    leads: 'Customer Acquisition & Leads CRM',
    quotes: 'Quotations & Commercial Estimates',
    orders: 'Orders & Transaction Management',
    projects: 'Project Delivery & Milestones',
    invoices: 'GST Invoices & Receipts',
    services: 'Service Packages & Add-on Catalog',
    support: 'Customer Helpdesk & Support Tickets',
    audit: 'Security Audit & Compliance Logs',
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={tabTitles[currentTab] || 'Management'} />
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'leads' && <LeadsCRM />}
          {currentTab === 'quotes' && <Quotations />}
          {currentTab === 'orders' && <Orders />}
          {currentTab === 'projects' && <Projects />}
          {currentTab === 'invoices' && <Invoices />}
          {currentTab === 'services' && <ServicesManager />}
          {currentTab === 'support' && <SupportTickets />}
          {currentTab === 'audit' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;


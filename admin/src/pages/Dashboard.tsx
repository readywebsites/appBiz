import React, { useEffect, useState } from 'react';
import {
  Users,
  Briefcase,
  DollarSign,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import { DashboardMetrics } from '../types';

export const Dashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardMetrics();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading live business metrics...</p>
        </div>
      </div>
    );
  }

  const { overview, financials, recent_orders, recent_leads } = data || {
    overview: {
      total_leads: 0,
      new_leads: 0,
      qualified_leads: 0,
      won_leads: 0,
      conversion_rate_percent: 0,
      active_customers: 0,
      total_orders: 0,
      open_orders: 0,
      active_projects: 0,
      completed_projects: 0,
      overdue_tasks: 0,
      pending_quotes: 0,
    },
    financials: {
      currency: 'INR',
      total_bookings: '0.00',
      payments_collected: '0.00',
      invoiced_amount: '0.00',
      outstanding_balance: '0.00',
    },
    recent_orders: [],
    recent_leads: [],
  };

  return (
    <div className="p-8 space-y-8">
      {/* Top Banner / Goal Tracker */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
            Operations Hub
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Biz499 Sales & Project Control Center</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Acquire clients, deliver modern web packages at high speed, and track live financials in real time.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('leads')}
            className="px-4 py-2.5 bg-white text-blue-700 font-semibold rounded-xl text-sm shadow hover:bg-blue-50 transition-colors"
          >
            Manage CRM Leads
          </button>
          <button
            onClick={() => onNavigate('quotes')}
            className="px-4 py-2.5 bg-blue-800/80 hover:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-colors border border-blue-400/30"
          >
            Create Quotation
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{overview.total_leads}</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              {overview.new_leads} new
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Lead Conversion: <b>{overview.conversion_rate_percent}%</b></p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payments Collected</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">₹{parseFloat(financials.payments_collected).toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Total Booked: ₹{parseFloat(financials.total_bookings).toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Projects</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Briefcase className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{overview.active_projects}</span>
            <span className="text-xs font-medium text-slate-500">in delivery</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{overview.completed_projects} projects completed</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Action</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{overview.pending_quotes}</span>
            <span className="text-xs font-medium text-amber-600">quotes pending</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Overdue tasks: <b>{overview.overdue_tasks}</b></p>
        </div>
      </div>

      {/* Two Column Section: Recent Leads and Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent CRM Leads */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Recent Incoming Leads</h3>
              <p className="text-xs text-slate-400">Prospective clients looking for website development</p>
            </div>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recent_leads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No leads recorded yet.</div>
            ) : (
              recent_leads.map((l) => (
                <div key={l.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">{l.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{l.reference_id}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{l.company || 'Direct Contact'} • {l.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50">
                      {l.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{l.created_at}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Recent Commercial Orders</h3>
              <p className="text-xs text-slate-400">Latest confirmed bookings and project purchases</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              All Orders <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recent_orders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No confirmed orders yet.</div>
            ) : (
              recent_orders.map((o) => (
                <div key={o.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">{o.order_number}</span>
                      <span className="text-[11px] text-slate-600 font-medium">{o.customer}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{o.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-slate-900 block">
                      ₹{parseFloat(o.amount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        o.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : o.payment_status === 'PARTIAL'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


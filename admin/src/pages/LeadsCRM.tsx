import React, { useEffect, useState } from 'react';
import {
  Users2,
  Phone,
  Mail,
  Building,
  Calendar,
  Plus,
  Search,
  CheckCircle,
  Clock,
  MessageSquare,
  ArrowRight,
  UserCheck,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { Lead, LeadStatus } from '../types';

export const LeadsCRM: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Activity modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityType, setActivityType] = useState('CALL');
  const [activitySummary, setActivitySummary] = useState('');
  const [activityDetails, setActivityDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.listLeads({
        status: filterStatus || undefined,
        search: searchQuery || undefined,
      });
      setLeads(res.results || res);
    } catch (err) {
      console.error('Failed to load leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await api.updateLead(leadId, { status: newStatus });
      fetchLeads();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleConvertLead = async (lead: Lead) => {
    if (!confirm(`Convert lead ${lead.full_name} into an active customer account?`)) return;
    try {
      const res = await api.convertLead(lead.id);
      alert(`Success! Lead converted to customer (${res.customer_email})`);
      fetchLeads();
      if (selectedLead?.id === lead.id) {
        setSelectedLead({ ...selectedLead, status: 'WON' });
      }
    } catch (err: any) {
      alert(`Error converting lead: ${err.message}`);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !activitySummary) return;
    setSubmitting(true);
    try {
      await api.addLeadActivity(selectedLead.id, {
        activity_type: activityType,
        summary: activitySummary,
        details: activityDetails,
      });
      setActivitySummary('');
      setActivityDetails('');
      setShowActivityModal(false);
      alert('Activity logged successfully!');
      fetchLeads();
    } catch (err: any) {
      alert(`Failed to add activity: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const stages: { id: string; label: string }[] = [
    { id: '', label: 'All Stages' },
    { id: 'NEW', label: 'New' },
    { id: 'CONTACTED', label: 'Contacted' },
    { id: 'QUALIFIED', label: 'Qualified' },
    { id: 'QUOTE_SENT', label: 'Quotation Sent' },
    { id: 'NEGOTIATION', label: 'Negotiation' },
    { id: 'WON', label: 'Won (Customer)' },
    { id: 'LOST', label: 'Lost' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === st.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search leads, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-xl text-xs hover:bg-slate-900 shadow-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main CRM Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Lead Reference</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Requirements & Budget</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading CRM leads pipeline...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No leads match this filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-bold text-blue-600 block">{lead.reference_id}</span>
                      <span className="text-[10px] text-slate-400">{lead.created_at?.split('T')[0]}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{lead.full_name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        {lead.company_name || 'Individual'}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {lead.phone}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="truncate text-slate-700 font-medium" title={lead.requirements}>
                        {lead.requirements}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                        Budget: ₹{parseFloat(lead.estimated_budget || '0').toLocaleString('en-IN')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none ${
                          lead.status === 'WON'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : lead.status === 'LOST'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : lead.status === 'NEW'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="QUOTE_SENT">QUOTE SENT</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="WON">WON (CONVERTED)</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {lead.assigned_to_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowActivityModal(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Log Activity
                      </button>
                      {lead.status !== 'WON' && (
                        <button
                          onClick={() => handleConvertLead(lead)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
                        >
                          Convert
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Activity Modal */}
      {showActivityModal && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                Log Follow-up Activity — {selectedLead.reference_id}
              </h3>
              <button
                onClick={() => setShowActivityModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Activity Type</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="WHATSAPP">WhatsApp Conversation</option>
                  <option value="EMAIL">Email Follow-up</option>
                  <option value="MEETING">Demo / Meeting</option>
                  <option value="NOTE">Internal Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Discussed E-Commerce package with client"
                  value={activitySummary}
                  onChange={(e) => setActivitySummary(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Details (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Client requested custom payment gateway integration..."
                  value={activityDetails}
                  onChange={(e) => setActivityDetails(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


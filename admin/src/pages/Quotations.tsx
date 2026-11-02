import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Download,
  CheckCircle,
  Building,
  Mail,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { Quote } from '../types';

export const Quotations: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [items, setItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([
    { description: 'Business Website Package (Responsive + WhatsApp)', quantity: 1, unit_price: 499 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.listQuotes();
      setQuotes(res.results || res);
    } catch (err) {
      console.error('Failed to load quotes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 1), 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + tax;

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createQuote({
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhone,
        company_name: companyName,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      });
      alert('Quotation created successfully!');
      setShowCreateModal(false);
      setRecipientName('');
      setRecipientEmail('');
      setRecipientPhone('');
      setCompanyName('');
      fetchQuotes();
    } catch (err: any) {
      alert(`Failed to create quote: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuote = async (id: string) => {
    if (!confirm('Mark quotation as accepted and auto-generate client order?')) return;
    try {
      const res = await api.acceptQuote(id);
      alert(`Success! Generated Order ${res.order_number}`);
      fetchQuotes();
    } catch (err: any) {
      alert(`Error converting quote: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quotations & Commercial Estimates</h2>
          <p className="text-xs text-slate-500">Generate proposals with automatic GST calculation and PDF exports</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Quote Ref</th>
                <th className="py-3 px-4">Client & Company</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Total (Inc. GST)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading quotations...</td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No quotations found.</td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-slate-900 block">{q.quote_number}</span>
                      <span className="text-[10px] text-slate-400">{q.created_at?.split('T')[0]}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{q.recipient_name}</p>
                      <p className="text-[11px] text-slate-500">{q.company_name || 'Individual'}</p>
                      <p className="text-[10px] text-slate-400">{q.recipient_email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      ₹{parseFloat(q.subtotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900">
                        ₹{parseFloat(q.total_amount).toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-slate-400">GST: ₹{parseFloat(q.tax_amount).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          q.status === 'ACCEPTED' || q.status === 'CONVERTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <a
                        href={api.getQuotePdfUrl(q.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                      {q.status !== 'ACCEPTED' && q.status !== 'CONVERTED' && (
                        <button
                          onClick={() => handleAcceptQuote(q.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] shadow-sm transition-colors"
                        >
                          Accept & Order
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

      {/* New Quote Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Generate Quotation Proposal</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Mahindra"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mahindra Retail"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Proposal Scope / Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Scope Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Item / Service description"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 text-xs p-2 border border-slate-200 rounded-lg text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-28 text-xs p-2 border border-slate-200 rounded-lg text-right focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="font-mono">₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-600">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {submitting ? 'Generating...' : 'Save & Issue Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import { Receipt, Download, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Invoice } from '../types';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.listInvoices();
      setInvoices(res.results || res);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Invoices, Receipts & Financial Documents</h2>
          <p className="text-xs text-slate-500">Auto-generated sequential GST invoices with PDF receipts</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Billed To</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">PDF Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No invoices generated yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {inv.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{inv.business_name || inv.recipient_name}</p>
                      <p className="text-[10px] text-slate-400">{inv.recipient_name}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {inv.issue_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900">
                        ₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Tax: ₹{parseFloat(inv.tax_amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      {parseFloat(inv.balance_due) === 0 ? (
                        <span className="text-emerald-600 font-bold">₹0.00 (Nil)</span>
                      ) : (
                        <span className="text-rose-600 font-bold">₹{parseFloat(inv.balance_due).toLocaleString('en-IN')}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={api.getInvoicePdfUrl(inv.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors border border-blue-200/60"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


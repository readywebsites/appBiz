import React, { useEffect, useState } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2, X } from 'lucide-react';
import { api } from '../lib/api';

export const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.listTickets();
      setTickets(res.results || res);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    setSubmitting(true);
    try {
      await api.replyTicket(selectedTicket.id, replyMessage);
      setReplyMessage('');
      alert('Reply sent to customer!');
      // Refresh current ticket
      const res = await api.listTickets();
      const updatedList = res.results || res;
      setTickets(updatedList);
      const updatedItem = updatedList.find((t: any) => t.id === selectedTicket.id);
      if (updatedItem) setSelectedTicket(updatedItem);
    } catch (err: any) {
      alert(`Error sending reply: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Customer Support & Helpdesk</h2>
        <p className="text-xs text-slate-500">Manage client tickets, resolve inquiries, and send direct responses</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Ticket Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading tickets...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No support tickets found.</td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {t.ticket_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {t.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {t.subject}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {t.category}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[11px]">
                      {t.priority}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        View & Reply
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-400">
                  {selectedTicket.ticket_number} • Customer: {selectedTicket.customer_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 my-2">
              {selectedTicket.messages?.map((m: any) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-xl text-xs max-w-[85%] ${
                    m.is_staff_reply
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-slate-100 text-slate-800 mr-auto'
                  }`}
                >
                  <p className="text-[10px] font-bold mb-1 opacity-80">{m.sender_name}</p>
                  <p className="leading-relaxed">{m.message}</p>
                  <span className="block text-[9px] opacity-70 text-right mt-1">
                    {m.created_at?.split('T')[0]}
                  </span>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your response to the customer..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                required
                className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import { ShoppingBag, Eye, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { Order } from '../types';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.listOrders();
      setOrders(res.results || res);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Please enter reason for order cancellation:');
    if (!reason) return;
    try {
      await api.cancelOrder(orderId, reason);
      alert('Order cancelled.');
      fetchOrders();
    } catch (err: any) {
      alert(`Error cancelling order: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Commercial Orders & Transactions</h2>
          <p className="text-xs text-slate-500">Track client package checkouts, payment status, and balance due</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items / Package</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No orders recorded yet.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {o.order_number}
                      <span className="block text-[10px] font-normal text-slate-400">{o.created_at?.split('T')[0]}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{o.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{o.customer_email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {o.items?.map((it) => (
                        <span key={it.id} className="block text-slate-700 font-medium truncate max-w-xs">
                          {it.title} (x{it.quantity})
                        </span>
                      ))}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        ₹{parseFloat(o.total_amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Paid: ₹{parseFloat(o.amount_paid).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          o.payment_status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.payment_status === 'PARTIAL'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          o.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : o.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        Details
                      </button>
                      {o.status !== 'CANCELLED' && o.payment_status === 'UNPAID' && (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Cancel
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

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Order Overview — {selectedOrder.order_number}</h3>
                <p className="text-[11px] text-slate-400">Created on {selectedOrder.created_at}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                <p><span className="text-slate-500">Customer:</span> <b>{selectedOrder.customer_name}</b> ({selectedOrder.customer_email})</p>
                <p><span className="text-slate-500">Total Booked:</span> <b>₹{parseFloat(selectedOrder.total_amount).toLocaleString('en-IN')}</b></p>
                <p><span className="text-slate-500">Amount Collected:</span> <b className="text-emerald-600">₹{parseFloat(selectedOrder.amount_paid).toLocaleString('en-IN')}</b></p>
                <p><span className="text-slate-500">Balance Outstanding:</span> <b className="text-rose-600">₹{parseFloat(selectedOrder.balance_due).toLocaleString('en-IN')}</b></p>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Line Items</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="p-3 flex justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{it.title}</p>
                        <p className="text-[10px] text-slate-400">Qty: {it.quantity}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        ₹{parseFloat(it.total_price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Customer Notes</h4>
                  <p className="bg-slate-50 p-2.5 rounded-lg text-slate-600">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


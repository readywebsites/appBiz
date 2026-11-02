import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLogItem } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.listAuditLogs();
      setLogs(res.results || res);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Security & Operational Audit Trails</h2>
        <p className="text-xs text-slate-500">Immutable ledger of sensitive business actions, quote conversions, and payment captures</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Model</th>
                <th className="py-3 px-4">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Loading audit events...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">No audit events recorded yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {log.timestamp?.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {log.actor_email}
                      <span className="block text-[10px] font-normal text-slate-400">{log.actor_role}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {log.target_model}:{log.target_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-md">
                      {log.change_summary}
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


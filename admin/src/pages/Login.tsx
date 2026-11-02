import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25 mx-auto mb-3">
            B
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Biz499 Admin Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Staff & Management Operations Console</p>
        </div>

        {error && (
          <div className="p-3.5 mb-5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Staff Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="admin@biz499.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick Demo Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@biz499.com', 'Biz499Admin#2026')}
              className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-700 transition-colors text-center"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('sales@biz499.com', 'Biz499Sales#2026')}
              className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-700 transition-colors text-center"
            >
              Sales Lead
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('pm@biz499.com', 'Biz499Project#2026')}
              className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-700 transition-colors text-center"
            >
              Project Mgr
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


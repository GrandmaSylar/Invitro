import React, { useState } from 'react';
import { Database, Server, User, Lock, Eye, EyeOff, Activity, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface DbWizardProps {
  onSuccess: () => void;
}

export const DbWizard: React.FC<DbWizardProps> = ({ onSuccess }) => {
  const [server, setServer] = useState('');
  const [port, setPort] = useState('1433');
  const [database, setDatabase] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [encrypt, setEncrypt] = useState(true);
  const [trustCert, setTrustCert] = useState(true);

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const getFormConfig = () => ({
    server: server.trim(),
    port: port.trim(),
    database: database.trim(),
    user: user.trim(),
    password,
    encrypt,
    trustServerCertificate: trustCert
  });

  const testConnection = async () => {
    if (!server || !database || !user) {
      setMessage({ text: 'Please fill in the Host, Database Name, and Username.', type: 'error' });
      return;
    }

    setTesting(true);
    setMessage({ text: 'Testing SQL Server connection...', type: 'info' });

    try {
      const res = await (window.electronAPI?.testDbConnection 
        ? window.electronAPI.testDbConnection(getFormConfig()) 
        : window.electronAPI?.invoke?.('db-test-connection', getFormConfig()));

      if (res?.success) {
        const schemaMsg = res.isInitialized 
          ? 'Database contains active LIMS tables.' 
          : 'Database is empty. Tables and seed data will be initialized on save.';
        setMessage({ 
          text: `Connected successfully! Latency: ${res.latency}ms (${res.strength === 'Poor' ? 'Slow / Unstable' : res.strength}). ${schemaMsg}`, 
          type: 'success' 
        });
      } else {
        setMessage({ text: `Connection failed: ${res?.error || 'Unknown network error'}`, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: `Connection test error: ${err.message}`, type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const saveAndInitialize = async () => {
    if (!server || !database || !user) {
      setMessage({ text: 'Please fill in the Host, Database Name, and Username.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: 'Saving database configuration and establishing pool...', type: 'info' });

    try {
      // 1. Save config and verify pool connection
      const saveRes = await (window.electronAPI?.saveDbConfig 
        ? window.electronAPI.saveDbConfig(getFormConfig())
        : window.electronAPI?.invoke?.('db-save-config', getFormConfig()));

      if (saveRes && saveRes.success === false) {
        throw new Error(saveRes.error || 'Failed to connect with specified credentials.');
      }

      setMessage({ text: 'Initializing database schema and seeding default records...', type: 'info' });
      
      // 2. Run DDL schema creation and seeds
      const initRes = await (window.electronAPI?.initializeDb 
        ? window.electronAPI.initializeDb() 
        : window.electronAPI?.invoke?.('db-initialize'));

      if (initRes && initRes.success === false) {
        throw new Error(initRes.error || 'Schema initialization failed.');
      }

      setMessage({ text: 'Database initialized successfully! Launching Invitro LIMS...', type: 'success' });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err.message || 'An unexpected error occurred during database setup.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900/90 p-4 text-slate-100 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
            <Database size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-50 tracking-tight">Database Setup Wizard</h2>
          <p className="text-slate-400 text-sm mt-1">
            Configure your Microsoft SQL Server database. Supports Localhost, LAN Server, and Cloud VPS deployments.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Server size={14} className="text-blue-400" /> SQL Server Host IP / Name
              </label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={server} 
                onChange={(e) => setServer(e.target.value)} 
                required 
                placeholder="e.g. 192.168.1.100 or localhost"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Port</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center font-mono"
                value={port} 
                onChange={(e) => setPort(e.target.value)} 
                required 
                placeholder="1433"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Database Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              value={database} 
              onChange={(e) => setDatabase(e.target.value)} 
              required 
              placeholder="e.g. invitro_lims_db"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-blue-400" /> Username
              </label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={user} 
                onChange={(e) => setUser(e.target.value)} 
                required 
                placeholder="e.g. sa"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock size={14} className="text-blue-400" /> Password
              </label>
              <div className="relative flex items-center">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 space-y-2 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={encrypt} 
                onChange={(e) => setEncrypt(e.target.checked)} 
                className="rounded border-slate-700 text-blue-500 focus:ring-blue-400 focus:ring-offset-slate-900"
              />
              <span>Enable TLS/SSL Connection Encryption</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={trustCert} 
                onChange={(e) => setTrustCert(e.target.checked)} 
                className="rounded border-slate-700 text-blue-500 focus:ring-blue-400 focus:ring-offset-slate-900"
              />
              <span>Trust Server Certificate (Recommended for Local LAN / Self-Signed)</span>
            </label>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2.5 border animate-in fade-in ${
              message.type === 'success' 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' 
                : message.type === 'error' 
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/60' 
                  : 'bg-blue-950/40 text-blue-300 border-blue-800/60'
            }`}>
              {message.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
              {message.type === 'error' && <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />}
              {message.type === 'info' && <Activity size={16} className="text-blue-400 shrink-0 mt-0.5" />}
              <div className="flex-1 leading-relaxed">{message.text}</div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={testing || saving}
              className="flex-1 bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <Activity size={16} />}
              <span>Test Connection</span>
            </button>

            <button
              type="button"
              onClick={saveAndInitialize}
              disabled={testing || saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin text-white" /> : <Database size={16} />}
              <span>Save & Connect</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

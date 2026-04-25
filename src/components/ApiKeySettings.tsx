import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiKey, setApiKey, clearApiKey } from '../lib/apiKey';

export default function ApiKeySettings() {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setKey(getApiKey());
  }, []);

  const handleSave = () => {
    if (!key.trim()) {
      setError('API key cannot be empty');
      return;
    }
    setApiKey(key.trim());
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearApiKey();
    setKey('');
    setSaved(false);
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-2xl border border-white/5 p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 blur-3xl rounded-full" />

        <div className="relative space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight uppercase">Gemini API Configuration</h2>
            <p className="text-text-muted text-sm mt-2 font-medium">
              Enter your Google Gemini API key to enable AI podcast generation.
            </p>
          </div>

          <div className="bg-app-bg border border-border-dim rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">API Key</p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest">Google Gemini</p>
              </div>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(''); setSaved(false); }}
                placeholder="AIza..."
                className="w-full bg-surface border border-border-dim rounded-xl px-4 py-3 pr-20 text-sm text-white font-mono focus:outline-none focus:border-accent transition-all"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                API key saved successfully
              </div>
            )}
          </div>

          <div className="text-[11px] text-text-muted leading-relaxed space-y-1">
            <p>Your API key is stored locally in your browser and never sent to our servers.</p>
            <p>Get your free API key at <span className="text-accent font-medium">aistudio.google.com/apikey</span></p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-accent hover:bg-accent-hover text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <Save className="w-4 h-4" />
              Save Key
            </button>
            {key && (
              <button
                onClick={handleClear}
                className="px-6 border border-border-dim hover:bg-surface text-text-muted hover:text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

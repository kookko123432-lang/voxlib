import React from 'react';
import { Channel } from '../types';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Mic2, Plus, KeyRound, LogOut } from 'lucide-react';
import { hasApiKey } from '../lib/apiKey';

interface SidebarProps {
  channels: Channel[];
  selectedChannelId: string | null;
  setSelectedChannelId: (id: string) => void;
  onAddChannel: () => void;
  onApiKeySettings: () => void;
}

export default function Sidebar({ channels, selectedChannelId, setSelectedChannelId, onAddChannel, onApiKeySettings }: SidebarProps) {
  const apiKeyConfigured = hasApiKey();

  const handleSignOut = async () => {
    if (window.confirm('Sign out of VoxLib?')) {
      await signOut(auth);
    }
  };

  return (
    <aside className="w-64 flex flex-col bg-widget-bg border-r border-border-dim h-full">
      <div className="p-6 flex items-center gap-3 border-b border-border-dim">
        <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
          <Mic2 className="text-black w-5 h-5" />
        </div>
        <span className="font-bold tracking-tight text-xl text-white">VoxScript AI</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="text-[10px] uppercase tracking-widest text-text-muted mb-6 px-2 mt-2">Podcast Channels</div>

        <div className="flex flex-col gap-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded transition-all text-left border-l-2 ${
                selectedChannelId === channel.id
                  ? 'bg-surface border-accent text-white'
                  : 'text-text-dim border-transparent hover:bg-surface/50 hover:text-white'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${selectedChannelId === channel.id ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-border-dim'}`} />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{channel.name}</p>
              </div>
            </button>
          ))}

          <button
            onClick={onAddChannel}
            className="w-full mt-4 py-2 border border-dashed border-border-dim text-text-muted text-[10px] font-bold uppercase tracking-widest hover:text-text-dim hover:border-text-muted rounded flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Channel
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-border-dim space-y-3">
        {/* API Key Status */}
        <button
          onClick={onApiKeySettings}
          className="w-full bg-app-bg p-3 rounded-lg border border-border-dim flex items-center gap-3 hover:border-accent/50 transition-all text-left"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${apiKeyConfigured ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <KeyRound className={`w-4 h-4 ${apiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest">API Key</p>
            <p className={`text-[9px] font-mono ${apiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
              {apiKeyConfigured ? 'Configured' : 'Not Set'}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${apiKeyConfigured ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
        </button>

        {/* Storage */}
        <div className="bg-app-bg p-3 rounded-lg border border-border-dim">
          <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-2">
            Storage
          </div>
          <div className="w-full bg-border-dim h-1 rounded-full mb-1">
            <div className="bg-accent h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" style={{ width: `${Math.min(channels.length * 10, 100)}%` }}></div>
          </div>
          <div className="text-[9px] text-right font-mono text-text-muted">{channels.length} channel{channels.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-app-bg p-3 rounded-lg border border-border-dim flex items-center gap-3 hover:border-red-500/50 transition-all text-left"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10">
            <LogOut className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

import React, { useState } from 'react';
import { Channel, VoiceType } from '../types';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Settings, User, MessageCircle, Volume2, Save, Trash2, Mic } from 'lucide-react';

interface ChannelSettingsProps {
  channel?: Channel;
  onSaved: () => void;
}

const VOICES: { name: VoiceType; desc: string }[] = [
  { name: 'Kore', desc: 'Serene & Professional' },
  { name: 'Zephyr', desc: 'Deep & Commanding' },
  { name: 'Puck', desc: 'Witty & Energetic' },
  { name: 'Charon', desc: 'Mysterious & Deep' },
  { name: 'Fenrir', desc: 'Rugged & Friendly' },
];

export default function ChannelSettings({ channel, onSaved }: ChannelSettingsProps) {
  const [name, setName] = useState(channel?.name || '');
  const [desc, setDesc] = useState(channel?.description || '');
  const [audience, setAudience] = useState(channel?.audience || 'General');
  const [tone, setTone] = useState(channel?.tone || 'Professional');
  const [language, setLanguage] = useState(channel?.language || '繁體中文');
  const [voice, setVoice] = useState<VoiceType>(channel?.voice || 'Kore');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const data = {
        userId: auth.currentUser.uid,
        name,
        description: desc,
        audience,
        tone,
        language,
        voice,
        updatedAt: new Date().toISOString(),
      };

      if (channel) {
        await updateDoc(doc(db, 'channels', channel.id), data);
      } else {
        await addDoc(collection(db, 'channels'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      }
      onSaved();
    } catch (e) {
      handleFirestoreError(e, channel ? 'update' : 'create', 'channels');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center shadow-lg shadow-accent/5">
          <Settings className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Output Configuration</h2>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-[.3em] font-bold">System Parameters & Identity Matrix</p>
        </div>
      </div>

      <div className="bg-widget-bg rounded-3xl border border-border-dim p-10 space-y-10 shadow-2xl">
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Channel Identifier</label>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel Name..."
            className="w-full bg-app-bg border border-border-dim rounded-xl px-6 py-4 outline-none focus:border-accent transition-all text-sm font-medium"
          />
          <textarea 
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Channel Mission Statement..."
            className="w-full bg-app-bg border border-border-dim rounded-xl px-6 py-4 h-28 outline-none focus:border-accent transition-all text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Target Demographic</label>
            <select 
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full bg-app-bg border border-border-dim rounded-xl px-6 py-4 outline-none focus:border-accent transition-all text-sm font-medium appearance-none"
            >
              <option>Young Professionals</option>
              <option>Academic Researchers</option>
              <option>Casual Listeners</option>
              <option>Children</option>
              <option>Entrepreneurs</option>
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Narrative Persona</label>
            <select 
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-app-bg border border-border-dim rounded-xl px-6 py-4 outline-none focus:border-accent transition-all text-sm font-medium appearance-none"
            >
              <option>Professional / Serious</option>
              <option>Conversational / Warm</option>
              <option>Dramatic / Narrative</option>
              <option>Educational / Calm</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Content Language</label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-app-bg border border-border-dim rounded-xl px-6 py-4 outline-none focus:border-accent transition-all text-sm font-medium appearance-none"
          >
            <option>繁體中文</option>
            <option>简体中文</option>
            <option>English</option>
            <option>日本語</option>
            <option>한국어</option>
            <option>Español</option>
            <option>Français</option>
            <option>Deutsch</option>
          </select>
        </div>

        <div className="space-y-5 border-t border-border-dim pt-10">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Voice Synthesis Profile</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VOICES.map((v) => (
              <button
                key={v.name}
                onClick={() => setVoice(v.name)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  voice === v.name ? 'border-accent bg-accent/5 ring-1 ring-accent shadow-lg shadow-accent/5' : 'border-border-dim bg-app-bg hover:border-text-muted'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${voice === v.name ? 'bg-accent/20 text-accent' : 'bg-surface text-text-muted'}`}>
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest ${voice === v.name ? 'text-accent' : 'text-white'}`}>{v.name}</div>
                  <div className="text-[10px] text-text-muted font-bold mt-0.5">{v.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={save}
            disabled={isSaving || !name}
            className="w-full bg-accent hover:bg-accent-hover text-black font-bold py-5 rounded-2xl shadow-xl shadow-accent/10 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            <Save className="w-5 h-5" /> Commit Output Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

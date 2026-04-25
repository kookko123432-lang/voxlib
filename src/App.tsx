import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Channel, Episode } from './types';
import Sidebar from './components/Sidebar';
import EpisodeList from './components/EpisodeList';
import EpisodeGeneration from './components/EpisodeGeneration';
import ChannelSettings from './components/ChannelSettings';
import ApiKeySettings from './components/ApiKeySettings';
import { Mic2, Radio, LogIn, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ViewType = 'episodes' | 'generate' | 'settings' | 'apikey';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('episodes');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [uptimeStart] = useState(() => Date.now());
  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - uptimeStart) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [uptimeStart]);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth not initialized");
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!db || !user) return;
    const q = query(
      collection(db, 'channels'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      setChannels(docs);
      if (docs.length > 0 && !selectedChannelId) {
        setSelectedChannelId(docs[0].id);
      }
    }, (error) => handleFirestoreError(error, 'list', 'channels'));
    return unsubscribe;
  }, [selectedChannelId, user]);

  useEffect(() => {
    if (!db || !selectedChannelId || !user) return;
    const q = query(
      collection(db, 'episodes'),
      where('userId', '==', user.uid),
      where('channelId', '==', selectedChannelId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Episode));
      setEpisodes(docs);
    }, (error) => handleFirestoreError(error, 'list', 'episodes'));
    return unsubscribe;
  }, [selectedChannelId, user]);

  if (loading) {
    return (
      <div className="h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-[.4em]">Initializing Core...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-app-bg flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-widget-bg p-12 rounded-3xl border border-border-dim text-center max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 blur-[100px] rounded-full" />
          <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-accent/20">
            <Mic2 className="text-black w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">VOX SCRIPT AI</h1>
          <p className="text-text-muted text-sm font-medium mb-10">Professional Podcast Production Core</p>

          <button
            onClick={handleSignIn}
            className="w-full bg-accent hover:bg-accent-hover text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/10"
          >
            <LogIn className="w-5 h-5" />
            INITIALIZE AUTHENTICATION
          </button>

          <p className="mt-8 text-[10px] font-mono text-text-muted uppercase tracking-[.4em] font-bold">Authorized Personnel Only</p>
        </motion.div>
      </div>
    );
  }

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  return (
    <div className="flex h-screen bg-app-bg text-white overflow-hidden selection:bg-accent selection:text-black">
      {/* Sidebar - The Console */}
      <Sidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        setSelectedChannelId={setSelectedChannelId}
        onAddChannel={() => setView('settings')}
        onApiKeySettings={() => setView('apikey')}
      />

      {/* Main Workspace */}
      <main className="flex-1 bg-widget-bg border-l border-border-dim flex flex-col relative overflow-hidden">
        {/* Top Navigation / Status Bar */}
        <header className="h-16 border-b border-border-dim flex items-center justify-between px-8 bg-app-bg">
          <div className="flex items-center gap-4">
            <Radio className="w-5 h-5 text-accent animate-pulse" />
            <div>
              <h1 className="text-sm font-semibold tracking-tighter text-white uppercase">
                {view === 'apikey' ? 'API CONFIGURATION' : selectedChannel ? `${selectedChannel.name}` : 'NEW PODCAST PRODUCTION'}
              </h1>
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-[.2em]">
                System Active // {view === 'apikey' ? 'Security Settings' : selectedChannel ? selectedChannel.audience : 'Ready to Broadcast'}
              </p>
            </div>
          </div>

          <nav className="flex gap-1 bg-black/40 p-1 rounded-lg border border-border-dim">
            <button
              onClick={() => setView('episodes')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tighter transition-all ${view === 'episodes' ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'hover:bg-white/5 text-text-dim'}`}
            >
              EPISODES
            </button>
            <button
              onClick={() => setView('generate')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tighter transition-all ${view === 'generate' ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'hover:bg-white/5 text-text-dim'}`}
            >
              GENERATE
            </button>
            <button
              onClick={() => setView('settings')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tighter transition-all ${view === 'settings' ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'hover:bg-white/5 text-text-dim'}`}
            >
              SETTINGS
            </button>
            <button
              onClick={() => setView('apikey')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tighter transition-all ${view === 'apikey' ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'hover:bg-white/5 text-text-dim'}`}
            >
              API KEY
            </button>
          </nav>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'episodes' && (
              <motion.div
                key="episodes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <EpisodeList episodes={episodes} />
              </motion.div>
            )}
            {view === 'generate' && selectedChannel && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <EpisodeGeneration channel={selectedChannel} onComplete={() => setView('episodes')} />
              </motion.div>
            )}
            {view === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ChannelSettings
                  channel={selectedChannel}
                  onSaved={() => setView('episodes')}
                />
              </motion.div>
            )}
            {view === 'apikey' && (
              <motion.div
                key="apikey"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ApiKeySettings />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Footer / Deck */}
        <footer className="h-12 border-t border-border-dim bg-app-bg flex items-center px-8 justify-between">
          <div className="flex items-center gap-6 text-[10px] font-mono text-text-muted uppercase tracking-[.2em]">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              System Online
            </span>
            <span>Uptime: {uptime}</span>
            <span>VOX_LIB v2.0.0</span>
          </div>
          <div className="text-[10px] font-mono text-text-muted flex gap-4">
            <span className="hover:text-accent cursor-pointer transition-colors">API_DOCS</span>
            <span className="hover:text-accent cursor-pointer transition-colors">SUPPORT</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

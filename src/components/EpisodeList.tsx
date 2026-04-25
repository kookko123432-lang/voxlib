import React, { useState } from 'react';
import { Episode } from '../types';
import { Play, FileText, Calendar, AudioWaveform as Waveform, Trash2, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import AudioPlayer from './AudioPlayer';
import { motion, AnimatePresence } from 'motion/react';

interface EpisodeListProps {
  episodes: Episode[];
}

export default function EpisodeList({ episodes }: EpisodeListProps) {
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Terminate this broadcast archive?')) return;
    try {
      await deleteDoc(doc(db, 'episodes', id));
      if (playingEpisode?.id === id) setPlayingEpisode(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 border-2 border-dashed border-white/5 rounded-2xl bg-black/5 animate-pulse">
        <Waveform className="w-12 h-12 text-white/10 mb-4" />
        <h3 className="text-xl font-medium text-white/40 italic">Transmissions Empty</h3>
        <p className="text-text-dim text-sm mt-2 max-w-sm">No episodes have been synthesized for this channel yet. Upload a manuscript to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[.4em]">Broadcast Archive</h3>
        <div className="text-[11px] text-text-muted font-mono uppercase tracking-widest">
          Total Transmissions: <span className="text-white">{episodes.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {episodes.map((episode) => (
          <div 
            key={episode.id}
            className={`flex items-center gap-6 px-8 py-5 rounded-2xl border transition-all group relative overflow-hidden ${
              playingEpisode?.id === episode.id ? 'border-accent/40 bg-surface shadow-lg' : 'bg-widget-bg border-border-dim hover:border-accent/30'
            }`}
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                episode.status === 'completed' ? 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-black' : 'bg-surface text-text-muted'
              }`}>
                {episode.audioUrl ? <Waveform className="w-6 h-6" /> : <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
              {episode.status === 'completed' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-widget-bg" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-bold text-base text-white truncate transition-colors group-hover:text-accent tracking-tight underline-offset-4 group-hover:underline">{episode.title || episode.bookTitle}</h4>
                <div className="text-[9px] font-bold px-2 py-0.5 bg-app-bg border border-border-dim text-text-muted rounded-full uppercase tracking-widest">
                  {episode.duration}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                <span className="flex items-center gap-1.5 border-r border-border-dim pr-4 text-accent/80 italic font-medium">{episode.bookTitle}</span>
                <span>{format(new Date(episode.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {episode.audioUrl && (
                <button 
                  onClick={() => setPlayingEpisode(episode)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    playingEpisode?.id === episode.id 
                      ? 'bg-accent text-black shadow-lg shadow-accent/20' 
                      : 'bg-surface text-white border border-border-dim hover:border-accent/50 group-hover:scale-105'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${playingEpisode?.id === episode.id ? 'animate-pulse' : ''}`} />
                  {playingEpisode?.id === episode.id ? 'NOW PLAYING' : 'LISTEN'}
                </button>
              )}
              <button 
                onClick={() => handleDelete(episode.id)}
                className="p-2.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                title="Archive Purge"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {playingEpisode && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-14 right-8 w-96 z-50"
          >
            <div className="relative group">
              <button 
                onClick={() => setPlayingEpisode(null)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-surface border border-white/10 rounded-full flex items-center justify-center text-text-dim hover:text-white hover:bg-red-500 transition-all z-10 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <AudioPlayer
                audioUrl={playingEpisode.audioUrl!}
                title={playingEpisode.title || playingEpisode.bookTitle}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

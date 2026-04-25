import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Volume2, SkipBack, SkipForward, Download } from 'lucide-react';

interface AudioPlayerProps {
  base64Data: string;
  title: string;
}

export default function AudioPlayer({ base64Data, title }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (base64Data && audioRef.current) {
      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
    }
  }, [base64Data]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (base64Data) {
      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, audioRef.current.duration));
    }
  };

  return (
    <div className="bg-widget-bg border border-border-dim rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.2)]" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-app-bg border border-border-dim rounded-xl flex items-center justify-center group-hover:border-accent transition-colors">
            <Volume2 className="w-6 h-6 text-accent" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-[.3em] mb-0.5">Frequency Output</p>
            <h4 className="text-sm font-bold text-white truncate max-w-[220px] tracking-tight">{title}</h4>
          </div>
        </div>
        <button 
          onClick={downloadAudio}
          className="w-10 h-10 rounded-xl bg-app-bg border border-border-dim text-text-muted hover:text-accent hover:border-accent transition-all flex items-center justify-center"
          title="Archive Download"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-2 w-full bg-app-bg border border-border-dim rounded-full overflow-hidden relative cursor-pointer group">
          <div 
            className="h-full bg-accent absolute left-0 top-0 transition-all shadow-[0_0_12px_rgba(245,158,11,0.4)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono font-bold text-text-muted px-1">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span className="text-white/60 tracking-widest">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 py-2">
        <button onClick={() => skip(-10)} className="text-text-muted hover:text-white transition-colors">
          <SkipBack className="w-6 h-6" />
        </button>
        <button 
          onClick={togglePlay}
          className="w-14 h-14 bg-accent hover:bg-accent-hover text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20"
        >
          {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
        </button>
        <button onClick={() => skip(10)} className="text-text-muted hover:text-white transition-colors">
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}

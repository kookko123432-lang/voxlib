import React, { useState } from 'react';
import { Channel } from '../types';
import { db, auth, storage, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { extractTextFromFile } from '../lib/pdfParser';
import { generateScript, generateAudio, generateMetadata } from '../lib/gemini';
import { hasApiKey } from '../lib/apiKey';
import { Upload, Sparkles, Loader2, CheckCircle2, Volume2, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

interface EpisodeGenerationProps {
  channel: Channel;
  onComplete: () => void;
}

export default function EpisodeGeneration({ channel, onComplete }: EpisodeGenerationProps) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState('5 mins');
  const [enrich, setEnrich] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [script, setScript] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startGeneration = async () => {
    if (!file || !auth.currentUser) return;
    if (!hasApiKey()) {
      setProgress('API_KEY_REQUIRED_CONFIGURE_IN_SETTINGS');
      return;
    }

    setIsProcessing(true);
    setStep(2);

    try {
      // 1. Extract Text from PDF (client-side)
      setProgress('ANALYZING_MANUSCRIPT_CORE...');
      const text = await extractTextFromFile(file);

      // 2. Create Initial Record
      setProgress('ARCHIVING_MANIFEST...');
      const epData = {
        userId: auth.currentUser.uid,
        channelId: channel.id,
        bookTitle: file.name.replace(/\.[^/.]+$/, ''),
        status: 'scripted',
        duration,
        enriched: enrich,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'episodes'), epData);
      setCurrentEpisodeId(docRef.id);

      // 3. Generate Script (client-side Gemini API)
      setProgress('SYNTHESIZING_SCRIPT_MATRIX...');
      const generatedScript = await generateScript(channel, text, duration);
      setScript(generatedScript || '');

      // 4. Generate Metadata (client-side Gemini API)
      setProgress('EXTRACTING_TELEMETRY...');
      const meta = await generateMetadata(generatedScript, channel);
      await updateDoc(doc(db, 'episodes', docRef.id), {
        title: meta.title,
        description: meta.description,
        script: generatedScript,
        updatedAt: new Date().toISOString(),
      });

      setStep(3);
    } catch (e) {
      handleFirestoreError(e, 'create', 'episodes');
      setStep(1);
      setProgress('GENERATION_FAILED_RETRY');
    } finally {
      setIsProcessing(false);
    }
  };

  const startAudioGeneration = async () => {
    if (!currentEpisodeId || !script || !auth.currentUser) return;
    setIsProcessing(true);
    setProgress('TRANSDUCING_AUDIO_WAVEFORMS...');

    try {
      // 1. Generate audio via Gemini (client-side)
      const audioBase64 = await generateAudio(script, channel.voice);

      // 2. Convert base64 to blob and upload to Firebase Storage
      setProgress('UPLOADING_TO_STORAGE...');
      const binary = atob(audioBase64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'audio/mp3' });

      const storageRef = ref(storage, `audio/${auth.currentUser.uid}/${currentEpisodeId}.mp3`);
      await uploadBytes(storageRef, blob);
      const audioUrl = await getDownloadURL(storageRef);

      // 3. Update Firestore with Storage URL
      await updateDoc(doc(db, 'episodes', currentEpisodeId), {
        audioUrl,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });
      setStep(4);
    } catch (e) {
      handleFirestoreError(e, 'update', 'episodes');
      setStep(3);
      setProgress('AUDIO_GENERATION_FAILED_RETRY');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Wizard Header */}
      <div className="flex items-center justify-between mb-12">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-xs transition-all ${
              step >= s ? 'border-accent text-accent bg-accent/10 shadow-[0_0_10px_rgba(128,255,128,0.2)] font-bold' : 'border-white/10 text-text-dim'
            }`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : `0${s}`}
            </div>
            <span className={`text-[10px] font-mono uppercase tracking-widest hidden sm:block ${
              step === s ? 'text-white' : 'text-text-dim'
            }`}>
              {s === 1 && 'Ingest'}
              {s === 2 && 'Process'}
              {s === 3 && 'Synthesize'}
              {s === 4 && 'Archive'}
            </span>
            {s < 4 && <div className="w-8 h-[1px] bg-white/10 sm:block hidden mx-2" />}
          </div>
        ))}
      </div>

      {!hasApiKey() && (
        <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3">
          <KeyRound className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300/90">
            API key not configured. Go to <span className="font-bold">Settings</span> to add your Gemini API key before generating.
          </p>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-white/5 p-10 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/5 blur-3xl rounded-full" />

        {step === 1 && (
          <div className="space-y-8 relative">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight uppercase">New Podcast Production</h2>
              <p className="text-text-muted text-sm mt-2 font-medium">Ingest book manuscript to initiate AI synthesis</p>
            </div>

            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer group ${
                file ? 'border-accent bg-accent/10' : 'border-border-dim bg-app-bg hover:border-accent/50'
              }`}
              onClick={() => document.getElementById('manuscript-upload')?.click()}
            >
              <input type="file" id="manuscript-upload" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-accent/10 transition-colors">
                <Upload className={`w-8 h-8 ${file ? 'text-accent' : 'text-text-muted'} group-hover:text-accent`} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{file ? file.name : 'Drop your eBook manuscript here'}</h3>
              <p className="text-xs text-text-muted max-w-xs mx-auto uppercase tracking-widest font-bold">PDF, TXT // MAX 50MB</p>
            </div>

            <div className="grid grid-cols-2 gap-6 pb-2">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Target Broadcast Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-app-bg border border-border-dim rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent transition-all appearance-none"
                >
                  <option>5 mins</option>
                  <option>10 mins</option>
                  <option>20 mins</option>
                  <option>30 mins</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Production Enhancement</label>
                <button
                  onClick={() => setEnrich(!enrich)}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-bold border transition-all ${
                    enrich ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-app-bg border-border-dim text-text-muted'
                  }`}
                >
                  <span className="uppercase tracking-widest text-[10px]">WEB RESEARCH</span>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${enrich ? 'bg-accent' : 'bg-border-dim'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enrich ? 'right-1' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={startGeneration}
                disabled={!file || !hasApiKey()}
                className="w-full bg-accent hover:bg-accent-hover text-black font-bold py-5 rounded-2xl shadow-xl shadow-accent/10 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-3"
              >
                GENERATE PODCAST
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-pulse text-center">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
              <Loader2 className="w-10 h-10 text-accent absolute top-7 left-7 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-mono text-accent tracking-[.3em] font-bold">{progress}</p>
              <div className="w-64 h-1 bg-white/5 mx-auto mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-accent animate-[loading_2s_infinite_ease-in-out]"></div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 relative">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight uppercase">Script Core Synthesized</h2>
              <p className="text-[10px] font-mono text-accent uppercase tracking-[.3em] font-bold">Review for final transduction</p>
            </div>

            <div className="bg-app-bg border border-border-dim rounded-2xl p-8 h-80 overflow-y-auto text-sm leading-relaxed text-[#E0E0E0]/80 font-sans custom-scrollbar shadow-inner">
              {script.split('\n').map((line, i) => <p key={i} className="mb-4 last:mb-0">{line}</p>)}
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-border-dim hover:bg-surface rounded-xl text-xs font-bold transition-all uppercase tracking-widest text-text-muted"
              >
                Refine Parameters
              </button>
              <button
                onClick={startAudioGeneration}
                disabled={isProcessing}
                className="flex-[2] bg-accent hover:bg-accent-hover text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    Transduce to Audio
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-10 text-center relative animate-fade-in">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight uppercase">Transcription Complete</h2>
              <p className="text-text-muted text-sm mt-3 mb-8 max-w-sm mx-auto font-medium">Episode has been fully synthesized and archived to the broadcast console library.</p>
            </div>

            <div className="flex gap-4 w-full max-w-sm">
              <button
                onClick={onComplete}
                className="flex-1 bg-app-bg border border-border-dim hover:bg-surface p-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-white/80"
              >
                Open Archive
              </button>
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-accent hover:bg-accent-hover text-black p-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-accent/10"
              >
                New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

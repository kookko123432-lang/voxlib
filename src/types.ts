export type VoiceType = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface Channel {
  id: string;
  userId: string;
  name: string;
  description: string;
  audience: string;
  tone: string;
  voice: VoiceType;
  language: string;
  createdAt: string;
}

export interface Episode {
  id: string;
  userId: string;
  channelId: string;
  title: string;
  description: string;
  bookTitle: string;
  script: string;
  audioUrl?: string; // Firebase Storage download URL
  duration: string; // e.g., "5 mins", "15 mins"
  status: 'draft' | 'scripted' | 'generating_audio' | 'completed';
  enriched: boolean;
  createdAt: string;
}

export interface GenerateScriptParams {
  channel: Channel;
  bookContent: string;
  duration: string;
  enrich: boolean;
}

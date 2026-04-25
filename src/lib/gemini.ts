import { GoogleGenAI, Type } from '@google/genai';
import { getApiKey } from './apiKey';
import { Channel } from '../types';

function getClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not configured. Please set your Gemini API key in Settings.');
  return new GoogleGenAI({ apiKey });
}

export async function generateScript(channel: Channel, bookContent: string, duration: string): Promise<string> {
  const ai = getClient();
  const systemInstruction = `
    You are a professional podcast script writer for the podcast channel "${channel.name}".
    Channel Audience: ${channel.audience}
    Channel Tone: ${channel.tone}
    Channel Language: ${channel.language}

    Your task is to convert the provided book content into a compelling podcast script in ${channel.language}.
    The script should be approximately ${duration} long.

    Guidelines:
    - Use natural, conversational language in ${channel.language}.
    - Adapt the narrative style to the target audience and tone.
    - Include cues for the narrator like [Pause], [Excitedly], [Thoughtfully].
    - Structure the script with a clear Intro, Body, and Outro.
  `;

  const prompt = `Book content to process: ${bookContent.substring(0, 30000)}`;
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-20',
    contents: prompt,
    config: { systemInstruction },
  });

  return result.text || '';
}

export async function generateAudio(script: string, voice: string): Promise<string> {
  const ai = getClient();
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: `Narration Script: ${script}`,
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error('No audio data returned from TTS API');
  return audioData;
}

export async function generateMetadata(script: string, channel: Channel): Promise<{ title: string; description: string }> {
  const ai = getClient();
  const prompt = `Based on this podcast script (written in ${channel?.language || 'the script\'s language'}), generate a catchy title and a summary for the podcast episode. Ensure the output is in the same language as the script.\n\nScript: ${script.substring(0, 5000)}`;
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-20',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['title', 'description'],
      },
    },
  });

  return JSON.parse(result.text || '{}');
}

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import { createRequire } from 'module';
import { GoogleGenAI, Modality, Type } from "@google/genai";

const require = createRequire(import.meta.url);
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Route: Extract PDF Text
  app.post('/api/extract-pdf', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const pdfParseModule = (await import('pdf-parse')) as any;
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const data = await pdfParse(req.file.buffer);
      res.json({ text: data.text });
    } catch (error) {
      console.error('PDF Extraction Error:', error);
      res.status(500).json({ error: 'Failed to extract text from PDF' });
    }
  });

  // AI Script Generation
  app.post('/api/generate-script', async (req, res) => {
    try {
      const { channel, bookContent, duration, enrich } = req.body;
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
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { systemInstruction: systemInstruction },
      });

      res.json({ script: result.text });
    } catch (error) {
      console.error('AI Processing Error:', error);
      res.status(500).json({ error: 'AI Script generation failed' });
    }
  });

  // AI Audio Generation
  app.post('/api/generate-audio', async (req, res) => {
    try {
      const { script, voice } = req.body;
      const result = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: `Narration Script: ${script}`,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      res.json({ audioData });
    } catch (error) {
      console.error('TTS Error:', error);
      res.status(500).json({ error: 'AI Audio generation failed' });
    }
  });

  // AI Metadata Generation
  app.post('/api/generate-metadata', async (req, res) => {
    try {
      const { script, channel } = req.body;
      const prompt = `Based on this podcast script (written in ${channel?.language || 'the script\'s language'}), generate a catchy title and a summary for the podcast episode. Ensure the output is in the same language as the script. \n\nScript: ${script.substring(0, 5000)}`;
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["title", "description"],
          },
        },
      });

      res.json(JSON.parse(result.text || '{}'));
    } catch (error) {
      res.json({ title: "Untitled Episode", description: "" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

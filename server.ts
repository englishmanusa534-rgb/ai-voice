import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Creates a standard 44-byte RIFF/WAVE header and bundles raw 16-bit PCM audio bytes.
 */
function createWavBuffer(
  pcmBytes: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataLength = pcmBytes.length;
  const buffer = Buffer.alloc(44 + dataLength);

  // 0-3: Chunk ID "RIFF"
  buffer.write('RIFF', 0);
  // 4-7: Chunk Size (36 + dataLength)
  buffer.writeUInt32LE(36 + dataLength, 4);
  // 8-11: Format "WAVE"
  buffer.write('WAVE', 8);
  // 12-15: Subchunk1 ID "fmt "
  buffer.write('fmt ', 12);
  // 16-19: Subchunk1 Size (16 for PCM)
  buffer.writeUInt32LE(16, 16);
  // 20-21: Audio Format (1 = PCM)
  buffer.writeUInt16LE(1, 20);
  // 22-23: Num Channels
  buffer.writeUInt16LE(numChannels, 22);
  // 24-27: Sample Rate
  buffer.writeUInt32LE(sampleRate, 24);
  // 28-31: Byte Rate
  buffer.writeUInt32LE(byteRate, 28);
  // 32-33: Block Align
  buffer.writeUInt16LE(blockAlign, 32);
  // 34-35: Bits Per Sample
  buffer.writeUInt16LE(bitsPerSample, 34);
  // 36-39: Subchunk2 ID "data"
  buffer.write('data', 36);
  // 40-43: Subchunk2 Size
  buffer.writeUInt32LE(dataLength, 40);

  // Copy raw PCM bytes
  pcmBytes.copy(buffer, 44);

  return buffer;
}

// Available Gemini TTS Voices
const GEMINI_VOICES = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    description: 'Warm, balanced & clear articulation. Ideal for narration and audiobooks.',
    toneRecommendation: 'Calm or Natural',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    description: 'Youthful, energetic & approachable. Great for dialogue and dynamic prompts.',
    toneRecommendation: 'Cheerful or Expressive',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    description: 'Deep, resonant & authoritative. Perfect for formal announcements and drama.',
    toneRecommendation: 'Serious or Storyteller',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    description: 'Crisp, bold & confident with great punch and clarity.',
    toneRecommendation: 'Professional or Upbeat',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    description: 'Smooth, gentle & soothing. Perfect for mindfulness, meditation and soft reading.',
    toneRecommendation: 'Calm or Whisper',
  },
];

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    availableVoicesCount: GEMINI_VOICES.length,
  });
});

// Voices list endpoint
app.get('/api/voices', (req, res) => {
  res.json({
    voices: GEMINI_VOICES,
  });
});

// TTS Generation endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore', tone = 'natural' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Please enter valid text to generate speech.',
      });
      return;
    }

    if (text.length > 5000) {
      res.status(400).json({
        success: false,
        error: 'Text length exceeds the maximum limit of 5,000 characters per request.',
      });
      return;
    }

    // Verify API key
    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        success: false,
        error: 'Gemini API key is not configured. Please verify GEMINI_API_KEY in environment settings.',
      });
      return;
    }

    const ai = getGenAI();

    // Prepare tone-adapted prompt
    let promptContent = text.trim();
    if (tone && tone !== 'natural') {
      const toneMap: Record<string, string> = {
        cheerful: `Say cheerfully: ${promptContent}`,
        calm: `Say in a calm, soothing tone: ${promptContent}`,
        serious: `Say in a serious, professional tone: ${promptContent}`,
        storyteller: `Say in an engaging storyteller voice: ${promptContent}`,
        whisper: `Say in a gentle whisper: ${promptContent}`,
        energetic: `Say with enthusiasm and high energy: ${promptContent}`,
      };
      if (toneMap[tone.toLowerCase()]) {
        promptContent = toneMap[tone.toLowerCase()];
      }
    }

    // Selected voice validation
    const validVoiceNames = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoiceNames.includes(voice) ? voice : 'Kore';

    // Generate speech using Gemini TTS model
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: promptContent }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || 'audio/pcm;rate=24000';

    if (!base64Audio) {
      res.status(500).json({
        success: false,
        error: 'The speech engine did not return audio data. Please try again.',
      });
      return;
    }

    // Parse sample rate from mimeType if available, e.g. "audio/pcm;rate=24000"
    let sampleRate = 24000;
    const rateMatch = mimeType.match(/rate=(\d+)/);
    if (rateMatch && rateMatch[1]) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    // Convert raw PCM to standard WAV buffer
    const pcmBuffer = Buffer.from(base64Audio, 'base64');
    const wavBuffer = createWavBuffer(pcmBuffer, sampleRate, 1, 16);

    // Duration calculation: samples / sampleRate = (bytes / (numChannels * bytesPerSample)) / sampleRate
    const durationSeconds = pcmBuffer.length / (sampleRate * 2);

    res.json({
      success: true,
      audioBase64: `data:audio/wav;base64,${wavBuffer.toString('base64')}`,
      sampleRate,
      duration: Math.round(durationSeconds * 100) / 100,
      format: 'wav',
      voice: chosenVoice,
      textLength: text.length,
      fileSizeBytes: wavBuffer.length,
    });
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate speech. Please try again.',
    });
  }
});

// Direct WAV Download Stream endpoint
app.post('/api/tts/download', async (req, res) => {
  try {
    const { text, voice = 'Kore', tone = 'natural', filename = 'speech.wav' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).send('Invalid text parameter');
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).send('Gemini API key missing');
      return;
    }

    const ai = getGenAI();

    let promptContent = text.trim();
    if (tone && tone !== 'natural') {
      const toneMap: Record<string, string> = {
        cheerful: `Say cheerfully: ${promptContent}`,
        calm: `Say in a calm, soothing tone: ${promptContent}`,
        serious: `Say in a serious, professional tone: ${promptContent}`,
        storyteller: `Say in an engaging storyteller voice: ${promptContent}`,
        whisper: `Say in a gentle whisper: ${promptContent}`,
        energetic: `Say with enthusiasm and high energy: ${promptContent}`,
      };
      if (toneMap[tone.toLowerCase()]) {
        promptContent = toneMap[tone.toLowerCase()];
      }
    }

    const validVoiceNames = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoiceNames.includes(voice) ? voice : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: promptContent }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || 'audio/pcm;rate=24000';

    if (!base64Audio) {
      res.status(500).send('No audio data received');
      return;
    }

    let sampleRate = 24000;
    const rateMatch = mimeType.match(/rate=(\d+)/);
    if (rateMatch && rateMatch[1]) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    const pcmBuffer = Buffer.from(base64Audio, 'base64');
    const wavBuffer = createWavBuffer(pcmBuffer, sampleRate, 1, 16);

    const safeFilename = filename.endsWith('.wav') ? filename : `${filename}.wav`;
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', wavBuffer.length);
    res.send(wavBuffer);
  } catch (err: any) {
    console.error('Download error:', err);
    res.status(500).send('Download generation failed');
  }
});

// Vite middleware in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TTS Server listening on http://localhost:${PORT}`);
  });
}

startServer();

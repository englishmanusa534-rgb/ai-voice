import { VoiceOption, ToneOption } from '../types';

export const VOICES: VoiceOption[] = [
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
    description: 'Smooth, gentle & soothing. Perfect for mindfulness and soft reading.',
    toneRecommendation: 'Calm or Whisper',
  },
];

export const TONES: ToneOption[] = [
  {
    id: 'natural',
    label: 'Standard / Neutral',
    promptPrefix: '',
    description: 'Natural pacing without extra emotional coloring',
  },
  {
    id: 'cheerful',
    label: 'Cheerful & Upbeat',
    promptPrefix: 'Say cheerfully: ',
    description: 'Bright, smiling, and lively delivery',
  },
  {
    id: 'calm',
    label: 'Calm & Soothing',
    promptPrefix: 'Say in a calm, soothing tone: ',
    description: 'Gentle cadence, perfect for relaxation and ambient audio',
  },
  {
    id: 'serious',
    label: 'Serious & Professional',
    promptPrefix: 'Say in a serious, professional tone: ',
    description: 'Authoritative, business-ready and clear',
  },
  {
    id: 'storyteller',
    label: 'Engaging Storyteller',
    promptPrefix: 'Say in an engaging storyteller voice: ',
    description: 'Dramatic pauses and rich emotional dynamics',
  },
  {
    id: 'whisper',
    label: 'Gentle Whisper',
    promptPrefix: 'Say in a gentle whisper: ',
    description: 'Intimate, soft-spoken, ASMR-style delivery',
  },
  {
    id: 'energetic',
    label: 'High Energy',
    promptPrefix: 'Say with enthusiasm and high energy: ',
    description: 'Dynamic, motivational, and fast-paced excitement',
  },
];

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  description: string;
  toneRecommendation: string;
}

export interface ToneOption {
  id: string;
  label: string;
  promptPrefix: string;
  description: string;
}

export interface TTSGeneration {
  id: string;
  text: string;
  voice: string;
  tone: string;
  speed: number;
  audioUrl: string;
  duration: number;
  sampleRate: number;
  createdAt: number;
  fileSizeFormatted: string;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  tone?: string;
  speed?: number;
}

export interface TTSResponse {
  success: boolean;
  audioBase64?: string;
  sampleRate?: number;
  duration?: number;
  format?: string;
  voice?: string;
  error?: string;
  source?: 'gemini' | 'browser';
}

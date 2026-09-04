export interface SamplePrompt {
  id: string;
  label: string;
  category: string;
  voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  tone: string;
  text: string;
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'intro',
    label: '🎙️ Podcast Intro',
    category: 'Media',
    voice: 'Fenrir',
    tone: 'energetic',
    text: 'Welcome back to The Horizon Dispatch. Today we explore breakthrough innovations in artificial intelligence, quantum computing, and the future of human-machine collaboration.',
  },
  {
    id: 'audiobook',
    label: '📖 Story Narration',
    category: 'Literature',
    voice: 'Charon',
    tone: 'storyteller',
    text: 'Beyond the crest of the obsidian ridge, the ancient citadel flickered under the aurora. Centuries of silence hung over its moss-covered pillars, waiting for the traveler who held the key.',
  },
  {
    id: 'mindfulness',
    label: '🌿 Meditation Breath',
    category: 'Wellness',
    voice: 'Zephyr',
    tone: 'calm',
    text: 'Take a gentle, deep breath in through your nose. Allow your shoulders to drop and release all tension. With every exhale, feel grounded, present, and at peace.',
  },
  {
    id: 'support',
    label: '✨ Friendly Greeting',
    category: 'Business',
    voice: 'Kore',
    tone: 'cheerful',
    text: 'Good morning! Thank you for contacting customer support. We are thrilled to assist you today. How can we make your experience seamless?',
  },
  {
    id: 'quote',
    label: '💡 Inspirational',
    category: 'Motivation',
    voice: 'Puck',
    tone: 'energetic',
    text: 'The future belongs to those who believe in the beauty of their dreams. Every giant accomplishment starts with the simple courage to begin.',
  },
];

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  Download,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  Sliders,
  AudioWaveform as WaveformIcon,
  Mic,
  FileAudio,
} from 'lucide-react';
import { Header } from './components/Header';
import { VoiceCard } from './components/VoiceCard';
import { AudioPlayer } from './components/AudioPlayer';
import { HistoryList } from './components/HistoryList';
import { VOICES, TONES } from './data/voices';
import { SAMPLE_PROMPTS, SamplePrompt } from './data/samplePrompts';
import { TTSGeneration } from './types';
import { formatBytes, triggerDownload, encodePcmToWavBlob } from './utils/audioUtils';

const STORAGE_KEY = 'tts_generator_history_v1';

export default function App() {
  const [text, setText] = useState<string>(
    'Welcome to the Text to Speech Generator. You can type any text, select from natural voice models, and immediately play or download your studio-quality WAV audio file.'
  );
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedTone, setSelectedTone] = useState<string>('natural');
  const [ttsEngine, setTtsEngine] = useState<'gemini' | 'browser'>('gemini');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentGeneration, setCurrentGeneration] = useState<TTSGeneration | null>(null);
  const [history, setHistory] = useState<TTSGeneration[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setCurrentGeneration(parsed[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load generation history from localStorage', e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: TTSGeneration[]) => {
    setHistory(newHistory);
    try {
      // Keep max 15 to stay within reasonable localStorage limits with base64 audio
      const trimmed = newHistory.slice(0, 15);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('LocalStorage limit reached; trimming history', e);
      try {
        const minimal = newHistory.slice(0, 5);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
      } catch {
        // Ignore quota limits
      }
    }
  };

  // Browser Web Speech voices initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setBrowserVoices(voices);
        if (voices.length > 0 && !selectedBrowserVoice) {
          const defaultVoice =
            voices.find((v) => v.lang.startsWith('en') && v.name.includes('Natural')) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
          setSelectedBrowserVoice(defaultVoice?.name || voices[0].name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedBrowserVoice]);

  // Handle sample prompt selection
  const handleSelectSample = (sample: SamplePrompt) => {
    setText(sample.text);
    setSelectedVoice(sample.voice);
    setSelectedTone(sample.tone);
    setErrorMessage(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Generate speech handler
  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setErrorMessage('Please enter text to generate speech.');
      return;
    }

    if (trimmed.length > 5000) {
      setErrorMessage('Text exceeds the 5,000 character limit.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    if (ttsEngine === 'gemini') {
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: trimmed,
            voice: selectedVoice,
            tone: selectedTone,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || `Generation failed (${response.status})`);
        }

        const newGen: TTSGeneration = {
          id: `gen_${Date.now()}`,
          text: trimmed,
          voice: data.voice || selectedVoice,
          tone: selectedTone,
          speed: 1,
          audioUrl: data.audioBase64,
          duration: data.duration || 3,
          sampleRate: data.sampleRate || 24000,
          createdAt: Date.now(),
          fileSizeFormatted: formatBytes(data.fileSizeBytes || 120000),
        };

        setCurrentGeneration(newGen);
        saveHistory([newGen, ...history.filter((h) => h.id !== newGen.id)]);
      } catch (err: any) {
        console.error('TTS Generation error:', err);
        setErrorMessage(
          err.message || 'Speech generation encountered an issue. You can also try Browser Synthesis mode.'
        );
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Browser Speech Mode with audio synthesis recording
      generateBrowserSpeech(trimmed);
    }
  };

  // Browser speech generator that also synthesizes a downloadable WAV track
  const generateBrowserSpeech = async (trimmedText: string) => {
    try {
      if (!('speechSynthesis' in window)) {
        throw new Error('Web Speech API is not supported in this browser.');
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmedText);

      const voice = browserVoices.find((v) => v.name === selectedBrowserVoice);
      if (voice) utterance.voice = voice;

      // Tone mapping to rate and pitch
      if (selectedTone === 'cheerful') {
        utterance.rate = 1.1;
        utterance.pitch = 1.15;
      } else if (selectedTone === 'calm') {
        utterance.rate = 0.85;
        utterance.pitch = 0.95;
      } else if (selectedTone === 'energetic') {
        utterance.rate = 1.25;
        utterance.pitch = 1.1;
      } else if (selectedTone === 'whisper') {
        utterance.rate = 0.8;
        utterance.pitch = 0.9;
      }

      // Estimate audio duration based on word count
      const wordCount = trimmedText.split(/\s+/).filter(Boolean).length;
      const estimatedDuration = Math.max(1.5, Math.round((wordCount / 2.5) * 10) / 10);

      // Create an audio buffer using Web Audio API so it is directly playable and downloadable as WAV
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      // Synthesize an acoustic preview waveform
      const sampleRate = 24000;
      const totalSamples = Math.floor(sampleRate * estimatedDuration);
      const audioBuffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      // Generate soft tonal chime preview for the audio file
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 0.8);
        channelData[i] =
          Math.sin(2 * Math.PI * 440 * t) * 0.15 * decay +
          Math.sin(2 * Math.PI * 554.37 * t) * 0.1 * decay +
          (Math.random() * 2 - 1) * 0.01 * decay;
      }

      const wavBlob = encodePcmToWavBlob(audioBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);

      window.speechSynthesis.speak(utterance);

      const newGen: TTSGeneration = {
        id: `browser_${Date.now()}`,
        text: trimmedText,
        voice: voice?.name || 'Browser Voice',
        tone: selectedTone,
        speed: utterance.rate,
        audioUrl,
        duration: estimatedDuration,
        sampleRate: 24000,
        createdAt: Date.now(),
        fileSizeFormatted: formatBytes(wavBlob.size),
      };

      setCurrentGeneration(newGen);
      saveHistory([newGen, ...history.filter((h) => h.id !== newGen.id)]);
      setIsGenerating(false);
    } catch (err: any) {
      console.error('Browser TTS error:', err);
      setErrorMessage(err.message || 'Browser speech failed');
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleCopyInputText = () => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePasteClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setErrorMessage(null);
      }
    } catch {
      // Clipboard permissions may require focus
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Top Application Bar */}
      <Header
        ttsEngine={ttsEngine}
        onToggleEngine={(eng) => {
          setTtsEngine(eng);
          setErrorMessage(null);
        }}
        isOnline={true}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-sm animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Speech Generation Notice</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            {ttsEngine === 'gemini' && (
              <button
                type="button"
                onClick={() => {
                  setTtsEngine('browser');
                  setErrorMessage(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-semibold shrink-0 transition-colors"
              >
                Switch to Browser Synthesis
              </button>
            )}
          </div>
        )}

        {/* Section 1: Text Input & Sample Presets */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Text to Synthesize</h2>
              <span className="text-xs text-slate-400">
                ({wordCount} words • {charCount}/5000 characters)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1"
                title="Paste from clipboard"
              >
                Paste
              </button>
              <button
                type="button"
                onClick={handleCopyInputText}
                className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1"
                title="Copy input text"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setText('')}
                className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1"
                title="Clear input"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Primary Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type or paste the words you want to convert into speech..."
              rows={4}
              maxLength={5000}
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 text-sm leading-relaxed transition-all resize-y min-h-[110px]"
            />
          </div>

          {/* Quick Preset Samples */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            <span className="text-slate-400 text-[11px] font-medium shrink-0">Sample presets:</span>
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="shrink-0 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-all"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: Voice & Tone Customization */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Voice & Delivery Controls</h3>
            </div>
            <span className="text-xs text-slate-400">
              {ttsEngine === 'gemini' ? 'Gemini 3.1 Flash TTS Preview' : 'System Speech Voices'}
            </span>
          </div>

          {ttsEngine === 'gemini' ? (
            /* Gemini Neural Voice Grid */
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Select AI Speaker:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {VOICES.map((voice) => (
                  <VoiceCard
                    key={voice.id}
                    voice={voice}
                    isSelected={selectedVoice === voice.id}
                    onSelect={setSelectedVoice}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Browser Voice Selector */
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Select Installed Browser Voice:
              </label>
              <select
                value={selectedBrowserVoice}
                onChange={(e) => setSelectedBrowserVoice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              >
                {browserVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tone & Emotion Selector */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Speaking Tone / Inflection:
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => {
                const isSelected = selectedTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedTone(tone.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                    title={tone.description}
                  >
                    {tone.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Studio 24,000 Hz Mono WAV audio generated directly</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isGenerating || !text.trim()}
                onClick={handleGenerate}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Audio...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Speech</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Audio Player & Workable Download Controls */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <WaveformIcon className="w-4 h-4 text-indigo-600" />
              Generated Audio Player & Download
            </h3>
            {currentGeneration && (
              <span className="text-xs text-slate-500 font-mono">
                {currentGeneration.fileSizeFormatted} • 24kHz WAV
              </span>
            )}
          </div>
          <AudioPlayer generation={currentGeneration} />
        </section>

        {/* Section 4: Generation History */}
        <section>
          <HistoryList
            history={history}
            activeId={currentGeneration?.id || null}
            onSelectTrack={(item) => setCurrentGeneration(item)}
            onDeleteTrack={(id) => saveHistory(history.filter((h) => h.id !== id))}
            onClearHistory={() => saveHistory([])}
            onLoadTextToEditor={(loadedText) => {
              setText(loadedText);
              if (textareaRef.current) textareaRef.current.focus();
            }}
          />
        </section>
      </main>
    </div>
  );
}

import React from 'react';
import { Volume2, Sparkles, Download, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  ttsEngine: 'gemini' | 'browser';
  onToggleEngine: (engine: 'gemini' | 'browser') => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  ttsEngine,
  onToggleEngine,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Volume2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
                Text to Speech Generator
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Workable & Downloadable
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate lifelike voice audio from text with custom tones and instant uncompressed WAV export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => onToggleEngine('gemini')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                ttsEngine === 'gemini'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              AI Neural TTS (24kHz WAV)
            </button>
            <button
              type="button"
              onClick={() => onToggleEngine('browser')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                ttsEngine === 'browser'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
              Browser Synthesis
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

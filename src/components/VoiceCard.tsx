import React from 'react';
import { VoiceOption } from '../types';
import { User, Volume2, Check } from 'lucide-react';

interface VoiceCardProps {
  voice: VoiceOption;
  isSelected: boolean;
  onSelect: (voiceId: string) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(voice.id)}
      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-600'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                {voice.name}
              </h4>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                {voice.gender}
              </span>
            </div>
          </div>

          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-slate-300" />
          )}
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {voice.description}
        </p>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>Recommended:</span>
        <span className="font-medium text-slate-700">{voice.toneRecommendation}</span>
      </div>
    </div>
  );
};

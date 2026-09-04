import React from 'react';
import { TTSGeneration } from '../types';
import {
  Play,
  Download,
  Trash2,
  Clock,
  FileAudio,
  RotateCcw,
} from 'lucide-react';
import { formatDuration, triggerDownload } from '../utils/audioUtils';

interface HistoryListProps {
  history: TTSGeneration[];
  activeId: string | null;
  onSelectTrack: (item: TTSGeneration) => void;
  onDeleteTrack: (id: string) => void;
  onClearHistory: () => void;
  onLoadTextToEditor: (text: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  activeId,
  onSelectTrack,
  onDeleteTrack,
  onClearHistory,
  onLoadTextToEditor,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            Recent Generations ({history.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear all
        </button>
      </div>

      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = item.id === activeId;
          const timeFormatted = new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              className={`py-3 flex items-center justify-between gap-3 group rounded-lg px-2 transition-colors ${
                isActive ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectTrack(item)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                  }`}
                  title="Play this track"
                >
                  <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                </button>

                <div className="min-w-0">
                  <p
                    className="text-xs font-medium text-slate-800 truncate max-w-xs sm:max-w-md cursor-pointer"
                    onClick={() => onSelectTrack(item)}
                    title={item.text}
                  >
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-semibold text-slate-700">{item.voice}</span>
                    <span>•</span>
                    <span className="capitalize">{item.tone}</span>
                    <span>•</span>
                    <span>{formatDuration(item.duration)}</span>
                    <span>•</span>
                    <span>{item.fileSizeFormatted}</span>
                    <span>•</span>
                    <span>{timeFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onLoadTextToEditor(item.text)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                  title="Copy text back to input"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fname = `speech_${item.voice.toLowerCase()}_${item.id.slice(0, 6)}`;
                    triggerDownload(item.audioUrl, `${fname}.wav`);
                  }}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  title="Download WAV file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTrack(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Delete from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

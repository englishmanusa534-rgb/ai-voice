import React, { useMemo } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  progress: number; // 0 to 1
  onSeek: (ratio: number) => void;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  progress,
  onSeek,
  barCount = 48,
}) => {
  // Generate deterministic but organic-looking bar heights
  const bars = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < barCount; i++) {
      // Combination of sines for pleasant acoustic waveform envelope
      const normalized = i / barCount;
      const envelope = Math.sin(normalized * Math.PI); // arch
      const ripple = 0.3 * Math.sin(i * 0.9) + 0.2 * Math.cos(i * 1.7);
      const height = Math.max(15, Math.min(95, Math.round((0.35 + 0.65 * envelope + ripple) * 75)));
      list.push(height);
    }
    return list;
  }, [barCount]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio);
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-full h-16 bg-slate-900 rounded-xl px-4 flex items-center gap-1 cursor-pointer overflow-hidden select-none group border border-slate-800"
      title="Click anywhere on waveform to seek"
    >
      {/* Background glow when active */}
      {isPlaying && (
        <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
      )}

      {/* Waveform bars */}
      <div className="flex items-center justify-between w-full h-full gap-0.5 sm:gap-1">
        {bars.map((baseHeight, index) => {
          const barRatio = index / barCount;
          const isPassed = barRatio <= progress;

          // Dynamic scale when playing
          const dynamicHeight = isPlaying
            ? Math.max(
                12,
                Math.min(
                  98,
                  baseHeight + Math.sin(Date.now() / 150 + index * 0.4) * 14
                )
              )
            : baseHeight;

          return (
            <div
              key={index}
              className="flex-1 flex items-center justify-center h-full"
            >
              <div
                style={{ height: `${dynamicHeight}%` }}
                className={`w-full max-w-[5px] rounded-full transition-all duration-75 ${
                  isPassed
                    ? 'bg-indigo-400 group-hover:bg-indigo-300'
                    : 'bg-slate-700 group-hover:bg-slate-600'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Scrubber progress indicator line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xs pointer-events-none transition-all duration-75"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
};

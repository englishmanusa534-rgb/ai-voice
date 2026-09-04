import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Repeat,
  FastForward,
  Rewind,
  FileAudio,
  Check,
  Share2,
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { formatDuration, triggerDownload } from '../utils/audioUtils';
import { TTSGeneration } from '../types';

interface AudioPlayerProps {
  generation: TTSGeneration | null;
  onClear?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ generation }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [customFilename, setCustomFilename] = useState<string>('');

  // Update duration when a new generation arrives
  useEffect(() => {
    if (generation) {
      setCurrentTime(0);
      setIsPlaying(false);
      setDuration(generation.duration || 0);
      const defaultName = `speech_${generation.voice.toLowerCase()}_${new Date(
        generation.createdAt
      )
        .toISOString()
        .slice(0, 10)}`;
      setCustomFilename(defaultName);
    }
  }, [generation]);

  // Sync playback rate and volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = isLooping;
    }
  }, [playbackRate, volume, isMuted, isLooping]);

  if (!generation) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <FileAudio className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-700">Audio Player Ready</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Type or paste your text above and click <span className="font-semibold text-slate-700">"Generate Speech"</span> to listen and download your studio-quality WAV audio.
        </p>
      </div>
    );
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio playback error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (ratio: number) => {
    if (audioRef.current && duration > 0) {
      const newTime = ratio * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleDownload = () => {
    const filename = customFilename.trim() || `speech_${generation.voice.toLowerCase()}`;
    triggerDownload(generation.audioUrl, `${filename}.wav`);
  };

  const handleCopyLink = () => {
    // If it's a data url, create an object URL or copy confirmation
    navigator.clipboard.writeText(generation.text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const rates = [0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={generation.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (d && !isNaN(d)) setDuration(d);
        }}
      />

      {/* Track Details & Download Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <FileAudio className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-900 truncate">
                Voice: {generation.voice}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                {generation.tone}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {generation.sampleRate} Hz • {generation.fileSizeFormatted}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-md mt-0.5" title={generation.text}>
              "{generation.text}"
            </p>
          </div>
        </div>

        {/* Primary Download Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Download uncompressed WAV file"
          >
            <Download className="w-4 h-4" />
            Download WAV
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs"
            title="Copy speech text"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Waveform Display */}
      <AudioWaveform
        isPlaying={isPlaying}
        progress={progress}
        onSeek={handleSeek}
      />

      {/* Time and Scrub Bar Controls */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>

      {/* Main Transport & Audio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Rewind 5 seconds"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handlePlayPause}
            className="w-11 h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(5)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Forward 5 seconds"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-lg transition-colors ${
              isLooping
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={isLooping ? 'Looping enabled' : 'Loop audio'}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {rates.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setPlaybackRate(rate)}
              className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                playbackRate === rate
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-500 hover:text-slate-800 p-1 rounded transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-20 accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            title="Volume"
          />
        </div>
      </div>
    </div>
  );
};

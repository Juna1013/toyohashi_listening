import { useRef, useState, useEffect, useCallback } from "react";

interface Track {
  number: number;
  title: string;
  src: string;
  transcript?: string;
  instruction?: string;
}

interface TrackPlayerProps {
  tracks: Track[];
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TrackPlayer({ tracks }: TrackPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoPlayRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState(false);
  const currentLineRef = useRef<HTMLParagraphElement>(null);
  const [trackDurations, setTrackDurations] = useState<(number | null)[]>(() =>
    tracks.map(() => null)
  );

  const currentTrack = tracks[currentIndex];

  // 全トラックのdurationをバックグラウンドで事前取得
  useEffect(() => {
    const durations: (number | null)[] = tracks.map(() => null);
    const audios = tracks.map((track, i) => {
      const a = new Audio();
      a.preload = "metadata";
      a.addEventListener("loadedmetadata", () => {
        durations[i] = a.duration;
        setTrackDurations([...durations]);
      });
      a.src = track.src;
      return a;
    });
    return () => {
      audios.forEach((a) => {
        a.src = "";
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // メイン audio のイベントリスナー
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      if (!audio.loop) setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // トラック切り替え時にリセット＆自動再生
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    audio.load();
    if (autoPlayRef.current) {
      autoPlayRef.current = false;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentIndex]);

  const selectTrack = useCallback(
    (index: number) => {
      if (index === currentIndex) {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          audio.play().then(() => setIsPlaying(true));
        }
        return;
      }
      autoPlayRef.current = true;
      setCurrentIndex(index);
    },
    [currentIndex, isPlaying]
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      await audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const prevTrack = useCallback(() => {
    if (currentIndex > 0) {
      autoPlayRef.current = isPlaying;
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, isPlaying]);

  const nextTrack = useCallback(() => {
    if (currentIndex < tracks.length - 1) {
      autoPlayRef.current = isPlaying;
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, tracks.length, isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const toggleLoop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !loop;
    audio.loop = next;
    setLoop(next);
  }, [loop]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 現在行が変わったら自動スクロール
  useEffect(() => {
    currentLineRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [Math.floor((duration > 0 ? currentTime / duration : 0) * (currentTrack.transcript?.split("\n").filter(Boolean).length ?? 1))]);

  return (
    <div className="space-y-3">
      {/* プレイヤー */}
      <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-5">
        <audio ref={audioRef} src={currentTrack.src} preload="metadata" />

        {/* ジャケット */}
        <div className="w-81 h-81 flex items-center justify-center">
          <img
            src="/c_mark.jpg"
            alt="豊橋技術科学大学"
            className="w-full h-full object-contain drop-shadow-xl rounded-2xl"
          />
        </div>

        {/* トラック情報 */}
        <div className="text-center">
          <p className="text-xs text-red-300 mb-0.5">再生中</p>
          <p className="text-base font-bold text-white">
            {currentTrack.title}
          </p>
        </div>

        {/* シークバー */}
        <div className="w-full space-y-1">
          <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-white rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="シーク"
            />
          </div>
          <div className="flex justify-between text-xs text-white/50 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* コントロール */}
        <div className="flex items-center justify-center gap-2">
          {/* 前のトラック */}
          <button
            onClick={prevTrack}
            disabled={currentIndex === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="前のトラック"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <rect x="5" y="5" width="2" height="14" rx="1" />
              <path d="M18 5L8 12l10 7V5z" />
            </svg>
          </button>

          {/* 停止 */}
          <button
            onClick={stop}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="停止"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>

          {/* 再生 / 一時停止 */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-white/90 active:bg-white/80 transition-colors shadow-lg"
            aria-label={isPlaying ? "一時停止" : "再生"}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 translate-x-0.5">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </button>

          {/* 次のトラック */}
          <button
            onClick={nextTrack}
            disabled={currentIndex === tracks.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="次のトラック"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M6 5l10 7-10 7V5z" />
              <rect x="17" y="5" width="2" height="14" rx="1" />
            </svg>
          </button>

          {/* ループ */}
          <button
            onClick={toggleLoop}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              loop
                ? "bg-white/20 text-white"
                : "text-white/50 hover:bg-white/10"
            }`}
            aria-label={loop ? "繰り返しオフ" : "繰り返しオン"}
            aria-pressed={loop}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* トラックリスト */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {tracks.map((track, index) => {
          const isActive = index === currentIndex;
          const isThisPlaying = isActive && isPlaying;
          return (
            <div
              key={track.src}
              onClick={() => selectTrack(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && selectTrack(index)}
              className={`flex items-center gap-4 px-5 py-4 cursor-pointer select-none transition-colors ${
                isActive ? "bg-red-50" : "hover:bg-slate-50"
              }`}
            >
              {/* 番号 / 再生状態インジケータ */}
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                {isActive ? (
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      isThisPlaying
                        ? "bg-red-600 text-white"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {isThisPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 font-mono font-medium">
                    {track.number}
                  </span>
                )}
              </div>

              {/* タイトル + 指示文 */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isActive ? "text-red-700" : "text-slate-700"
                  }`}
                >
                  {track.title}
                </p>
                {track.instruction && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {track.instruction}
                  </p>
                )}
              </div>

              {/* 再生時間 */}
              <span className="text-xs font-mono text-slate-400 flex-shrink-0">
                {trackDurations[index] != null
                  ? formatTime(trackDurations[index]!)
                  : "−−:−−"}
              </span>
            </div>
          );
        })}
      </div>

      {/* スクリプト */}
      {currentTrack.transcript && (() => {
        const lines = currentTrack.transcript.split("\n").filter((l) => l.trim());
        const ratio = duration > 0 ? currentTime / duration : 0;
        const currentLineIndex = Math.floor(ratio * lines.length);
        return (
          <div className="rounded-xl overflow-hidden bg-red-600">
            <div className="px-5 py-4 space-y-2.5 max-h-56 overflow-y-auto">
              {lines.map((line, i) => {
                const isRead = i < currentLineIndex;
                const isCurrent = i === currentLineIndex;
                return (
                  <p
                    key={i}
                    ref={isCurrent ? currentLineRef : null}
                    className={`text-sm leading-relaxed transition-colors duration-500 ${
                      isRead || isCurrent ? "text-white" : "text-black/50"
                    } ${isCurrent ? "font-bold" : ""}`}
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

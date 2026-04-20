import { createContext, useContext, useRef, useState, useEffect } from "react";

export const HoldScrollContext = createContext<React.RefObject<HTMLElement | null> | null>(null);

const COLS = 6;
const ROWS = 6;
const TOTAL_FRAMES = COLS * ROWS;
const FRAME_INTERVAL_MS = 30;

export default function Hold360({
  cdn_ref: _cdn_ref,
  hold,
  className,
  setCurrentDownloadUrl: _setCurrentDownloadUrl,
}: {
  cdn_ref?: string;
  hold?: unknown;
  className?: string;
  setCurrentDownloadUrl?: (url: string) => void;
}) {
  const sprite_sheet_url: string | undefined = (hold as any)?.hold_type?.sprite_sheet_url;
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [frame, setFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollContainer = useContext(HoldScrollContext);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !sprite_sheet_url) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      {
        root: scrollContainer?.current ?? null,
        rootMargin: "40px",
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sprite_sheet_url, scrollContainer]);

  function handleMouseEnter() {
    if (!isLoaded) return;
    intervalRef.current = setInterval(() => {
      setFrame((f) => (f + 1) % TOTAL_FRAMES);
    }, FRAME_INTERVAL_MS);
  }

  function handleMouseLeave() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setFrame(0);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const col = frame % COLS;
  const row = Math.floor(frame / COLS);
  const bgX = col * (100 / (COLS - 1));
  const bgY = row * (100 / (ROWS - 1));

  return (
    <div ref={containerRef} className={className ?? ""} style={{ minHeight: 80 }}>
      {sprite_sheet_url && isVisible ? (
        <>
          {/* Preload image to detect when it's ready */}
          {!isLoaded && (
            <img
              src={sprite_sheet_url}
              alt=""
              style={{ display: "none" }}
              onLoad={() => setIsLoaded(true)}
            />
          )}
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              width: "100%",
              minHeight: 80,
              height: "100%",
              backgroundImage: isLoaded ? `url(${sprite_sheet_url})` : undefined,
              backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
              backgroundPosition: `${bgX}% ${bgY}%`,
              backgroundRepeat: "no-repeat",
            }}
          >
            {!isLoaded && (
              <div className="flex items-center justify-center w-full h-full" style={{ minHeight: 80 }}>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-400 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          className="flex items-center justify-center w-full rounded bg-gray-50"
          style={{ minHeight: 80 }}
        >
          {sprite_sheet_url ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-400 rounded-full animate-spin" />
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      )}
    </div>
  );
}

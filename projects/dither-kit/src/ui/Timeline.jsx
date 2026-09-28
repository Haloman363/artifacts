import { Diamond, Pause, Play, SkipBack } from "lucide-react";

const FPS_OPTIONS = [12, 15, 24, 30, 60];

export function Timeline({ t, duration, fps, playing, live, stages, onTime, onPlay, onFps, onDuration, fixedDuration }) {
  const tracks = stages.flatMap((s) =>
    Object.entries(s.keyframes ?? {})
      .filter(([, keys]) => keys.length)
      .map(([param, keys]) => ({ id: `${s.id}.${param}`, stage: s.displayName, param, keys })),
  );
  const pct = (time) => `${(time / duration) * 100}%`;
  const keyTimes = [...new Set(tracks.flatMap((tr) => tr.keys.map((k) => k.t)))];

  return (
    <div className="timeline">
      <div className="transport">
        <button className={`play ${playing ? "on" : ""}`} onClick={onPlay} title="Play / pause (Space)" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
        <button className="icon" onClick={() => onTime(0)} title="Back to start" aria-label="Back to start"><SkipBack size={16} /></button>
        <span className="time mono">{t.toFixed(2)}<span className="muted"> / {duration.toFixed(1)}s</span></span>
        <div className="scrub-wrap">
          <input className="scrub" type="range" min={0} max={duration} step={1 / fps} value={t} aria-label="Playhead"
            style={{ "--p": pct(t) }} onChange={(e) => onTime(+e.target.value)} />
          <div className="scrub-keys">
            {keyTimes.map((kt) => <span key={kt} style={{ left: pct(kt) }} />)}
          </div>
        </div>
        <div className="transport-opts">
          <label className="field" title="Frames per second for playback and export">
            <select value={fps} onChange={(e) => onFps(+e.target.value)} aria-label="Frames per second">
              {FPS_OPTIONS.map((f) => <option key={f} value={f}>{f} fps</option>)}
            </select>
          </label>
          <label className="field" title={fixedDuration ? "Set by the source" : "Animation length in seconds"}>
            <input type="number" inputMode="decimal" min={0.1} max={120} step={0.1} value={+duration.toFixed(2)}
              disabled={fixedDuration} aria-label="Length in seconds"
              onChange={(e) => onDuration(Math.max(0.1, +e.target.value))} />
            <span>s</span>
          </label>
          {live && <span className="live-badge">LIVE</span>}
        </div>
      </div>
      {tracks.length > 0 && (
        <div className="tracks">
          {tracks.map((tr) => (
            <div key={tr.id} className="track">
              <span className="track-label" title={`${tr.stage} · ${tr.param}`}>{tr.param}</span>
              <div className="lane">
                <div className="playhead" style={{ left: pct(t) }} />
                {tr.keys.map((k) => (
                  <button key={k.t} className="diamond" style={{ left: pct(k.t) }} title={`${k.t.toFixed(2)}s = ${+k.v.toFixed(3)}`}
                    onClick={() => onTime(k.t)}>
                    <Diamond size={10} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Camera, CameraOff, ChevronsLeftRight, Download, Image as ImageIcon, Info, Moon, SwitchCamera, X } from "lucide-react";

// Dogs have two cone types (~429 nm blue, ~555 nm yellow-green), so they are
// dichromats. The deuteranope model (Viénot, Brettel & Mollon 1999, applied in
// linear RGB) is the closest human analogue: blues and yellows stay distinct,
// while reds, oranges and greens collapse into yellowish browns.
const DICHROMAT = [0.29275, 0.70725, 0, 0.29275, 0.70725, 0, -0.02234, 0.02234, 1];

const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const LOW_LIGHT_BOOST = 60;
const LIVE_MAX_W = 720; // cap camera frames so per-pixel processing keeps up
const STILL_MAX_W = 960;
const LUT_SIZE = 4096;

const SRGB_TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  SRGB_TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// Linear [0,1] -> sRGB byte. `boost` lifts shadows to mimic a dog's better dim-light sight.
function buildOutputLut(boost) {
  const k = 1 + (boost / 100) * 2;
  const lut = new Uint8ClampedArray(LUT_SIZE + 1);
  for (let i = 0; i <= LUT_SIZE; i++) {
    const y = 1 - (1 - i / LUT_SIZE) ** k;
    lut[i] = Math.round((y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055) * 255);
  }
  return lut;
}

// dichromat=false applies only the low-light lift, leaving colors as a human sees them.
function applyColor(data, boost, dichromat = true) {
  const m = dichromat ? DICHROMAT : IDENTITY;
  const lut = buildOutputLut(boost);
  const clamp = (v) => ((v < 0 ? 0 : v > 1 ? 1 : v) * LUT_SIZE + 0.5) | 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = SRGB_TO_LINEAR[data[i]];
    const g = SRGB_TO_LINEAR[data[i + 1]];
    const b = SRGB_TO_LINEAR[data[i + 2]];
    data[i] = lut[clamp(m[0] * r + m[1] * g + m[2] * b)];
    data[i + 1] = lut[clamp(m[3] * r + m[4] * g + m[5] * b)];
    data[i + 2] = lut[clamp(m[6] * r + m[7] * g + m[8] * b)];
  }
}

function drawSampleScene() {
  const c = document.createElement("canvas");
  c.width = 960;
  c.height = 640;
  const g = c.getContext("2d");

  const sky = g.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, "#4aa3ff");
  sky.addColorStop(1, "#bfe3ff");
  g.fillStyle = sky;
  g.fillRect(0, 0, 960, 640);

  g.fillStyle = "#ffdd33";
  g.beginPath();
  g.arc(830, 90, 50, 0, Math.PI * 2);
  g.fill();

  // Tree
  g.fillStyle = "#6b3f1d";
  g.fillRect(120, 200, 34, 130);
  g.fillStyle = "#1f8a2e";
  g.beginPath();
  g.arc(137, 170, 85, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#e8262a";
  for (const [x, y] of [[100, 150], [160, 190], [130, 120], [170, 140]]) {
    g.beginPath();
    g.arc(x, y, 9, 0, Math.PI * 2);
    g.fill();
  }

  // Doghouse
  g.fillStyle = "#b8722c";
  g.fillRect(610, 200, 210, 130);
  g.fillStyle = "#d61f1f";
  g.beginPath();
  g.moveTo(590, 205);
  g.lineTo(715, 120);
  g.lineTo(840, 205);
  g.closePath();
  g.fill();
  g.fillStyle = "#2a1608";
  g.beginPath();
  g.arc(715, 330, 42, Math.PI, 0);
  g.fill();

  // Grass
  const grass = g.createLinearGradient(0, 300, 0, 640);
  grass.addColorStop(0, "#39b54a");
  grass.addColorStop(1, "#1e7a2b");
  g.fillStyle = grass;
  g.fillRect(0, 320, 960, 320);
  g.fillStyle = "rgba(255,255,255,0.08)";
  for (let x = 0; x < 960; x += 80) g.fillRect(x, 320, 40, 320);

  // Toys and flowers
  const ball = (x, y, r, color) => {
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.ellipse(x + r * 0.2, y + r * 0.95, r, r * 0.3, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.beginPath();
    g.arc(x - r * 0.3, y - r * 0.35, r * 0.25, 0, Math.PI * 2);
    g.fill();
  };
  ball(200, 470, 58, "#e8262a"); // red
  ball(420, 540, 48, "#ff8a00"); // orange
  ball(640, 470, 52, "#1f5fff"); // blue
  ball(820, 540, 44, "#ffe600"); // yellow
  ball(330, 400, 30, "#ff3ea5"); // pink
  ball(540, 395, 26, "#8a2be2"); // purple
  for (let i = 0; i < 14; i++) {
    const x = 40 + i * 68;
    const y = 590 + (i % 3) * 12;
    g.fillStyle = i % 2 ? "#ff3b3b" : "#ff7ad9";
    g.beginPath();
    g.arc(x, y, 8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffe600";
    g.beginPath();
    g.arc(x, y, 3, 0, Math.PI * 2);
    g.fill();
  }
  return { el: c, w: c.width, h: c.height, live: false };
}

let sampleScene;
const getSampleScene = () => (sampleScene ??= drawSampleScene());

function paintSpectrum(canvas, dog) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  for (let i = 0; i <= 12; i++) grad.addColorStop(i / 12, `hsl(${i * 25},100%,50%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!dog) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyColor(img.data, 0);
  ctx.putImageData(img, 0, 0);
}

// Sample scene with a draggable human/dog wipe, starting in the middle.
function CompareDemo() {
  const humanRef = useRef(null);
  const dogRef = useRef(null);
  const stageRef = useRef(null);
  const dragging = useRef(false);
  const [split, setSplit] = useState(50);

  useEffect(() => {
    const human = humanRef.current;
    const dog = dogRef.current;
    const w = 480;
    const h = 320;
    human.width = dog.width = w;
    human.height = dog.height = h;
    const hctx = human.getContext("2d", { willReadFrequently: true });
    hctx.drawImage(getSampleScene().el, 0, 0, w, h);
    const img = hctx.getImageData(0, 0, w, h);
    applyColor(img.data, 0);
    dog.getContext("2d").putImageData(img, 0, 0);
  }, []);

  function move(e) {
    const rect = stageRef.current.getBoundingClientRect();
    setSplit(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
  }

  return (
    <div>
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden rounded-xl bg-black select-none"
        style={{ aspectRatio: "3 / 2", touchAction: "pan-y" }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={(e) => dragging.current && move(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <canvas ref={humanRef} className="absolute inset-0 w-full h-full" />
        <canvas ref={dogRef} className="absolute inset-0 w-full h-full" style={{ clipPath: `inset(0 0 0 ${split}%)` }} />
        <div className="absolute inset-y-0 w-0.5 bg-white/80 pointer-events-none" style={{ left: `${split}%` }}>
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dv-text text-dv-ink flex items-center justify-center">
            <ChevronsLeftRight size={16} strokeWidth={2} />
          </div>
        </div>
        <span className="absolute top-2 left-2 font-mono text-[10px] uppercase tracking-wider bg-dv-ink/75 rounded px-1.5 py-0.5 pointer-events-none">Human</span>
        <span className="absolute top-2 right-2 font-mono text-[10px] uppercase tracking-wider bg-dv-ink/75 rounded px-1.5 py-0.5 pointer-events-none">Dog</span>
      </div>
      <p className="mt-2 text-[11px] text-dv-mute text-center">Drag to compare</p>
    </div>
  );
}

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dv-yellow";

function DockButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center gap-1.5 min-h-[3.5rem] rounded-xl border text-[11px] font-medium transition-colors ${focusRing} ${
        active
          ? "border-dv-yellow text-dv-yellow"
          : "border-dv-line text-dv-text active:bg-dv-panel"
      }`}
    >
      <Icon size={20} strokeWidth={1.75} />
      {label}
    </button>
  );
}

const FACTS = [
  ["Color", "Two cone types (blue and yellow-green) instead of our three. Blues and yellows stay distinct; reds, oranges and greens all land on yellowish brown."],
  ["Sharpness", "Roughly 20/75. A dog has to be 20 ft from something to see what we still see clearly from 75 ft. Not simulated here."],
  ["Low light", "Dogs see better than we do in dim light and take in a wider view (about 240° vs 180°). The Low light button just brightens shadows, in either view."],
];

const overlayButton = `w-11 h-11 rounded-lg bg-dv-ink/75 text-dv-text flex items-center justify-center active:bg-dv-ink ${focusRing}`;

export default function DogVision() {
  const [source, setSource] = useState("camera"); // camera | photo | sample
  const [camera, setCamera] = useState({ status: "idle", message: "" }); // idle | starting | live | denied | unavailable
  const [retry, setRetry] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState("environment");
  const [view, setView] = useState("dog"); // dog | human
  const [lowLight, setLowLight] = useState(false);
  const [error, setError] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [hint, setHint] = useState(true);
  const [saved, setSaved] = useState(false);

  const rootRef = useRef(null);
  const [top, setTop] = useState(0);
  const humanRef = useRef(null);
  const dogRef = useRef(null);
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const humanStripRef = useRef(null);
  const dogStripRef = useRef(null);
  const srcRef = useRef(null);
  const paramsRef = useRef({ dog: true, boost: 0 });

  const render = useCallback(() => {
    const src = srcRef.current;
    const human = humanRef.current;
    const dog = dogRef.current;
    if (!src || !human || !dog) return;

    const scale = Math.min(1, (src.live ? LIVE_MAX_W : STILL_MAX_W) / src.w);
    const w = Math.round(src.w * scale);
    const h = Math.round(src.h * scale);
    if (human.width !== w || human.height !== h) {
      human.width = dog.width = w;
      human.height = dog.height = h;
    }

    const hctx = human.getContext("2d", { willReadFrequently: true });
    hctx.drawImage(src.el, 0, 0, w, h);
    const p = paramsRef.current;
    if (!p.dog && p.boost === 0) return;
    const img = hctx.getImageData(0, 0, w, h);
    applyColor(img.data, p.boost, p.dog);
    (p.dog ? dog.getContext("2d") : hctx).putImageData(img, 0, 0);
  }, []);

  // View or low-light changed: re-render stills (the camera loop reads paramsRef itself).
  useEffect(() => {
    paramsRef.current = { dog: view === "dog", boost: lowLight ? LOW_LIGHT_BOOST : 0 };
    if (source !== "camera") render();
  }, [view, lowLight, source, render]);

  // Sample scene or uploaded photo.
  useEffect(() => {
    if (source === "camera") return;
    if (source === "photo" && photo) {
      srcRef.current = photo;
    } else {
      srcRef.current = getSampleScene();
    }
    render();
  }, [source, photo, render]);

  // Live camera.
  useEffect(() => {
    if (source !== "camera") {
      setCamera({ status: "idle", message: "" });
      return;
    }
    const video = videoRef.current;
    let stream;
    let raf = 0;
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        setCamera((c) => (c.status === "live" ? c : { status: "starting", message: "" }));
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error("no mediaDevices"), { name: "Unsupported" });
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        setCamera({ status: "live", message: "" });
        const tick = () => {
          if (cancelled) return;
          if (video.videoWidth) {
            srcRef.current = { el: video, w: video.videoWidth, h: video.videoHeight, live: true };
            render();
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        if (cancelled) return;
        if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
          setCamera({ status: "denied", message: "" });
        } else if (e?.name === "Unsupported") {
          setCamera({ status: "unavailable", message: "This browser or connection can't use the camera. Camera access needs a secure (HTTPS) page." });
        } else if (e?.name === "NotFoundError") {
          setCamera({ status: "unavailable", message: "No camera was found on this device." });
        } else {
          setCamera({ status: "unavailable", message: "Couldn't start the camera. Another app may be using it." });
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };
  }, [source, facing, retry, render]);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);

  // Info sheet: paint the rainbow strips and close on Escape.
  useEffect(() => {
    if (!infoOpen) return;
    paintSpectrum(humanStripRef.current, false);
    paintSpectrum(dogStripRef.current, true);
    const onKey = (e) => e.key === "Escape" && setInfoOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [infoOpen]);

  function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setError(null);
      setPhoto({ el: img, w: img.naturalWidth, h: img.naturalHeight, live: false, url });
      setSource("photo");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("That file couldn't be read as an image.");
    };
    img.src = url;
  }

  function save() {
    if (source === "camera" && camera.status !== "live") return;
    const canvas = view === "dog" ? dogRef.current : humanRef.current;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = view === "dog" ? "dog-vision.png" : "human-view.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, "image/png");
  }

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 7000);
    return () => clearTimeout(t);
  }, []);

  // Fill exactly the space under the shared Back bar, whatever its height (safe areas differ).
  useLayoutEffect(() => {
    const measure = () => setTop(rootRef.current.getBoundingClientRect().top + window.scrollY);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const fit = source === "camera" ? "object-cover" : "object-contain";
  const changeView = (v) => {
    setView(v);
    setHint(false);
  };
  const toggleView = () => changeView(view === "dog" ? "human" : "dog");
  const seg = (active) =>
    `relative min-h-[2.75rem] rounded-lg text-sm font-semibold transition-colors ${focusRing} ${
      active ? "text-dv-ink" : "text-dv-mute"
    }`;

  return (
    <div ref={rootRef} className="flex flex-col bg-dv-ink text-dv-text" style={{ minHeight: `calc(100dvh - ${top}px)` }}>
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col md:px-4 md:pt-4">
        {/* Stage: fills the space above the controls; tap the image to switch views. */}
        <div className="relative flex-1 min-h-[45dvh] bg-dv-panel overflow-hidden select-none md:rounded-xl" onClick={toggleView}>
          <canvas ref={humanRef} className={`absolute inset-0 w-full h-full ${fit} ${view === "human" ? "" : "hidden"}`} />
          <canvas ref={dogRef} className={`absolute inset-0 w-full h-full ${fit} ${view === "dog" ? "" : "hidden"}`} />

          <span className="absolute top-3 left-3 flex items-center gap-2 rounded-md bg-dv-ink/75 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider pointer-events-none">
            <i className={`block w-1.5 h-1.5 rounded-full ${view === "dog" ? "bg-dv-yellow" : "bg-dv-blue"}`} />
            {view === "dog" ? "Dog" : "Human"}
            {source === "sample" && <span className="text-dv-mute">/ sample</span>}
            {lowLight && <span className="text-dv-mute">/ low light</span>}
          </span>
          <button
            aria-label="About Dog Vision"
            className={`absolute top-3 right-3 z-20 ${overlayButton}`}
            onClick={(e) => {
              e.stopPropagation();
              setInfoOpen(true);
            }}
          >
            <Info size={20} strokeWidth={1.75} />
          </button>

          {source === "camera" && camera.status !== "live" && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-dv-ink px-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {camera.status === "starting" || camera.status === "idle" ? (
                <>
                  <Camera size={32} strokeWidth={1.5} className="text-dv-yellow" />
                  <h2 className="text-lg font-semibold">Allow camera access</h2>
                  <p className="text-sm text-dv-mute max-w-xs">
                    Dog Vision needs your camera to show the world the way a dog sees it. Tap Allow when your
                    browser asks. Video stays on this device and is never recorded or uploaded.
                  </p>
                </>
              ) : (
                <>
                  <CameraOff size={32} strokeWidth={1.5} className="text-dv-mute" />
                  <h2 className="text-lg font-semibold">
                    {camera.status === "denied" ? "Camera access is blocked" : "Camera unavailable"}
                  </h2>
                  <p className="text-sm text-dv-mute max-w-xs">
                    {camera.status === "denied"
                      ? "Turn the camera back on for this site in your browser's site settings (tap the lock or page-settings icon in the address bar), then try again."
                      : camera.message}
                  </p>
                  <button
                    onClick={() => setRetry((n) => n + 1)}
                    className={`w-full max-w-xs min-h-[3rem] rounded-xl bg-dv-yellow text-sm font-semibold text-dv-ink active:opacity-80 ${focusRing}`}
                  >
                    Try again
                  </button>
                </>
              )}
              <button
                onClick={() => fileRef.current.click()}
                className={`w-full max-w-xs min-h-[3rem] rounded-xl border border-dv-line text-sm font-medium active:bg-dv-panel ${focusRing}`}
              >
                Use a photo instead
              </button>
            </div>
          )}
          <span
            className={`absolute bottom-3 left-3 rounded-md bg-dv-ink/75 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-dv-text/80 pointer-events-none transition-opacity duration-500 ${
              hint && !(source === "camera" && camera.status !== "live") ? "opacity-100" : "opacity-0"
            }`}
          >
            Tap to switch view
          </span>
          {source === "camera" && camera.status === "live" && (
            <button
              aria-label="Flip camera"
              className={`absolute bottom-3 right-3 ${overlayButton}`}
              onClick={(e) => {
                e.stopPropagation();
                setFacing((f) => (f === "environment" ? "user" : "environment"));
              }}
            >
              <SwitchCamera size={20} strokeWidth={1.75} />
            </button>
          )}
        </div>

        <video ref={videoRef} playsInline muted className="hidden" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        {/* Controls sit at the bottom, in thumb reach. */}
        <div className="px-3 md:px-0 pt-3 space-y-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
          {error && <p className="text-sm text-red-400 px-1">{error}</p>}

          <div className="relative grid grid-cols-2 p-1 rounded-xl bg-dv-panel" role="group" aria-label="View">
            <span
              aria-hidden
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-dv-yellow transition-transform duration-200 ease-out motion-reduce:transition-none ${
                view === "dog" ? "translate-x-full" : ""
              }`}
            />
            <button className={seg(view === "human")} aria-pressed={view === "human"} onClick={() => changeView("human")}>Human</button>
            <button className={seg(view === "dog")} aria-pressed={view === "dog"} onClick={() => changeView("dog")}>Dog</button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <DockButton icon={ImageIcon} label="Photo" active={source === "photo"} onClick={() => fileRef.current.click()} />
            <DockButton
              icon={Camera}
              label="Camera"
              active={source === "camera"}
              onClick={() => setSource((s) => (s === "camera" ? (photo ? "photo" : "sample") : "camera"))}
            />
            <DockButton icon={Moon} label="Low light" active={lowLight} onClick={() => setLowLight((v) => !v)} />
            <DockButton icon={Download} label={saved ? "Saved" : "Save"} onClick={save} />
          </div>
        </div>
      </div>

      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setInfoOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="About Dog Vision"
            className="w-full max-w-2xl mx-auto max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-dv-panel px-5 pt-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-dv-line" />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">How dogs see</h2>
              <button aria-label="Close" className="w-11 h-11 -mr-2 flex items-center justify-center text-dv-mute active:opacity-60" onClick={() => setInfoOpen(false)}>
                <X size={22} strokeWidth={1.75} />
              </button>
            </div>

            <CompareDemo />

            <div className="mt-5 space-y-2">
              <div className="text-xs text-dv-mute">Rainbow</div>
              <canvas ref={humanStripRef} width={240} height={1} className="w-full h-5 rounded" />
              <canvas ref={dogStripRef} width={240} height={1} className="w-full h-5 rounded" />
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-wider text-dv-mute">
                <span>Human</span>
                <span>Dog</span>
              </div>
            </div>

            <dl className="mt-5 divide-y divide-dv-line border-t border-dv-line">
              {FACTS.map(([term, text]) => (
                <div key={term} className="py-3">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-dv-yellow">{term}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-dv-mute">{text}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-1 text-[11px] leading-relaxed text-dv-mute/70">
              An approximation: color uses a human deuteranopia model.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

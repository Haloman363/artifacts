import { useCallback, useEffect, useRef, useState } from "react";

// Dogs have two cone types (~429 nm blue, ~555 nm yellow-green), so they are
// dichromats. The deuteranope model (Viénot, Brettel & Mollon 1999, applied in
// linear RGB) is the closest human analogue: blues and yellows stay distinct,
// while reds, oranges and greens collapse into yellowish browns.
const DICHROMAT = [0.29275, 0.70725, 0, 0.29275, 0.70725, 0, -0.02234, 0.02234, 1];

const DEFAULTS = { color: 100, boost: 0 };
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

function applyColor(data, colorPct, boost) {
  const t = colorPct / 100;
  const m = DICHROMAT.map((v, i) => v * t + (i % 4 === 0 ? 1 - t : 0));
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

function paintSpectrum(canvas, colorPct, boost, dog) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  for (let i = 0; i <= 12; i++) grad.addColorStop(i / 12, `hsl(${i * 25},100%,50%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!dog) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyColor(img.data, colorPct, boost);
  ctx.putImageData(img, 0, 0);
}

function Slider({ label, value, display, min, max, onChange, hint }) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-500">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500"
      />
      {hint && <div className="flex justify-between text-[10px] text-gray-600">{hint.map((h) => <span key={h}>{h}</span>)}</div>}
    </label>
  );
}

export default function DogVision() {
  const [source, setSource] = useState("sample"); // sample | photo | camera
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState("environment");
  const [params, setParams] = useState(DEFAULTS);
  const [split, setSplit] = useState(50);
  const [aspect, setAspect] = useState(1.5);
  const [error, setError] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  const humanRef = useRef(null);
  const dogRef = useRef(null);
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const stageRef = useRef(null);
  const humanStripRef = useRef(null);
  const dogStripRef = useRef(null);
  const srcRef = useRef(null);
  const paramsRef = useRef(params);
  const sampleRef = useRef(null);
  const aspectRef = useRef(1.5);
  const dragging = useRef(false);

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
    if (aspectRef.current !== w / h) {
      aspectRef.current = w / h;
      setAspect(w / h);
    }

    const hctx = human.getContext("2d", { willReadFrequently: true });
    hctx.drawImage(src.el, 0, 0, w, h);
    const img = hctx.getImageData(0, 0, w, h);
    const p = paramsRef.current;
    applyColor(img.data, p.color, p.boost);
    dog.getContext("2d").putImageData(img, 0, 0);
  }, []);

  // Settings changed: re-render stills (the camera loop reads paramsRef itself).
  useEffect(() => {
    paramsRef.current = params;
    if (source !== "camera") render();
    paintSpectrum(humanStripRef.current, 0, 0, false);
    paintSpectrum(dogStripRef.current, params.color, params.boost, true);
  }, [params, source, render]);

  // Sample scene or uploaded photo.
  useEffect(() => {
    if (source === "camera") return;
    if (source === "photo" && photo) {
      srcRef.current = photo;
    } else {
      sampleRef.current ??= drawSampleScene();
      srcRef.current = sampleRef.current;
    }
    render();
  }, [source, photo, render]);

  // Live camera.
  useEffect(() => {
    if (source !== "camera") return;
    const video = videoRef.current;
    let stream;
    let raf = 0;
    let cancelled = false;

    (async () => {
      try {
        setError(null);
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
        setError(
          e?.name === "NotAllowedError"
            ? "Camera permission was denied."
            : "Couldn't start the camera on this device."
        );
        setSource("sample");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };
  }, [source, facing, render]);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);

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
    dogRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dog-vision.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  function moveSplit(e) {
    const rect = stageRef.current.getBoundingClientRect();
    setSplit(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
  }

  const set = (key) => (value) => setParams((p) => ({ ...p, [key]: value }));
  const tab = (active) =>
    `flex-1 py-2 text-sm rounded-lg transition-colors ${
      active ? "bg-amber-600 text-white" : "bg-gray-900 text-gray-400 active:bg-gray-800"
    }`;

  return (
    <div className="min-h-full bg-gray-950 text-white px-4 py-4 pb-10">
      <div className="max-w-2xl mx-auto space-y-4">
        <div
          ref={stageRef}
          className="relative mx-auto select-none overflow-hidden rounded-2xl bg-black"
          style={{ width: `min(100%, ${65 * aspect}vh)`, aspectRatio: aspect, touchAction: "pan-y" }}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            moveSplit(e);
          }}
          onPointerMove={(e) => dragging.current && moveSplit(e)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <canvas ref={humanRef} className="absolute inset-0 w-full h-full" />
          <canvas
            ref={dogRef}
            className="absolute inset-0 w-full h-full"
            style={{ clipPath: `inset(0 0 0 ${split}%)` }}
          />
          <div className="absolute inset-y-0 w-0.5 bg-white/80 pointer-events-none" style={{ left: `${split}%` }}>
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-900 text-xs flex items-center justify-center shadow">
              ↔
            </div>
          </div>
          <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-black/60 rounded px-1.5 py-0.5 pointer-events-none">
            Human
          </span>
          <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide bg-black/60 rounded px-1.5 py-0.5 pointer-events-none">
            Dog 🐕
          </span>
        </div>

        <video ref={videoRef} playsInline muted className="hidden" />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button className={tab(source === "sample")} onClick={() => setSource("sample")}>Sample</button>
          <button className={tab(source === "photo")} onClick={() => (photo ? setSource("photo") : fileRef.current.click())}>Photo</button>
          <button className={tab(source === "camera")} onClick={() => setSource("camera")}>Camera</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        <div className="flex gap-2 text-xs">
          <button onClick={() => fileRef.current.click()} className="flex-1 py-2 rounded-lg border border-gray-800 text-gray-300 active:bg-gray-900">
            Upload photo
          </button>
          {source === "camera" && (
            <button
              onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              className="flex-1 py-2 rounded-lg border border-gray-800 text-gray-300 active:bg-gray-900"
            >
              Flip camera
            </button>
          )}
          <button onClick={save} className="flex-1 py-2 rounded-lg border border-gray-800 text-gray-300 active:bg-gray-900">
            Save dog view
          </button>
        </div>

        <div className="space-y-4 rounded-2xl bg-gray-900 p-4">
          <Slider
            label="Color vision"
            value={params.color}
            display={params.color === 100 ? "Dog" : params.color === 0 ? "Human" : `${params.color}% dog`}
            min={0}
            max={100}
            onChange={set("color")}
            hint={["Human", "Dog"]}
          />
          <Slider
            label="Low-light boost"
            value={params.boost}
            display={`${params.boost}%`}
            min={0}
            max={100}
            onChange={set("boost")}
          />
          <button onClick={() => setParams(DEFAULTS)} className="text-xs text-amber-500 active:opacity-60">
            Reset to typical dog
          </button>
        </div>

        <div className="rounded-2xl bg-gray-900 p-4 space-y-2">
          <div className="text-xs text-gray-300">Rainbow</div>
          <canvas ref={humanStripRef} width={240} height={1} className="w-full h-4 rounded" />
          <canvas ref={dogStripRef} width={240} height={1} className="w-full h-4 rounded" />
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Top: human</span>
            <span>Bottom: dog</span>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-900 p-4 text-xs text-gray-400">
          <button onClick={() => setShowAbout((v) => !v)} className="w-full flex justify-between text-gray-300 active:opacity-60">
            <span>How dogs see</span>
            <span>{showAbout ? "−" : "+"}</span>
          </button>
          {showAbout && (
            <ul className="mt-3 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Dogs have two cone types (blue and yellow-green) instead of our three. Blues and yellows look distinct; reds, oranges and greens blur into yellowish-brown and gray.</li>
              <li>Their acuity is roughly 20/75, so fine detail is softer than it is to us. That softness is not simulated here.</li>
              <li>They also see better in dim light and have a much wider field of view (about 240° vs our 180°). Only the low-light part is loosely approximated.</li>
              <li>This is an approximation. Color uses a human deuteranopia model.</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Frame sources. Each exposes { kind, width, height, duration, drawAt(ctx, w, h, t) }.
// Stills get a nominal duration so keyframes can animate them.

const STILL_DURATION = 3;

export const loadImage = async (file) => {
  const bitmap = await createImageBitmap(file);
  return {
    kind: "image",
    name: file.name,
    width: bitmap.width,
    height: bitmap.height,
    duration: STILL_DURATION,
    drawAt: async (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
    dispose: () => bitmap.close(),
  };
};

// Animated GIF / WebP via WebCodecs ImageDecoder; falls back to a still.
export const loadAnimatedImage = async (file) => {
  if (!("ImageDecoder" in window)) return loadImage(file);
  const decoder = new ImageDecoder({ data: file.stream(), type: file.type });
  await decoder.tracks.ready;
  const count = decoder.tracks.selectedTrack.frameCount;
  if (count <= 1) {
    decoder.close();
    return loadImage(file);
  }
  const frames = [];
  let at = 0;
  for (let i = 0; i < count; i++) {
    const { image } = await decoder.decode({ frameIndex: i });
    const bitmap = await createImageBitmap(image);
    const dur = (image.duration ?? 100000) / 1e6;
    frames.push({ t: at, bitmap });
    at += dur || 0.1;
    image.close();
  }
  decoder.close();
  const frameAt = (t) => {
    const local = t % at;
    let f = frames[0];
    for (const fr of frames) if (fr.t <= local) f = fr;
    return f.bitmap;
  };
  return {
    kind: "animation",
    name: file.name,
    width: frames[0].bitmap.width,
    height: frames[0].bitmap.height,
    duration: at,
    drawAt: async (ctx, w, h, t) => ctx.drawImage(frameAt(t), 0, 0, w, h),
    dispose: () => frames.forEach((f) => f.bitmap.close()),
  };
};

const seek = (video, t) =>
  new Promise((resolve) => {
    if (Math.abs(video.currentTime - t) < 1e-3 && video.readyState >= 2) return resolve();
    video.addEventListener("seeked", () => resolve(), { once: true });
    video.currentTime = t;
  });

export const loadVideo = async (file) => {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  await new Promise((resolve, reject) => {
    video.onloadeddata = resolve;
    video.onerror = () => reject(new Error("This browser cannot decode that video"));
  });
  return {
    kind: "video",
    name: file.name,
    width: video.videoWidth,
    height: video.videoHeight,
    duration: video.duration,
    drawAt: async (ctx, w, h, t) => {
      await seek(video, Math.min(t, video.duration - 1e-3));
      ctx.drawImage(video, 0, 0, w, h);
    },
    dispose: () => {
      video.removeAttribute("src");
      URL.revokeObjectURL(url);
    },
  };
};

export const loadWebcam = async () => {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera not available in this browser");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await video.play();
  return {
    kind: "webcam",
    name: "Webcam",
    width: video.videoWidth,
    height: video.videoHeight,
    duration: 10,
    live: true,
    drawAt: async (ctx, w, h) => ctx.drawImage(video, 0, 0, w, h),
    dispose: () => stream.getTracks().forEach((tr) => tr.stop()),
  };
};

export const loadFile = (file) => {
  if (file.type.startsWith("video/")) return loadVideo(file);
  if (file.type === "image/gif" || file.type === "image/webp") return loadAnimatedImage(file);
  if (file.type.startsWith("image/")) return loadImage(file);
  throw new Error(`Unsupported file type: ${file.type || file.name}`);
};

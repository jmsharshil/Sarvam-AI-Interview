export function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? "";
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read audio"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

export async function playBase64Audio(
  audioBase64: string,
  mimeType: string,
  signal?: AbortSignal,
): Promise<void> {
  const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType || "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.pause();
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
    const onAbort = () => {
      cleanup();
      resolve();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    audio.onended = () => {
      signal?.removeEventListener("abort", onAbort);
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      cleanup();
      reject(new Error("Playback failed"));
    };
    void audio.play().catch((err) => {
      signal?.removeEventListener("abort", onAbort);
      cleanup();
      reject(err);
    });
  });
}

type VadOptions = {
  stream: MediaStream;
  onLevel: (level: number) => void;
  onUtterance: (blob: Blob, mimeType: string) => void;
  enabled: () => boolean;
};

export function startCaptureLoop(opts: VadOptions) {
  const mime = pickRecorderMime();
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(opts.stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.72;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let speaking = false;
  let silenceMs = 0;
  let speechMs = 0;
  let last = performance.now();
  let raf = 0;
  let stopped = false;

  const startRec = () => {
    if (!mime || recorder) return;
    chunks = [];
    recorder = new MediaRecorder(opts.stream, { mimeType: mime });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.start(120);
  };

  const flush = () => {
    const rec = recorder;
    recorder = null;
    if (!rec) return;
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || mime });
      chunks = [];
      if (blob.size > 1200 && opts.enabled()) {
        opts.onUtterance(blob, rec.mimeType || mime);
      }
    };
    if (rec.state !== "inactive") rec.stop();
  };

  const tick = () => {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = now - last;
    last = now;

    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    opts.onLevel(Math.min(1, rms * 4.2));

    if (!opts.enabled()) {
      if (speaking) {
        speaking = false;
        flush();
      }
      return;
    }

    const hot = rms > 0.045;
    if (hot) {
      speechMs += dt;
      silenceMs = 0;
      if (!speaking && speechMs > 180) {
        speaking = true;
        startRec();
      }
    } else {
      silenceMs += dt;
      if (speaking && silenceMs > 1300 && speechMs > 400) {
        speaking = false;
        speechMs = 0;
        flush();
      }
      if (!speaking) speechMs = 0;
    }
  };

  raf = requestAnimationFrame(tick);

  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (speaking) flush();
      else if (recorder && recorder.state !== "inactive") recorder.stop();
      void ctx.close();
    },
    finishNow: () => {
      if (speaking || recorder) {
        speaking = false;
        flush();
      }
    },
  };
}

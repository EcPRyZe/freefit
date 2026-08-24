let ctx: AudioContext | null = null;
let restEl: HTMLAudioElement | null = null;
let restUrl: string | null = null;
let lockArmed = false;

function audio(): AudioContext | null {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const c = audio();
  if (c && c.state === "suspended") void c.resume();
}

export function playRestPing() {
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const now = c.currentTime;
  const beep = (at: number, freq: number) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    o.connect(g);
    g.connect(c.destination);
    o.start(at);
    o.stop(at + 0.18);
  };
  beep(now, 880);
  beep(now + 0.2, 1175);
  beep(now + 0.4, 1319);
}

export function notifyRestOver() {
  if (!lockArmed) playRestPing();
  lockArmed = false;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification("FreeFit", { body: "Rest is over — next set." });
  } catch {
    /* iframe / unsupported */
  }
}

export function requestRestAlerts() {
  unlockAudio();
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

function writeWav(samples: Int16Array, sr: number): Blob {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, n * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++, o += 2) view.setInt16(o, samples[i], true);
  return new Blob([buffer], { type: "audio/wav" });
}

function restWav(seconds: number): Blob {
  const sr = 16000;
  const start = Math.max(0.08, seconds);
  const tail = 0.75;
  const n = Math.floor((start + tail) * sr);
  const data = new Int16Array(n);
  const until = Math.floor(start * sr);
  for (let i = 0; i < until; i++) data[i] = i % 2 === 0 ? 12 : -12;
  const freqs = [880, 1175, 1319];
  for (let b = 0; b < freqs.length; b++) {
    const at = until + Math.floor(b * 0.2 * sr);
    const len = Math.floor(0.16 * sr);
    for (let i = 0; i < len && at + i < n; i++) {
      const env = Math.sin((Math.PI * i) / len);
      data[at + i] = Math.round(Math.sin((2 * Math.PI * freqs[b] * i) / sr) * env * 12000);
    }
  }
  return writeWav(data, sr);
}

function formatLock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function updateLockScreenRest(remaining: number, total: number, label?: string) {
  if (typeof navigator === "undefined" || !navigator.mediaSession) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Rest ${formatLock(remaining)}`,
      artist: label || "FreeFit",
      album: "FreeFit rest timer",
    });
    navigator.mediaSession.playbackState = "playing";
    navigator.mediaSession.setPositionState({
      duration: Math.max(1, total),
      playbackRate: 1,
      position: Math.min(total, Math.max(0, total - remaining)),
    });
  } catch {
    /* unsupported */
  }
}

export function cancelLockScreenRest() {
  lockArmed = false;
  if (restEl) {
    restEl.pause();
    restEl.src = "";
    restEl = null;
  }
  if (restUrl) {
    URL.revokeObjectURL(restUrl);
    restUrl = null;
  }
  if (typeof navigator !== "undefined" && navigator.mediaSession) {
    try {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.metadata = null;
    } catch {
      /* */
    }
  }
}

export function armLockScreenRest(remainingSec: number, total: number, label?: string) {
  cancelLockScreenRest();
  if (remainingSec <= 0 || typeof Audio === "undefined") return;
  unlockAudio();
  const blob = restWav(Math.min(remainingSec, 600));
  restUrl = URL.createObjectURL(blob);
  const el = new Audio(restUrl);
  el.preload = "auto";
  el.setAttribute("playsinline", "true");
  (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  const play = el.play();
  restEl = el;
  lockArmed = true;
  updateLockScreenRest(remainingSec, total, label);
  if (play && typeof play.catch === "function") {
    void play.catch(() => {
      lockArmed = false;
    });
  }
  if (navigator.mediaSession) {
    try {
      navigator.mediaSession.setActionHandler("pause", () => {
        import("./store").then(({ useGym }) => useGym.getState().skipRest());
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        import("./store").then(({ useGym }) => useGym.getState().skipRest());
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        import("./store").then(({ useGym }) => useGym.getState().addRest(15));
      });
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        import("./store").then(({ useGym }) => useGym.getState().addRest(-15));
      });
    } catch {
      /* */
    }
  }
}

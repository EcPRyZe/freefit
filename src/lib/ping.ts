let ctx: AudioContext | null = null;

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
  playRestPing();
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

export type HrSource = "ble" | "watch" | "airpods" | "healthkit";

export interface HrSnapshot {
  bpm: number | null;
  avg: number | null;
  max: number | null;
  source: HrSource | null;
  connected: boolean;
  deviceName: string | null;
  error: string | null;
}

type Listener = (s: HrSnapshot) => void;

const HEART_RATE_SERVICE = 0x180d;
const HEART_RATE_MEASUREMENT = 0x2a37;

interface BleDevice {
  name?: string;
  gatt?: { connect: () => Promise<BleServer> };
  addEventListener: (type: string, fn: () => void) => void;
}
interface BleServer {
  connected: boolean;
  disconnect: () => void;
  getPrimaryService: (id: number) => Promise<{
    getCharacteristic: (id: number) => Promise<BleChar>;
  }>;
}
interface BleChar {
  value?: DataView;
  startNotifications: () => Promise<void>;
  addEventListener: (type: string, fn: (ev: Event) => void) => void;
}

let device: BleDevice | null = null;
let server: BleServer | null = null;
let bpm: number | null = null;
let maxBpm = 0;
const samples: number[] = [];
let source: HrSource | null = null;
let deviceName: string | null = null;
let error: string | null = null;
const listeners = new Set<Listener>();

function emit() {
  const snap = snapshotHr();
  listeners.forEach((fn) => fn(snap));
}

export function bleHrSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function snapshotHr(): HrSnapshot {
  const avg =
    samples.length > 0
      ? Math.round(samples.reduce((a, n) => a + n, 0) / samples.length)
      : null;
  return {
    bpm,
    avg,
    max: maxBpm || null,
    source,
    connected: Boolean(server?.connected),
    deviceName,
    error,
  };
}

export function subscribeHr(fn: Listener): () => void {
  listeners.add(fn);
  fn(snapshotHr());
  return () => listeners.delete(fn);
}

export function resetHrSession() {
  samples.length = 0;
  bpm = null;
  maxBpm = 0;
  emit();
}

function ingest(next: number) {
  if (next < 30 || next > 230) return;
  bpm = next;
  samples.push(next);
  if (samples.length > 4000) samples.splice(0, samples.length - 4000);
  if (next > maxBpm) maxBpm = next;
  emit();
}

function parseMeasurement(ev: Event) {
  const value = (ev.target as unknown as BleChar).value;
  if (!value) return;
  const flags = value.getUint8(0);
  const hr = flags & 0x1 ? value.getUint16(1, true) : value.getUint8(1);
  ingest(hr);
}

async function bindDevice(next: BleDevice) {
  device = next;
  deviceName = next.name || "Heart rate";
  device.addEventListener("gattserverdisconnected", () => {
    server = null;
    emit();
  });
  server = await next.gatt!.connect();
  const service = await server.getPrimaryService(HEART_RATE_SERVICE);
  const char = await service.getCharacteristic(HEART_RATE_MEASUREMENT);
  await char.startNotifications();
  char.addEventListener("characteristicvaluechanged", parseMeasurement);
  source = "ble";
  error = null;
  emit();
}

export async function connectBleHr(): Promise<HrSnapshot> {
  if (!bleHrSupported()) {
    error =
      "This browser can't talk to Bluetooth heart-rate sensors. Chrome/Edge on Android or desktop can. Apple Watch and AirPods Pro 3 need the native iOS app (HealthKit).";
    emit();
    throw new Error(error);
  }
  error = null;
  try {
    const nav = navigator as Navigator & {
      bluetooth: {
        requestDevice: (opts: unknown) => Promise<BleDevice>;
      };
    };
    const picked = await nav.bluetooth.requestDevice({
      filters: [{ services: [HEART_RATE_SERVICE] }],
      optionalServices: [HEART_RATE_SERVICE],
    });
    await bindDevice(picked);
    return snapshotHr();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not connect";
    if (/cancelled|canceled/i.test(msg)) {
      error = null;
      emit();
      throw err;
    }
    error = msg;
    emit();
    throw err;
  }
}

export async function disconnectHr() {
  try {
    server?.disconnect();
  } catch {
    /* already gone */
  }
  server = null;
  device = null;
  deviceName = null;
  source = null;
  bpm = null;
  emit();
}

/** Native HealthKit hook — no-op on web. Capacitor iOS build should replace this. */
export function nativeHrAvailable(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

import { supabase } from "@/integrations/supabase/client";

/** Offset between local clock and server clock (ms). serverTime ≈ Date.now() + offset */
let _offset = 0;
let _lastSync = 0;
const SYNC_INTERVAL = 15_000; // re-sync every 15s

export async function calibrateServerTime(): Promise<number> {
  try {
    const t0 = Date.now();
    const { data, error } = await supabase.functions.invoke("server-time");
    const t1 = Date.now();
    if (error || !data?.serverTime) return _offset;
    const rtt = t1 - t0;
    const serverNow = (data.serverTime as number) + rtt / 2;
    _offset = serverNow - t1;
    _lastSync = t1;
    return _offset;
  } catch {
    return _offset;
  }
}

/** Returns server-calibrated "now" in ms */
export function serverNow(): number {
  return Date.now() + _offset;
}

/** Returns offset in ms (positive = server ahead) */
export function getOffset(): number {
  return _offset;
}

/** Auto-sync: call calibrate periodically */
let _intervalId: ReturnType<typeof setInterval> | null = null;

export function startAutoSync() {
  if (_intervalId) return;
  calibrateServerTime();
  _intervalId = setInterval(calibrateServerTime, SYNC_INTERVAL);
}

export function stopAutoSync() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

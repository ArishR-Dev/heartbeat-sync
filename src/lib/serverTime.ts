
/** Returns browser-side "now" in ms */
export function serverNow(): number {
  return Date.now();
}

/** Returns offset (always 0 for local) */
export function getOffset(): number {
  return 0;
}

export async function calibrateServerTime(): Promise<number> {
  return 0;
}

export function startAutoSync() {}
export function stopAutoSync() {}

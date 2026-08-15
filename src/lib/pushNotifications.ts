const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

export async function registerPushSW(): Promise<ServiceWorkerRegistration | null> {
  if (isInIframe || isPreviewHost) return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  try {
    const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
    return reg;
  } catch (err) {
    console.warn("Push SW registration failed:", err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showLocalNotification(title: string, body: string) {
  if (Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: "/placeholder.svg",
        tag: "pookiewatch-schedule",
        renotify: true,
      } as NotificationOptions);
    }).catch(() => {
      new Notification(title, { body, icon: "/placeholder.svg" });
    });
  } else {
    new Notification(title, { body, icon: "/placeholder.svg" });
  }
}

/** Sync schedules to service worker's IndexedDB for background checking */
export function syncSchedulesToSW(schedules: Array<{ id: string; title: string; date: string; time: string }>) {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({
      type: "SYNC_SCHEDULES",
      schedules,
    });
  }).catch(() => {});
}

/** Tell service worker to check schedules now */
export function triggerSWCheck() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: "CHECK_NOW" });
  }).catch(() => {});
}

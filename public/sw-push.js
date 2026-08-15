// PookieWatch Push Notification Service Worker
// with IndexedDB schedule checking

const DB_NAME = "pookiewatch-schedules";
const STORE_NAME = "schedules";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getSchedules() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function removeSchedule(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);
}

// Check schedules periodically (every 30s when SW is active)
async function checkSchedules() {
  try {
    const schedules = await getSchedules();
    const now = Date.now();
    for (const s of schedules) {
      const target = new Date(`${s.date}T${s.time}`).getTime();
      if (target <= now && !s.notified) {
        await self.registration.showNotification("It's Watch Time! 🎬", {
          body: `Time to watch ${s.title} with your partner ❤️`,
          icon: "/placeholder.svg",
          badge: "/placeholder.svg",
          vibrate: [200, 100, 200],
          tag: `pookiewatch-${s.id}`,
          renotify: true,
          data: { url: self.location.origin + "/room" },
        });
        // Mark as notified
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        s.notified = true;
        store.put(s);
      }
    }
  } catch (e) {
    console.warn("SW schedule check failed:", e);
  }
}

// Push event from server
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "It's Watch Time! 🎬";
  const options = {
    body: data.body || "Time to watch with your partner ❤️",
    icon: "/placeholder.svg",
    badge: "/placeholder.svg",
    vibrate: [200, 100, 200],
    tag: "pookiewatch-schedule",
    renotify: true,
    data: { url: self.location.origin + "/room" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/room";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/room") && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// Message handler to sync schedules from main thread
self.addEventListener("message", (event) => {
  if (event.data?.type === "SYNC_SCHEDULES") {
    syncSchedulesToDB(event.data.schedules);
  }
  if (event.data?.type === "CHECK_NOW") {
    checkSchedules();
  }
});

async function syncSchedulesToDB(schedules) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    // Clear old entries
    store.clear();
    // Add current schedules
    for (const s of schedules) {
      store.put(s);
    }
  } catch (e) {
    console.warn("SW syncSchedulesToDB failed:", e);
  }
}

// Periodic check using a simple interval approach
setInterval(checkSchedules, 30000);

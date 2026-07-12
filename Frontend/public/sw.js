const CACHE_NAME = "chisto-pwa-v1"
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/vite.svg"
]

// Install SW & Cache Assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate SW
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch Handlers (Offline Fallback)
self.addEventListener("fetch", (e) => {
  // Only cache GET requests
  if (e.request.method !== "GET") return

  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        // Fallback for HTML page when offline
        if (e.request.headers.get("accept").includes("text/html")) {
          return caches.match("/index.html")
        }
      })
    })
  )
})

// Push Notifications Listener
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : { title: "Chisto Food Update", body: "Your order status has been updated!" }
  
  const options = {
    body: data.body,
    icon: "/vite.svg",
    badge: "/vite.svg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1"
    }
  }

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

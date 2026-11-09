// UNFNSHD service worker: phone notifications only. It does not cache pages or files, so a
// new version of the app always loads straight away.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { title: 'UNFNSHD', body: event.data && event.data.text() } }
  const title = data.title || 'UNFNSHD'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag,
    data: { url: data.url || '/' },
  }))
})

// Tapping a notification opens the app on the right screen (or focuses it if it is open).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data && event.notification.data.url ? event.notification.data.url : '/', self.location.origin).href
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of all) {
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus()
        if ('navigate' in c) return c.navigate(url)
        return
      }
    }
    return self.clients.openWindow(url)
  })())
})

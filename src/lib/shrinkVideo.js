// Shrinks a phone video in the browser before upload, so any normal clip fits under the
// storage limit (50 MB a file on the current Supabase plan). The clip is played once,
// silently, into a canvas at up to 1280 px on its long side and recorded at about
// 2.5 Mbps: a 30 second clip comes out around 10 MB. It takes as long as the clip runs.
// Sound is not kept (browsers only allow silent playback without a tap).

export const MAX_SECONDS = 120

function pickType() {
  if (typeof MediaRecorder === 'undefined') return null
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? null
}

export function canShrink() {
  return !!pickType() && typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype
}

// Resolves to a File (mp4 or webm). Rejects with Error('too_long' | 'unsupported' | 'unreadable').
export function shrinkVideo(file, onProgress) {
  return new Promise((resolve, reject) => {
    const type = pickType()
    if (!type || !canShrink()) { reject(new Error('unsupported')); return }
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url
    let recorder = null
    let done = false
    const finish = (err, out) => {
      if (done) return
      done = true
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      if (err) reject(err); else resolve(out)
    }

    video.onerror = () => finish(new Error('unreadable'))
    video.onloadedmetadata = () => {
      const duration = video.duration
      if (!isFinite(duration) || duration <= 0) { finish(new Error('unreadable')); return }
      if (duration > MAX_SECONDS) { finish(new Error('too_long')); return }
      const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2)
      canvas.height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2)
      const ctx = canvas.getContext('2d')
      const stream = canvas.captureStream(30)
      const chunks = []
      recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 2_500_000 })
      recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data) }
      recorder.onstop = () => {
        const base = type.split(';')[0]
        const ext = base === 'video/mp4' ? 'mp4' : 'webm'
        const name = (file.name || 'video').replace(/\.[^.]+$/, '') + '.' + ext
        finish(null, new File(chunks, name, { type: base }))
      }

      const draw = () => {
        if (done) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        onProgress?.(Math.min(0.99, video.currentTime / duration))
        if (!video.ended) {
          if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(draw)
          else requestAnimationFrame(draw)
        }
      }
      video.onended = () => { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), 150) }
      recorder.start(1000)
      video.play().then(draw).catch(() => { try { recorder.stop() } catch { /* already stopped */ } finish(new Error('unreadable')) })
    }
  })
}

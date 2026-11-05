// "Share your PB": draws a 1080 x 1920 story card (emerald, cream type, the open ring with
// its tan dot) on a canvas, previews it, and hands it to the phone's share sheet or saves
// it. Only the lift and the weight are on it: never body weight or photos.
import { useEffect, useState } from 'react'
import { Share2, Download } from 'lucide-react'
import { Sheet, Button } from '../ui'

const EMERALD = '#0B2B24'
const CREAM = '#F4EFE6'
const TAN = '#D6B98C'

// The open ring, like the logo: 320 degrees, gap at the top right, dot in the gap.
function drawRing(ctx, cx, cy, r, width, color, alpha, dotR) {
  const start = (-25 * Math.PI) / 180
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, r, start, start + (320 * Math.PI) / 180)
  ctx.stroke()
  ctx.restore()
  const a = (-45 * Math.PI) / 180
  ctx.fillStyle = TAN
  ctx.beginPath()
  ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), dotR, 0, Math.PI * 2)
  ctx.fill()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

async function drawPBStory({ exerciseName, value, unit, previous }) {
  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  try {
    await Promise.all([
      document.fonts.load("800 200px 'Baloo 2'"),
      document.fonts.load("700 40px 'Inter Variable'"),
    ])
  } catch {
    // Fonts not ready: the system font is used, the card still works.
  }
  const display = "'Baloo 2', 'Arial Rounded MT Bold', sans-serif"
  const body = "'Inter Variable', Inter, system-ui, sans-serif"

  ctx.fillStyle = EMERALD
  ctx.fillRect(0, 0, W, H)
  drawRing(ctx, W + 40, 860, 520, 150, CREAM, 0.12, 80)

  ctx.fillStyle = CREAM
  ctx.textBaseline = 'alphabetic'
  ctx.font = `800 300px ${display}`
  ctx.fillText('New', 64, 330)
  ctx.fillText('PB.', 64, 590)

  ctx.font = `700 52px ${body}`
  ctx.fillText(exerciseName, 72, 1290, W - 144)
  ctx.font = `800 260px ${display}`
  const num = String(value)
  ctx.fillText(num, 64, 1530)
  const numW = ctx.measureText(num).width
  ctx.font = `800 90px ${display}`
  ctx.fillText(` ${unit}`, 64 + numW, 1530)

  if (previous != null && previous !== '') {
    const up = Math.round((Number(value) - Number(previous)) * 10) / 10
    const chip = up > 0 ? `Up ${up} ${unit} since last time` : `Up from ${previous} ${unit}`
    ctx.font = `700 40px ${body}`
    const cw = ctx.measureText(chip).width + 64
    ctx.fillStyle = TAN
    roundRect(ctx, 72, 1590, cw, 76, 38)
    ctx.fill()
    ctx.fillStyle = EMERALD
    ctx.fillText(chip, 104, 1642)
  }

  // Footer: the logo, small, bottom left.
  drawRing(ctx, 112, 1800, 30, 14, CREAM, 1, 9)
  ctx.fillStyle = CREAM
  ctx.font = `800 54px ${display}`
  ctx.fillText('UNFNSHD', 168, 1822)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

export function ShareSheet({ pb, onClose }) {
  const [blob, setBlob] = useState(null)
  const [url, setUrl] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!pb) return undefined
    let cancelled = false
    let made = null
    drawPBStory(pb).then((b) => {
      if (cancelled || !b) return
      made = URL.createObjectURL(b)
      setBlob(b)
      setUrl(made)
    })
    return () => {
      cancelled = true
      if (made) URL.revokeObjectURL(made)
      setBlob(null)
      setUrl(null)
    }
  }, [pb])

  const file = blob ? new File([blob], 'unfnshd-pb.png', { type: 'image/png' }) : null
  const canShare = !!file && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })

  async function share() {
    if (!file) return
    setBusy(true)
    try {
      await navigator.share({ files: [file], title: 'New PB' })
    } catch (e) {
      if (e?.name !== 'AbortError') console.error('Share error:', e)
    } finally {
      setBusy(false)
    }
  }

  function save() {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = 'unfnshd-pb.png'
    a.click()
  }

  return (
    <Sheet
      open={!!pb}
      onClose={onClose}
      title="Share your PB"
      footer={
        <div className="flex gap-2.5">
          {canShare && <Button size="lg" className="flex-1" disabled={busy} onClick={share}><Share2 size={18} /> Share</Button>}
          <Button size="lg" variant={canShare ? 'secondary' : 'primary'} className="flex-1" disabled={!url} onClick={save}><Download size={18} /> Save image</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-[230px] aspect-[9/16] rounded-[22px] overflow-hidden bg-hero">
          {url && <img src={url} alt={`Story card: new PB, ${pb?.exerciseName}, ${pb?.value} ${pb?.unit}`} className="w-full h-full object-cover" />}
        </div>
        <p className="text-[14px] text-muted text-center">Shows the lift and the weight. Never your body weight or photos.</p>
      </div>
    </Sheet>
  )
}

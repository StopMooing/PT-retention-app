// Full-screen camera that reads a food barcode. iPhones have no built-in barcode reader
// for web apps, so this uses barcode-detector (ZXing compiled to WebAssembly). The engine
// file ships with the app and only downloads when the scanner opens. Typing the number
// works too, for when the camera is blocked or the label is crumpled.
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui'
import { isBarcode } from './barcode'

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('starting') // starting | scanning | blocked
  const [typed, setTyped] = useState('')

  useEffect(() => {
    let stream = null
    let timer = null
    let stopped = false
    ;(async () => {
      try {
        const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
          import('barcode-detector/ponyfill'),
          import('zxing-wasm/reader/zxing_reader.wasm?url'),
        ])
        prepareZXingModule({ overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) } })
        const detector = new BarcodeDetector({ formats: FORMATS })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (stopped) return
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        setStatus('scanning')
        const tick = async () => {
          if (stopped) return
          try {
            const codes = await detector.detect(video)
            const hit = codes.find((c) => isBarcode(c.rawValue))
            if (hit) {
              stopped = true
              navigator.vibrate?.(40)
              onResult(hit.rawValue)
              return
            }
          } catch { /* a frame that could not be read */ }
          timer = setTimeout(tick, 200)
        }
        tick()
      } catch (e) {
        console.error('Scanner error:', e)
        if (!stopped) setStatus('blocked')
      }
    })()
    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onResult])

  return (
    <div className="fixed inset-0 z-[80] bg-bg flex flex-col" role="dialog" aria-label="Scan a barcode">
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)]">
          <p className="h-9 px-3.5 rounded-full bg-surface/90 text-[15px] font-bold text-ink flex items-center">Scan a barcode</p>
          <button onClick={onClose} aria-label="Close scanner" className="w-11 h-11 rounded-full bg-surface/90 text-ink flex items-center justify-center"><X size={22} /></button>
        </div>
        {status !== 'blocked' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[78%] max-w-[340px] h-36 rounded-[20px] border-[3px] border-accent" />
          </div>
        )}
        {status === 'starting' && <p className="absolute left-1/2 -translate-x-1/2 bottom-6 h-8 px-3 rounded-full bg-surface/90 text-[13px] text-ink flex items-center whitespace-nowrap">Starting the camera...</p>}
        {status === 'scanning' && <p className="absolute left-1/2 -translate-x-1/2 bottom-6 h-8 px-3 rounded-full bg-surface/90 text-[13px] text-ink flex items-center whitespace-nowrap">Hold the barcode inside the box</p>}
        {status === 'blocked' && (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
            <p className="text-[15px] text-ink">The camera isn't available. Allow camera access for this app in your phone's settings, or type the number below.</p>
          </div>
        )}
      </div>
      <div className="shrink-0 bg-surface px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Or type the barcode number"
          value={typed}
          onChange={(e) => setTyped(e.target.value.replace(/[^0-9]/g, '').slice(0, 14))}
          className="flex-1 h-12 px-4 rounded-full border border-line-strong bg-bg text-ink placeholder:text-faint outline-none focus:border-accent"
        />
        <Button size="lg" disabled={!isBarcode(typed)} onClick={() => onResult(typed)}>Find</Button>
      </div>
    </div>
  )
}

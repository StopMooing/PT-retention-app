// Resources from the coach (and the global library). Reached from the profile sheet.
import { useState } from 'react'
import { FileText, Headphones, Globe, Play, BookOpen, ExternalLink } from 'lucide-react'
import { Card, Chip } from '../ui'
import { Overlay, BackHeader } from './common'
import { capitalise } from './foods'

const ICONS = { pdf: FileText, podcast: Headphones, article: Globe, video: Play, other: BookOpen }
const ACTION = { pdf: 'Open PDF', podcast: 'Listen', video: 'Watch' }
const cx = (...c) => c.filter(Boolean).join(' ')

export default function ResourcesPage({ resources, onBack }) {
  const [filter, setFilter] = useState('all')
  const types = ['all', ...new Set(resources.map((r) => r.type || 'other'))]
  const list = filter === 'all' ? resources : resources.filter((r) => (r.type || 'other') === filter)

  return (
    <Overlay>
      <BackHeader onBack={onBack} title="Resources" />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {types.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
            {types.map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={cx('h-9 px-3.5 rounded-full text-sm font-bold whitespace-nowrap', filter === t ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink')}>
                {t === 'all' ? 'All' : capitalise(t)}
              </button>
            ))}
          </div>
        )}
        {list.map((r) => {
          const Icon = ICONS[r.type] ?? ICONS.other
          const link = r.url || r.file_path
          return (
            <Card key={r.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0"><Icon size={19} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-ink">{r.title}</p>
                  {r.description && <p className="text-[13px] text-muted mt-0.5 leading-relaxed">{r.description}</p>}
                </div>
                <Chip>{capitalise(r.type || 'other')}</Chip>
              </div>
              {link && (
                <a
                  href={link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-10 rounded-full border border-line-strong text-sm font-bold text-ink hover:bg-surface-2"
                >
                  <ExternalLink size={15} /> {ACTION[r.type] || 'Open'}
                </a>
              )}
            </Card>
          )
        })}
      </div>
    </Overlay>
  )
}

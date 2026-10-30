// About the client: goal, injuries, private coach notes and progress photos.
import { useState } from 'react'
import { Flag, AlertCircle, FileText, Camera, Plus, Pencil } from 'lucide-react'
import { Button, EmptyState } from '../../ui'
import { Panel, TextArea } from './parts'
import { formatDate, relativeDay, firstName } from '../lib'

function EditableText({ title, icon, value, placeholder, emptyText, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setSaving(true)
    setError(null)
    const err = await onSave(draft)
    setSaving(false)
    if (err) setError(err)
    else setEditing(false)
  }

  return (
    <Panel
      title={title}
      icon={icon}
      action={!editing && (
        <Button variant="ghost" size="sm" onClick={() => { setDraft(value); setEditing(true) }}>
          <Pencil size={15} /> Edit
        </Button>
      )}
    >
      {editing ? (
        <>
          <TextArea rows={3} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
          {error && <p className="text-[13px] text-bad mt-2">{error}</p>}
          <div className="flex gap-2 mt-2.5">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving' : 'Save'}</Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </>
      ) : value ? (
        <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-[15px] text-muted">{emptyText}</p>
      )}
    </Panel>
  )
}

export default function NotesTab({ client, clientGoal, onSaveGoal, clientLimitations, onSaveLimitations, savedNotes, onSaveNote, progressPhotos }) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const name = firstName(client.full_name)

  async function saveNote() {
    setSaving(true)
    const ok = await onSaveNote(text)
    setSaving(false)
    if (ok) { setText(''); setAdding(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-3 lg:gap-4 items-start">
      <div className="space-y-3 lg:space-y-4 min-w-0">
        <Panel
          title="Coach notes"
          icon={FileText}
          sub="Only you see these"
          action={!adding && <Button variant="soft" size="sm" onClick={() => setAdding(true)}><Plus size={16} /> Add</Button>}
          padded={false}
        >
          {adding && (
            <div className="px-4 pb-4 pt-2">
              <TextArea rows={4} autoFocus placeholder={`A note about ${name}`} value={text} onChange={(e) => setText(e.target.value)} />
              <div className="flex gap-2 mt-2.5">
                <Button onClick={saveNote} disabled={saving || !text.trim()}>{saving ? 'Saving' : 'Save note'}</Button>
                <Button variant="ghost" onClick={() => { setAdding(false); setText('') }}>Cancel</Button>
              </div>
            </div>
          )}
          {savedNotes.length === 0 && !adding ? (
            <EmptyState title="No notes yet" body={`Keep track of injuries, life events and what motivates ${name}.`} />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {savedNotes.map((note, i) => (
                <li key={note.id ?? i} className="px-4 py-3.5">
                  <p className="text-[13px] text-muted mb-1">{formatDate(note.created_at)} · {relativeDay(note.created_at)}</p>
                  <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">{note.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Progress photos" icon={Camera} sub={progressPhotos.length ? String(progressPhotos.length) : undefined}>
          {progressPhotos.length === 0 ? (
            <p className="text-[15px] text-muted">Photos {name} uploads will show here.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {progressPhotos.map((photo) => (
                <figure key={photo.id}>
                  <img src={photo.photo_url} alt="" className="w-full aspect-square rounded-[14px] object-cover bg-surface-2" />
                  <figcaption className="text-xs text-muted mt-1">
                    {formatDate(photo.taken_date || photo.created_at, { day: 'numeric', month: 'short' })}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-3 lg:space-y-4 min-w-0">
        <EditableText title="Goal" icon={Flag} value={clientGoal} placeholder="For example, lose 10 kg by summer" emptyText="No goal set yet." onSave={onSaveGoal} />
        <EditableText title="Injuries and limitations" icon={AlertCircle} value={clientLimitations} placeholder="For example, left knee, avoid deep squats" emptyText="Nothing recorded." onSave={onSaveLimitations} />
      </div>
    </div>
  )
}

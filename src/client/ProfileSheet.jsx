// Profile and settings: photo, name, light or dark mode, resources, sign out.
import { useRef, useState } from 'react'
import { Camera, BookOpen, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from '../supabase'
import { Sheet, Avatar, ThemeSwitch, Button } from '../ui'

export default function ProfileSheet({ open, onClose, client, setClient, hasResources, onOpenResources }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !client) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop()
      const path = `${user.id}/profile.${ext}`
      const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path)
      await supabase.from('clients').update({ profile_photo_url: publicUrl }).eq('id', client.id)
      setClient((prev) => ({ ...prev, profile_photo_url: publicUrl }))
    } catch (err) { console.error(err) }
    finally { setUploading(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Profile">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="relative rounded-full shrink-0" aria-label="Change profile photo">
            <Avatar name={client.full_name} src={client.profile_photo_url} size={72} className={uploading ? 'animate-pulse' : ''} />
            <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-accent text-on-accent border-2 border-surface flex items-center justify-center">
              <Camera size={14} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <div className="min-w-0">
            <p className="text-[19px] font-bold text-ink truncate">{client.full_name}</p>
            {client.email && <p className="text-[13px] text-muted truncate">{client.email}</p>}
            <button onClick={() => fileRef.current?.click()} className="text-[13px] font-bold text-accent mt-1">{uploading ? 'Uploading...' : 'Change photo'}</button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink mb-2">Appearance</p>
          <ThemeSwitch />
        </div>

        {hasResources && (
          <button onClick={onOpenResources} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] border border-line hover:bg-surface-2 text-left">
            <span className="w-9 h-9 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0"><BookOpen size={18} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-bold text-ink">Resources</span>
              <span className="block text-[13px] text-muted">Guides and reading from your coach</span>
            </span>
            <ChevronRight size={18} className="text-faint" />
          </button>
        )}

        <Button
          variant="danger"
          block
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
        >
          <LogOut size={18} /> Sign out
        </Button>
      </div>
    </Sheet>
  )
}

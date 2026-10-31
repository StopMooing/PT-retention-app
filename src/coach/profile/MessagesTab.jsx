// Messages with this client, the same thread as the Messages inbox.
import { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, EmptyState } from '../../ui'
import Thread from '../messages/Thread'
import { firstName } from '../lib'

export default function MessagesTab({ client, userId }) {
  if (!client.user_id) {
    return (
      <Card>
        <EmptyState
          icon={MessageSquare}
          title="Messages start once they join"
          body={`${firstName(client.full_name)} can message you after they set up their account from the invite link.`}
        />
      </Card>
    )
  }
  return <ThreadCard client={client} userId={userId} />
}

// On a phone the profile header is tall, so the thread fills the screen between the top
// and tab bars and scrolls into view, keeping the composer visible.
function ThreadCard({ client, userId }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) ref.current?.scrollIntoView({ block: 'end' })
  }, [])
  return (
    <Card ref={ref} padded={false} className="overflow-hidden max-w-[760px] flex flex-col h-[calc(100dvh-152px)] min-h-[380px] scroll-mb-4 md:h-[min(640px,calc(100dvh-300px))]">
      <Thread clientId={client.id} userId={userId} clientName={client.full_name} className="flex-1" autoFocus />
    </Card>
  )
}

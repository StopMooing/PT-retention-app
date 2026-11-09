// Plays a coach's exercise video (src/lib/exerciseVideo.js).
import { youtubeId } from './exerciseVideo'

// The video itself: YouTube plays in a privacy-friendly embed, uploads in the phone's player.
export function ExerciseVideo({ media, className = '' }) {
  if (!media) return null
  const yt = media.kind === 'youtube' ? youtubeId(media.url) : null
  return (
    <div className={`relative w-full aspect-video rounded-[16px] overflow-hidden bg-hero ${className}`}>
      {yt ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1`}
          title="Exercise video"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video src={media.url} controls playsInline preload="metadata" className="absolute inset-0 w-full h-full object-contain" />
      )}
    </div>
  )
}

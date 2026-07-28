import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabasePublic } from './supabase'

function ScoreSelector({ value, onChange, label, hint }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-900 m-0">{label}</p>
        {hint && <p className="text-xs text-gray-400 m-0 mt-0.5">{hint}</p>}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-11 h-11 rounded-xl text-sm font-semibold border-2 transition-colors ${
              value === n
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between px-0.5">
        <span className="text-xs text-gray-300">Poor</span>
        <span className="text-xs text-gray-300">Excellent</span>
      </div>
    </div>
  )
}

export default function CheckInPage() {
  const { clientId } = useParams()
  const [client, setClient] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [trainingScore, setTrainingScore] = useState(null)
  const [energyScore, setEnergyScore] = useState(null)
  const [blocker, setBlocker] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchClient() {
      const { data, error } = await supabasePublic
        .rpc('get_checkin_client', { p_client_id: clientId })
        .single()
      if (error || !data) setNotFound(true)
      else setClient(data)
    }
    fetchClient()
  }, [clientId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!trainingScore || !energyScore) {
      setError('Please answer both score questions before submitting.')
      return
    }
    setError(null)
    setLoading(true)

    const payload = {
      client_id: clientId,
      training_score: trainingScore,
      energy_score: energyScore,
      blocker: blocker.trim() || null,
      submitted_at: new Date().toISOString(),
    }
    console.log('[CheckIn] clientId from useParams:', clientId)
    console.log('[CheckIn] client object fetched earlier:', client)
    console.log('[CheckIn] insert payload:', payload)

    const { error: insertError } = await supabasePublic
      .from('checkins')
      .insert(payload)
    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }
    setSubmitted(true)
    setLoading(false)
  }

  const firstName = client?.full_name?.split(' ')[0] ?? ''

  if (!client && !notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 m-0">Link not found</p>
          <p className="text-xs text-gray-400 mt-1">This check-in link isn't valid.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 m-0">Thanks, {firstName}!</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">Your check-in has been sent to your trainer. Keep up the great work.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-6 py-4">
          <span className="text-black font-bold text-lg tracking-tight">StopMooing</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 m-0">Weekly Check-in</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hey {firstName}, take 60 seconds to check in with your trainer.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <ScoreSelector
              value={trainingScore}
              onChange={setTrainingScore}
              label="How did your training go this week?"
              hint="1 = very poor · 5 = excellent"
            />

            <div className="border-t border-gray-100" />

            <ScoreSelector
              value={energyScore}
              onChange={setEnergyScore}
              label="How are your energy levels?"
              hint="1 = exhausted · 5 = feeling great"
            />

            <div className="border-t border-gray-100" />

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 m-0">Is there anything blocking you right now?</p>
                <p className="text-xs text-gray-400 m-0 mt-0.5">Injuries, motivation, schedule — anything your trainer should know.</p>
              </div>
              <textarea
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                placeholder="Optional — leave blank if nothing to report"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 m-0">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-sm font-semibold py-3 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting…' : 'Submit check-in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

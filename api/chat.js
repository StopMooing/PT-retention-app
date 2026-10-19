import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const MAX_MESSAGES = 30
const MAX_TOTAL_CHARS = 20000
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

// Best effort only. Each serverless instance has its own memory, so this blunts a
// rapid burst against one warm instance rather than limiting the whole deployment.
// A durable per-user limit belongs in the database and is a separate piece of work.
const recentCalls = new Map()

function rateLimited(userId) {
  const now = Date.now()
  const calls = (recentCalls.get(userId) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  if (calls.length >= RATE_LIMIT_MAX) {
    recentCalls.set(userId, calls)
    return true
  }
  calls.push(now)
  recentCalls.set(userId, calls)
  return false
}

const NUTRITION_PROMPT = `You are an expert nutritionist and chef. Help the user with meal ideas, recipes, and nutrition advice. Give practical, delicious suggestions. Keep advice evidence-based and actionable.

CRITICAL OUTPUT FORMAT: whenever you provide a meal, recipe, or full day meal plan, write your conversational answer first, then end your response with a single valid JSON object in exactly this shape (no markdown code fences around it, raw JSON as the last thing in the message):

{"title":"Plan name","meals":[{"name":"Meal name","meal_type":"breakfast","description":"Short description with key ingredients and rough amounts","calories":500,"protein_g":40,"carbs_g":50,"fats_g":15}]}

Rules:
- meal_type must be exactly one of: breakfast, lunch, dinner, snack
- A single meal idea is a meals array with ONE item. A full day plan has one item per meal (typically 3 to 5 items)
- calories, protein_g, carbs_g, fats_g must be numbers, not strings, and must be per-meal values (not day totals)
- For a full day plan, the per-meal calories must sum to approximately the requested daily target
- The JSON must be valid and must be the final thing in your message`

function buildWorkoutPrompt(lib) {
  const mainEx = lib.filter(e => !['warmup', 'cooldown', 'cardio'].includes(e.category))
  const warmups = lib.filter(e => e.category === 'warmup').map(e => e.name)
  const cooldowns = lib.filter(e => e.category === 'cooldown').map(e => e.name)
  const cardio = lib.filter(e => e.category === 'cardio').map(e => e.name)
  const byMuscle = {}
  mainEx.forEach(e => {
    const mg = e.muscle_group || 'Other'
    if (!byMuscle[mg]) byMuscle[mg] = []
    byMuscle[mg].push(e.name)
  })
  let libSection = ''
  if (mainEx.length > 0) {
    libSection = 'MAIN EXERCISE LIBRARY (choose working exercises ONLY from these, using the exact name as written):\n'
    Object.keys(byMuscle).sort().forEach(mg => {
      libSection += `${mg}: ${byMuscle[mg].join(', ')}\n`
    })
    libSection += `\nWARMUP options (only if a warmup is requested): ${warmups.join(', ') || 'none available'}\n`
    libSection += `COOLDOWN options (only if a cooldown is requested): ${cooldowns.join(', ') || 'none available'}\n`
    libSection += `CARDIO / CONDITIONING options (only if cardio or conditioning is requested): ${cardio.join(', ') || 'none available'}\n`
  }
  return `You are an expert personal trainer and strength coach building a single workout session.

${libSection}
PROGRAMMING RULES (follow exactly):
- Every workout serves ONE primary goal. Infer the goal from the user request. If ambiguous, default to hypertrophy.
- Rep ranges by goal: strength 3 to 6 reps; hypertrophy 6 to 12 reps; muscular endurance 15 to 20 plus reps; power 1 to 5 explosive reps.
- Rest by goal: strength 120 to 240 seconds; hypertrophy 60 to 90 seconds; endurance 30 to 60 seconds; power 120 to 180 seconds.
- Volume: every targeted muscle group gets 4 to 9 working sets in the session and never more than 9. Total session is 16 to 24 working sets across all exercises.
- Bias volume to the primary muscle of the session, near 9 sets. Secondary muscles get 4 to 6 sets.
- Order compound movements before isolation. Balance pushing and pulling where it makes sense.
- A session has 4 to 8 exercises. Never more than 8.
- Never prescribe heavy compounds like squats, deadlifts or bench press at high reps for a strength or power goal.
- Choose working exercises ONLY from the MAIN EXERCISE LIBRARY above, using the exact name as written. Never invent an exercise name. If you want a movement that is not listed, pick the closest one that IS listed.
- Do not include a warmup or cooldown unless the user explicitly asks. If asked, use only the WARMUP or COOLDOWN options above.
- Only include cardio or conditioning exercises if the user asks for cardio or conditioning, using the CARDIO options above.
- Notes are short, plain English coaching cues. No anatomy jargon. No em dashes.

OUTPUT FORMAT. Respond with ONLY a valid JSON object. No markdown, no backticks, no text before or after. Structure: {"title": "Upper Body Hypertrophy", "exercises": [{"name": "Barbell Bench Press", "sets": 4, "reps": "8-12", "rest_seconds": 90, "notes": "Control the descent"}]}. title is a short descriptive workout name. exercises is an array. name must be an exact library name as a string. sets is an integer. reps is a string like "8-12" or "5". rest_seconds is an integer in seconds. notes is a short cue string or empty string. Respond with ONLY the JSON object and nothing else.`
}

// Verifies the caller's Supabase session. Returns { user, supabase } or null.
async function requireUser(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  if (!token) return null
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return { user: data.user, supabase }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) {
    console.error('Missing required environment variables')
    return res.status(500).json({ error: 'Server is not configured' })
  }

  const auth = await requireUser(req)
  if (!auth) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  if (rateLimited(auth.user.id)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' })
  }

  const { mode, messages } = req.body || {}

  // The system prompt is built here, never accepted from the client.
  if (mode !== 'workout' && mode !== 'nutrition') {
    return res.status(400).json({ error: 'Unknown mode' })
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }
  if (messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: 'Conversation is too long. Please start a new chat.' })
  }
  let totalChars = 0
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return res.status(400).json({ error: 'Malformed message' })
    }
    totalChars += m.content.length
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    return res.status(400).json({ error: 'Conversation is too long. Please start a new chat.' })
  }

  let system
  if (mode === 'nutrition') {
    system = NUTRITION_PROMPT
  } else {
    // Fetched with the caller's own token, so row level security still applies.
    const { data: lib, error: libError } = await auth.supabase
      .from('exercises')
      .select('name, muscle_group, category')
    if (libError || !lib || lib.length === 0) {
      console.error('Exercise library load failed:', libError)
      return res.status(503).json({ error: 'Could not load the exercise library' })
    }
    system = buildWorkoutPrompt(lib)
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      // Logged server side only. Upstream errors are not echoed to the caller.
      console.error('Anthropic API error:', response.status, await response.text())
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    return res.status(200).json({ text })
  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

import { Link } from 'react-router-dom'

const problems = [
  "A client cancels out of nowhere. You thought everything was fine.",
  "You're too busy to chase everyone. Some clients just go quiet.",
  "By the time you notice someone drifting, it's already too late.",
]

const solutions = [
  {
    title: "Weekly check-ins on autopilot",
    desc: "Send each client a 60-second check-in link. They answer 3 questions. You get the data.",
  },
  {
    title: "Green, amber, red at a glance",
    desc: "Your dashboard shows every client's engagement status in real time. No guessing.",
  },
  {
    title: "Step in at exactly the right moment",
    desc: "Get alerted the moment a client starts drifting. Reach out before they cancel.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-black font-bold text-lg tracking-tight">StopMooing</span>
          <Link
            to="/login"
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 sm:py-32 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight max-w-3xl">
            Stop losing clients you never saw coming.
          </h1>
          <p className="text-lg text-gray-500 mt-6 max-w-2xl leading-relaxed">
            StopMooing helps personal trainers spot disengaged clients weeks before they cancel — so you can step in, save the relationship, and protect your income.
          </p>
          <div className="flex flex-wrap gap-3 mt-10">
            <Link
              to="/signup"
              className="bg-black text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors"
            >
              Start for free
            </Link>
            <Link
              to="/login"
              className="bg-white text-black text-sm font-semibold px-6 py-3 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-12 tracking-tight">
            Every PT knows this feeling.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {problems.map((text, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-14 tracking-tight max-w-xl leading-snug">
            Know exactly who needs your attention — before it's too late.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {solutions.map((s, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-black">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-8">
            Ready to stop the churn?
          </h2>
          <Link
            to="/signup"
            className="inline-block bg-white text-black text-sm font-semibold px-8 py-3.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="text-black font-bold text-base tracking-tight">StopMooing</span>
          <p className="text-xs text-gray-400 m-0">Built for personal trainers.</p>
        </div>
      </footer>

    </div>
  )
}

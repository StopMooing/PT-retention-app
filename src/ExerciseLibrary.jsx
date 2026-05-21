import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { X, Edit3, Check, ChevronRight, Plus, Search } from 'lucide-react'

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body', 'Other',
]

const MUSCLE_CHIP = {
  Chest:        { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  Back:         { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  Shoulders:    { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  Biceps:       { bg: 'bg-pink-50',    text: 'text-pink-700',    dot: 'bg-pink-500'    },
  Triceps:      { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  Legs:         { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  Glutes:       { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500'    },
  Core:         { bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-500'    },
  Cardio:       { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
  'Full Body':  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Other:        { bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400'    },
}

function MuscleChip({ group, size = 'sm' }) {
  const cfg = MUSCLE_CHIP[group] ?? MUSCLE_CHIP.Other
  const textSize = size === 'lg' ? 'text-sm px-3 py-1' : 'text-[11px] px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${cfg.bg} ${cfg.text} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {group}
    </span>
  )
}

function ExerciseDetailModal({ exercise, userId, onClose, onSave }) {
  const isOwn = !exercise.is_global && exercise.created_by === userId
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(exercise.name)
  const [editMuscle, setEditMuscle] = useState(exercise.muscle_group)
  const [editInstructions, setEditInstructions] = useState(exercise.instructions ?? '')
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  async function handleSave() {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('exercises')
        .update({
          name: editName.trim(),
          muscle_group: editMuscle,
          instructions: editInstructions.trim() || null,
        })
        .eq('id', exercise.id)
      if (error) throw error
      onSave({ ...exercise, name: editName.trim(), muscle_group: editMuscle, instructions: editInstructions.trim() || null })
      setEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const cfg = MUSCLE_CHIP[exercise.muscle_group] ?? MUSCLE_CHIP.Other

  return (
    <>
      <div
        className="fixed inset-0 z-50 transition-opacity duration-250"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-250"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b border-gray-100 ${cfg.bg}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{exercise.name}</h2>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {editing ? (
                  <select
                    value={editMuscle}
                    onChange={e => setEditMuscle(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                  >
                    {MUSCLE_GROUPS.filter(g => g !== 'All').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <MuscleChip group={exercise.muscle_group} size="lg" />
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  exercise.is_global
                    ? 'bg-white/70 text-gray-500'
                    : 'bg-white/70 text-emerald-600'
                }`}>
                  {exercise.is_global ? 'Global' : 'Custom'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isOwn && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="w-8 h-8 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center transition"
                >
                  <Edit3 size={14} className="text-gray-600" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center transition text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Instructions */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">How To Perform</h3>
            {editing ? (
              <textarea
                rows={8}
                value={editInstructions}
                onChange={e => setEditInstructions(e.target.value)}
                placeholder="Describe how to perform this exercise..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
              />
            ) : exercise.instructions ? (
              <div className="bg-gray-50 rounded-xl px-5 py-4">
                <p className="text-sm text-gray-700 leading-relaxed">{exercise.instructions}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-300 italic">No instructions added yet.</p>
            )}
          </div>

          {/* Muscle group info */}
          {!editing && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Muscle Group</h3>
              <div className={`rounded-xl px-5 py-4 ${cfg.bg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                  <span className={`text-sm font-semibold ${cfg.text}`}>{exercise.muscle_group}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tips section for global exercises */}
          {!editing && exercise.is_global && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Coaching Tips</h3>
              <div className="space-y-2">
                {getCoachingTips(exercise.name, exercise.muscle_group).map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className={`w-5 h-5 rounded-full ${cfg.dot} flex items-center justify-center shrink-0 mt-0.5`}>
                      <span className="text-white text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {editing ? (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              onClick={() => { setEditing(false); setEditName(exercise.name); setEditMuscle(exercise.muscle_group); setEditInstructions(exercise.instructions ?? '') }}
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editName.trim()}
              className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleClose}
              className="w-full py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function getCoachingTips(exerciseName, muscleGroup) {
  const specific = {
    // BICEPS
    'Barbell Bicep Curl': ['Keep elbows pinned to your sides — any forward drift reduces bicep tension.', 'Supinate your wrist fully at the top for maximum peak contraction.', 'Lower the bar in 3 seconds for greater hypertrophic stimulus.'],
    'Dumbbell Bicep Curl': ['Rotate your palms outward as you curl for full supination and bicep activation.', 'Avoid swinging — momentum reduces the stimulus on the bicep.', 'Pause briefly at the top and squeeze before lowering.'],
    'Alternating Dumbbell Curl': ['Focus on one arm fully completing its rep before the other begins.', 'Keep the non-working arm still at your side — no pre-tensing.', 'Control the eccentric on each arm independently.'],
    'Hammer Curl': ['Neutral grip shifts emphasis from biceps brachii to brachialis and brachioradialis.', 'Keep wrist straight and locked throughout — no deviation.', 'The hammer curl builds arm thickness that standard curls do not address.'],
    'Incline Dumbbell Curl': ['The inclined position creates a stretched start position that recruits the long head maximally.', 'Let arms hang completely straight at the bottom before each rep.', 'Do not let elbows drift forward — keep upper arms vertical throughout.'],
    'Concentration Curl': ['Press your elbow firmly against your inner thigh to eliminate all momentum.', 'Rotate the wrist slightly outward at the top for peak bicep contraction.', 'This is a finish exercise — lighter weight with perfect form outperforms heavy sloppy reps.'],
    'Preacher Curl (Barbell)': ['Lower to full extension at the bottom for maximum stretch on the bicep.', 'The pad removes momentum entirely — do not bounce at the bottom.', 'Keep upper arms flat against the pad throughout the full movement.'],
    'Preacher Curl (Dumbbell)': ['Use a supinating motion as you curl for greater bicep activation.', 'Full lockout at the bottom is key to the preacher curl\'s effectiveness.', 'Single arm allows greater range of motion and focus than barbell version.'],
    'EZ Bar Curl': ['The angled grip reduces wrist stress compared to straight bar.', 'Still supinate as much as the bar allows at the top.', 'EZ bar allows slightly heavier loading due to wrist comfort.'],
    'Cable Bicep Curl': ['Cable provides constant tension unlike free weights which have zero tension at bottom.', 'Stand close to the stack to maintain tension at the bottom of the movement.', 'Perfect for high rep burnout sets due to consistent tension profile.'],
    'Drag Curl': ['Elbows travel back behind the body as you drag the bar up your torso.', 'This movement pattern isolates the long head of the bicep uniquely.', 'The bar should stay in contact or very close to your body throughout.'],
    'Bayesian Curl': ['Standing away from the cable with arm behind hip creates maximum long head stretch.', 'This is arguably the best single bicep exercise for long head development.', 'Use lighter weight than standard curls — the stretched position is demanding.'],
    'Zottman Curl': ['Curl up with supinated grip, rotate to pronated at the top, lower overhand.', 'This single exercise trains both the concentric and eccentric in different planes.', 'Slow the overhand lowering phase to 3-4 seconds for maximum brachioradialis work.'],
    // TRICEPS
    'Close Grip Bench Press': ['Use a grip just inside shoulder width — too narrow increases wrist strain.', 'Keep elbows tucked at 45 degrees, not flared wide or pinned to sides.', 'Touch the bar to your lower chest, not upper, for full tricep range.'],
    'Tricep Pushdown (Straight Bar)': ['Pin elbows to your sides and keep them there for the entire set.', 'Achieve full lockout at the bottom — do not stop short.', 'Lean very slightly forward to allow a better line of pull.'],
    'Tricep Pushdown (Rope)': ['Split the rope ends apart at the bottom for an extra inch of contraction.', 'The rope allows a more natural wrist position than a straight bar.', 'Keep elbows fixed — only your forearms should move.'],
    'Skull Crusher (Barbell)': ['Lower the bar to your forehead or slightly behind your head for greater stretch.', 'Keep upper arms perfectly vertical throughout — no rocking back and forth.', 'Combine with close grip press as a superset for intense tricep stimulus.'],
    'Overhead Tricep Extension (Dumbbell)': ['Overhead position places the long head of the tricep in a fully stretched state.', 'Keep upper arms close to your head and pointed directly at the ceiling.', 'The long head cannot be fully trained without an overhead component in your program.'],
    'Tricep Dip (Parallel Bars)': ['Keep torso upright to emphasise triceps over chest.', 'Lock out fully at the top of each rep.', 'Add weight via belt or dumbbell between legs once bodyweight becomes easy.'],
    'Kickback (Dumbbell)': ['Upper arm must be parallel to floor throughout — any drop reduces tricep isolation.', 'Full lockout at the back is essential — do not stop at 90 degrees.', 'Best used as a finishing exercise with lighter weight and strict form.'],
    // CHEST
    'Barbell Bench Press': ['Retract and depress your scapula before unracking — this protects your shoulders.', 'Lower the bar to your mid-chest with elbows at 45-75 degrees from your torso.', 'Drive your feet into the floor and create full body tension throughout the press.'],
    'Dumbbell Bench Press': ['Dumbbells allow greater range of motion than barbell — use it fully.', 'Press the dumbbells slightly toward each other at the top to increase pec activation.', 'Lower dumbbells until your upper arms are below parallel to the floor.'],
    'Incline Barbell Bench Press': ['Set the bench to 30-45 degrees — higher than this becomes a shoulder press.', 'The bar should touch your upper chest, not your neck.', 'Upper chest is often undertrained — prioritise incline work for complete chest development.'],
    'Cable Chest Fly (Low to High)': ['Low to high cable path specifically recruits the clavicular (upper) pec fibres.', 'Maintain a slight bend in the elbows throughout — do not let them straighten.', 'Think of hugging a large tree rather than a pressing motion.'],
    'Dumbbell Chest Fly': ['This is a stretch exercise — the eccentric lowering provides the stimulus.', 'Never allow elbows to fully extend — maintain a consistent bend throughout.', 'Lower until you feel a deep chest stretch, not pain in the shoulder joint.'],
    'Push Up': ['Body must remain in a perfectly straight line from head to heels throughout.', 'Lower chest to within one inch of the floor for full range of motion.', 'Tempo matters — 2 seconds down, pause, 1 second up for hypertrophy focus.'],
    // BACK
    'Pull Up': ['Initiate by depressing and retracting the scapula before bending the elbows.', 'Drive elbows toward your back pockets rather than thinking about pulling with hands.', 'Achieve full hang at the bottom with arms completely straight between reps.'],
    'Lat Pulldown (Wide Grip)': ['Lean back slightly 10-15 degrees and pull to your upper chest.', 'Drive elbows down and back — think of putting them in your back pockets.', 'Avoid pulling behind the neck which stresses the cervical spine.'],
    'Barbell Row (Bent Over)': ['Maintain a flat back at 45 degrees — do not round the lumbar spine.', 'Row to your lower abdomen or navel, not your chest, for lat emphasis.', 'Initiate the row by retracting the scapula before bending the elbow.'],
    'Dumbbell Row (Single Arm)': ['Allow the dumbbell to hang fully at the bottom for complete lat stretch.', 'Row to your hip, not your armpit, for maximum lat activation.', 'Brace your core hard against the bench to protect the lower back.'],
    'Seated Cable Row (Close Grip)': ['Sit tall and initiate by squeezing shoulder blades together before pulling.', 'Row to your navel with elbows traveling close to your sides.', 'Pause with shoulder blades fully retracted at the end range for maximum trap and rhomboid activation.'],
    'Face Pull': ['Pull to your face level with hands ending beside your ears.', 'Externally rotate at the end of the movement — this is the key part for shoulder health.', 'Face pulls are essential for shoulder health and should be in every program.'],
    'Straight Arm Pulldown': ['Keep arms completely straight throughout — this isolates the lats purely.', 'Pull down until your hands are at your hips, not just chest height.', 'This is one of the best exercises for feeling the lats work if you struggle with mind-muscle connection.'],
    // SHOULDERS
    'Barbell Overhead Press': ['Press the bar in a straight vertical line, not forward.', 'Brace your core and glutes hard to protect the lumbar spine under load.', 'Allow the bar to pass your face by moving your head back slightly as it passes.'],
    'Dumbbell Shoulder Press': ['Dumbbells allow a more natural pressing arc than a barbell.', 'Do not lock out aggressively at the top — keep slight tension in the shoulders.', 'Lower dumbbells to ear height for full range of motion.'],
    'Arnold Press': ['The rotational component of the Arnold press recruits all three deltoid heads.', 'Move smoothly through the rotation — do not rush the bottom position.', 'Slower tempo on the way down increases time under tension for the anterior delt.'],
    'Dumbbell Lateral Raise': ['Lead with your elbows, not your hands — this shifts emphasis to the lateral delt.', 'Raise to shoulder height only — above this the traps take over.', 'A slight forward lean of the torso (10-15 degrees) improves lateral delt positioning.'],
    'Bent Over Rear Delt Fly': ['Hinge forward until torso is almost parallel to the floor for true rear delt isolation.', 'Lead with your elbows, raising arms out to your sides.', 'Rear delts are typically undertrained — include this in every upper body session.'],
    'Upright Row (Barbell)': ['Use a wider grip (just outside shoulder width) to reduce impingement risk.', 'Pull elbows up and out — they should travel higher than your wrists.', 'Stop when elbows reach shoulder height — pulling higher increases shoulder impingement risk.'],
    'Shrug (Barbell)': ['Shrug straight up — do not roll your shoulders forward or backward.', 'Hold the contracted position at the top for 1-2 seconds for maximum trap activation.', 'Use straps if grip is the limiting factor for heavy shrugs.'],
    // LEGS
    'Back Squat': ['Brace your core hard before descending — create a rigid trunk.', 'Push your knees out in line with your toes throughout the entire movement.', 'Drive your hips forward to stand, not just your back — this protects the lumbar spine.'],
    'Front Squat': ['The front rack position requires the bar to rest on your front delts, not your hands.', 'Keeping your torso upright is essential — if you tip forward the bar will roll off.', 'Front squats develop quad strength and upper back stability simultaneously.'],
    'Goblet Squat': ['Hold the dumbbell or kettlebell close to your chest to act as a counterbalance.', 'Use the weight to pry your knees open at the bottom for hip opener benefit.', 'Perfect for learning squat mechanics before loading a barbell.'],
    'Romanian Deadlift (Barbell)': ['Push your hips back, do not just bend your torso forward.', 'Maintain the bar close to your legs throughout the entire movement.', 'Stop lowering when you feel a strong hamstring stretch, not when the bar reaches the floor.'],
    'Romanian Deadlift (Dumbbell)': ['Allow the dumbbells to travel down the front of your legs for a natural path.', 'Soft bend in the knees throughout, but knees should not travel forward.', 'Drive your hips forward forcefully to return to standing.'],
    'Bulgarian Split Squat': ['Front foot should be far enough forward that your shin is vertical at the bottom.', 'Lower straight down rather than forward to keep tension on the glute and quad.', 'This is an extremely difficult exercise — start with bodyweight only and progress slowly.'],
    'Leg Press': ['Do not allow your lower back to round off the pad at the bottom.', 'Foot placement determines emphasis: high wide feet for glutes, low narrow for quads.', 'Full range of motion is critical — short reps are ineffective.'],
    'Leg Extension': ['Leg extensions are best used for pre-exhaustion or finishing sets, not as primary quad work.', 'Pause briefly at full extension to ensure the quad is fully contracted.', 'Control the eccentric — do not let the weight drop back down.'],
    'Leg Curl (Lying)': ['Point your toes slightly during the curl for greater bicep femoris activation.', 'Full contraction at the top is the key goal — curl until the pad touches your glutes.', 'Avoid lifting your hips off the pad during the movement.'],
    'Hip Thrust (Barbell)': ['Drive through the entire foot, not just heels, for maximum glute activation.', 'Posterior pelvic tilt at the top (tuck pelvis under) increases glute activation significantly.', 'Pad the bar or use a barbell pad — discomfort at the hip crease will limit your performance.'],
    'Glute Bridge': ['Press your lower back gently toward the floor at the top of each rep.', 'Drive knees slightly outward to activate glute medius alongside glute maximus.', 'Add a resistance band above the knees to increase glute medius demand.'],
    'Hip Thrust (Dumbbell)': ['Hold the dumbbell vertically on your hip crease, not balanced horizontally.', 'Drive your hips to a fully extended position at the top.', 'Single leg variation is excellent for identifying and correcting glute imbalances.'],
    'Deadlift': ['The setup is everything in the deadlift — take time to position correctly before each pull.', 'Push the floor away from you rather than thinking about pulling the bar up.', 'Keep the bar in contact with or very close to your legs throughout the entire pull.'],
    'Deadlift (Conventional)': ['The bar should be over your mid-foot (about 1 inch from shins) when you set up.', 'Take the slack out of the bar before initiating the pull to avoid jerking.', 'Lock out by squeezing glutes and driving hips forward, not by leaning back aggressively.'],
    'Sumo Deadlift': ['Setup with the bar over your mid-foot and shins close to vertical.', 'Push your knees out hard throughout the entire pull.', 'The sumo stance places greater demand on the adductors and glutes than conventional.'],
    'Kettlebell Swing': ['This is a hip hinge, not a squat — hinge aggressively backward, not down.', 'The power comes from the hip snap, not from your arms swinging the bell.', 'Keep your lats engaged throughout to protect the lower back.'],
    // CORE
    'Plank': ['Push the floor away with your forearms to maintain full shoulder engagement.', 'Squeeze your glutes and quads — your core does not work in isolation.', 'If your hips are sagging or elevated, reduce the duration until form is corrected.'],
    'Ab Wheel Rollout': ['Start from kneeling and only progress to standing when full range is mastered.', 'Brace your core hard before rolling out — losing this at the bottom risks lower back injury.', 'Pull back in with your lats and abs working together.'],
    'Pallof Press': ['The value is in resisting rotation, not creating it — the goal is to stay still.', 'Press slowly out and hold for 2 seconds before returning.', 'Step further from the cable to increase the rotational demand.'],
    'Cable Crunch': ['Pull through the abs, not by pulling with your arms.', 'Allow your lower back to round fully at the bottom for complete abdominal contraction.', 'Heavier loads with strict form outperform light loads with excessive momentum.'],
    'Hanging Leg Raise': ['Avoid swinging at the bottom by using a controlled leg lowering each rep.', 'For true lower ab work, tilt the pelvis posteriorly as you raise your legs.', 'Bent knee version is the correct regression before progressing to straight leg.'],
    'Dead Bug': ['Press your lower back hard into the floor throughout the entire movement.', 'Move the opposite arm and leg simultaneously and smoothly.', 'This is one of the safest and most effective core stability exercises available.'],
    // FULL BODY
    'Thruster': ['The transition from squat to press must be seamless — use the upward momentum from the squat.', 'Keep your core braced throughout the entire movement.', 'A strong front rack position is essential — bar rests on shoulders, not hands.'],
    'Turkish Get Up': ['Move slowly and deliberately — speed is your enemy on this exercise.', 'Keep your eyes on the kettlebell at all times throughout the entire sequence.', 'Master each position separately before attempting a full fluid movement.'],
    'Farmers Walk': ['Walk tall with shoulders back and down, not hunched forward.', 'Take short, controlled steps — do not let the weights sway your gait.', 'Grip the handles tightly and brace your core for the entire distance.'],
    // CARDIO
    'Treadmill Run': ['Land with a midfoot strike under your centre of mass, not a heel strike in front.', 'Keep your torso upright with a slight forward lean from the ankles, not the waist.', 'Cadence of 170-180 steps per minute is associated with reduced injury risk.'],
    'Rowing Machine': ['Drive sequence: legs 60 percent, lean back 20 percent, arms 20 percent on each stroke.', 'Do not round your lower back at the catch position — maintain lumbar curve.', 'A damper setting of 4-6 typically provides the most efficient rowing experience.'],
    'Stationary Bike': ['Set saddle height so there is a slight bend at the knee at the bottom of the pedal stroke.', 'Aim for 80-100 RPM for cardiovascular work — higher cadence is easier on the knees.', 'Engage your core and avoid rocking your hips side to side with each pedal stroke.'],
    'Sprints': ['Drive your knees up and pump your arms hard during max effort sprints.', 'Full recovery between sprint efforts is essential for true sprint quality.', 'Start from a walk or jog before building to max effort to reduce injury risk.'],
  }

  if (specific[exerciseName]) return specific[exerciseName]

  const defaults = {
    Biceps: ['Keep elbows pinned to your sides throughout the movement.', 'Control the lowering phase for greater hypertrophic stimulus.', 'Squeeze at the top of the movement before lowering.'],
    Triceps: ['Achieve full lockout at the end range of each rep.', 'Keep upper arms still and only move at the elbow joint.', 'The long head of the tricep requires overhead work to be fully trained.'],
    Chest: ['Retract and depress your scapula before pressing to protect your shoulders.', 'Control the eccentric for greater chest development.', 'Full range of motion is essential for complete pec development.'],
    Back: ['Initiate all pulling movements by engaging the scapula first.', 'Drive elbows, not hands, toward your hips for better lat engagement.', 'Achieve full stretch at the top of every pulling movement.'],
    Shoulders: ['Lead with elbows on lateral raises for lateral delt emphasis.', 'Rear delt work is essential for shoulder health and posture.', 'Keep traps relaxed during pressing to ensure delt recruitment.'],
    Legs: ['Push knees out in line with toes on all squat pattern movements.', 'Drive through the full foot, not just the heel.', 'Full range of motion before adding load.'],
    Glutes: ['Squeeze glutes hard at full hip extension and hold briefly.', 'Posterior pelvic tilt at the top of hip movements increases glute activation.', 'Include both hip thrust and hip hinge patterns for complete glute development.'],
    Core: ['Brace your core by creating intra-abdominal pressure before each movement.', 'Anti-rotation exercises are as important as flexion movements.', 'Quality of movement always takes priority over number of reps.'],
    Cardio: ['Work within your target heart rate zone for the desired training outcome.', 'Low impact options reduce injury risk while maintaining cardiovascular benefit.', 'Consistency over intensity for long term cardiovascular adaptation.'],
    'Full Body': ['Prioritise compound movements early in sessions when energy is highest.', 'Focus on movement quality over load under fatigue.', 'Full body movements have high metabolic demand - manage rest periods accordingly.'],
  }

  return defaults[muscleGroup] ?? [
    'Focus on controlled movement through full range of motion.',
    'Progressive overload is the key driver of adaptation - track your weights.',
    'Warm up the target muscle group before working sets.',
  ]
}

export default function ExerciseLibrary({ user }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', muscle_group: 'Chest', instructions: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [selectedExercise, setSelectedExercise] = useState(null)

  async function fetchExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`is_global.eq.true,created_by.eq.${user.id}`)
      .order('name', { ascending: true })
    if (!error && data) setExercises(data)
    setLoading(false)
  }

  useEffect(() => { fetchExercises() }, [user.id])

  const filtered = exercises
    .filter(e => filter === 'All' || e.muscle_group === filter)
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError('')
    const { error } = await supabase.from('exercises').insert({
      name: form.name.trim(),
      muscle_group: form.muscle_group,
      instructions: form.instructions.trim() || null,
      created_by: user.id,
      is_global: false,
    })
    setSaving(false)
    if (error) { setSaveError('Something went wrong. Please try again.'); return }
    setForm({ name: '', muscle_group: 'Chest', instructions: '' })
    setShowForm(false)
    fetchExercises()
  }

  function handleSaveEdit(updated) {
    setExercises(prev => prev.map(e => e.id === updated.id ? updated : e))
    setSelectedExercise(updated)
  }

  const customCount = exercises.filter(e => !e.is_global && e.created_by === user.id).length

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          userId={user.id}
          onClose={() => setSelectedExercise(null)}
          onSave={handleSaveEdit}
        />
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
            <p className="text-sm text-gray-400 mt-1">
              {exercises.length} exercises · {customCount} custom
            </p>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setSaveError('') }}
            className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
          >
            <Plus size={15} /> Add Exercise
          </button>
        </div>

        {/* Add exercise form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900">New Exercise</h2>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exercise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barbell Bench Press"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Muscle Group</label>
                <select
                  value={form.muscle_group}
                  onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {MUSCLE_GROUPS.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Instructions <span className="text-gray-300 font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Describe how to perform this exercise..."
                  value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                />
              </div>
              {saveError && <p className="sm:col-span-2 text-xs text-red-500">{saveError}</p>}
              <div className="sm:col-span-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-100 transition font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Exercise'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3 mb-6">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
          />
          {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>}
        </div>

        {/* Muscle group filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MUSCLE_GROUPS.map(group => {
            const cfg = MUSCLE_CHIP[group]
            const isActive = filter === group
            return (
              <button
                key={group}
                onClick={() => setFilter(group)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  isActive
                    ? group === 'All'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : `${cfg?.bg} ${cfg?.text} border-transparent`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {group}
              </button>
            )
          })}
        </div>

        {/* Results count */}
        {(search || filter !== 'All') && (
          <p className="text-sm text-gray-400 mb-4">
            {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
            {filter !== 'All' && ` in ${filter}`}
            {search && ` matching "${search}"`}
          </p>
        )}

        {/* Exercise grid */}
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading exercises...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-gray-900">No exercises found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? `No results for "${search}"` : `No ${filter} exercises yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(exercise => {
              const cfg = MUSCLE_CHIP[exercise.muscle_group] ?? MUSCLE_CHIP.Other
              const isOwn = !exercise.is_global && exercise.created_by === user.id
              return (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise)}
                  className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:border-gray-300 hover:shadow-md transition-all duration-150 group flex flex-col gap-3"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 leading-snug flex-1">{exercise.name}</p>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition shrink-0 mt-0.5" />
                  </div>

                  {/* Muscle chip */}
                  <MuscleChip group={exercise.muscle_group} />

                  {/* Instructions preview */}
                  {exercise.instructions ? (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{exercise.instructions}</p>
                  ) : (
                    <p className="text-xs text-gray-300 italic">No instructions added.</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-50">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isOwn ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isOwn ? '✦ Custom' : 'Global'}
                    </span>
                    <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition">Tap to view →</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

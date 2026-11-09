// Which drawing each library exercise uses, by exact name: [move, kit, muscles]. Kit is
// barbell, smith, dumbbell (one in each hand), goblet (one weight held in both hands),
// kettlebell, cable, band or none. Muscles default to the move's own. An exercise that is
// not listed gets no drawing: better nothing than a wrong picture. Every entry here was
// checked frame by frame (tools/movement/sheet2.mjs).
export const LIBRARY = {}

export function drawingFor(name) {
  const hit = LIBRARY[String(name || '').trim().toLowerCase()]
  return hit ? { move: hit[0], kit: hit[1], work: hit[2] } : null
}

// Adds entries: add(move, kit, muscles or null, ...names)
function add(move, kit, work, ...names) {
  for (const n of names) LIBRARY[n.toLowerCase()] = [move, kit, work]
}

// Legs
add('backSquat', 'barbell', null, 'Back Squat', 'Pause Squat')
add('backSquat', 'smith', null, 'Smith Machine Squat')
add('frontSquat', 'barbell', null, 'Front Squat')
add('frontSquat', 'band', ['quads', 'glutes'], 'Banded Squat')
add('gobletSquat', 'goblet', null, 'Goblet Squat')
add('dbSquat', 'dumbbell', null, 'Dumbbell Squat')
add('airSquat', 'none', null, 'Bodyweight Squat')
add('thruster', 'barbell', null, 'Thruster')
add('thruster', 'dumbbell', null, 'Dumbbell Thruster')
add('splitSquat', 'none', null, 'Bulgarian Split Squat')
add('lunge', 'none', null, 'Reverse Lunge', 'Lunge (Stationary)', 'Lunge (Walking)')
add('stepUp', 'none', null, 'Step Up')
add('legPress', 'none', null, 'Leg Press', 'Leg Press (Narrow Stance)', 'Leg Press (Wide Stance)')
add('legExtension', 'none', null, 'Leg Extension')
add('legExtensionSingle', 'none', null, 'Single Leg Extension')
add('legCurlSeated', 'none', null, 'Leg Curl (Seated)')
add('legCurlLying', 'none', null, 'Leg Curl (Lying)')
add('calfRaise', 'none', null, 'Standing Calf Raise', 'Calf Raise with Pause', 'Eccentric Calf Raise')
add('seatedCalf', 'none', null, 'Seated Calf Raise')

// Hips
add('hipThrust', 'barbell', null, 'Hip Thrust (Barbell)', 'Sumo Stance Hip Thrust')
add('hipThrust', 'smith', null, 'Smith Machine Hip Thrust')
add('hipThrust', 'goblet', null, 'Hip Thrust (Dumbbell)')
add('gluteBridge', 'none', null, 'Glute Bridge')
add('deadlift', 'barbell', null, 'Deadlift (Conventional)', 'Deadlift (Sumo)', 'Trap Bar Deadlift')
add('rackPull', 'barbell', null, 'Rack Pull')
add('rdl', 'barbell', null, 'Romanian Deadlift (Barbell)', 'Stiff Leg Deadlift')
add('rdl', 'dumbbell', null, 'Romanian Deadlift (Dumbbell)')
add('singleLegRdl', 'none', null, 'Single Leg Romanian Deadlift')
add('goodMorning', 'barbell', null, 'Good Morning')
add('kbSwing', 'kettlebell', null, 'Kettlebell Swing')
add('backExtension', 'none', null, '45 Degree Back Extension', 'Hyperextension')

// Push
add('bench', 'barbell', null, 'Barbell Bench Press', 'Close Grip Bench Press')
add('bench', 'smith', null, 'Smith Machine Bench Press', 'Smith Machine Close Grip Press')
add('bench', 'dumbbell', null, 'Dumbbell Bench Press')
add('inclineBench', 'barbell', null, 'Incline Barbell Bench Press')
add('inclineBench', 'smith', null, 'Smith Machine Incline Press')
add('inclineBench', 'dumbbell', null, 'Incline Dumbbell Press', 'High Incline Dumbbell Press')
add('pushUp', 'none', null, 'Push Up', 'Wide Grip Push Up')
add('pushUp', 'none', ['triceps', 'chest'], 'Diamond Push Up', 'Tricep Pushup')
add('ohp', 'barbell', null, 'Barbell Overhead Press', 'Military Press', 'Push Press')
add('ohp', 'smith', null, 'Smith Machine Overhead Press')
add('ohp', 'dumbbell', null, 'Dumbbell Shoulder Press', 'Arnold Press')
add('dips', 'none', null, 'Tricep Dip (Parallel Bars)')
add('dips', 'none', ['chest', 'triceps'], 'Dips (Chest Focus)')
add('benchDip', 'none', null, 'Bench Dip')

// Pull
add('pullUp', 'none', null, 'Pull Up', 'Chin Up', 'Neutral Grip Pull Up', 'Wide Grip Pull Up')
add('latPulldown', 'cable', null, 'Lat Pulldown (Wide Grip)', 'Lat Pulldown (Close Grip)', 'Lat Pulldown (Neutral Grip)')
add('seatedRow', 'cable', null, 'Seated Cable Row (Close Grip)', 'Seated Cable Row (Wide Grip)')
add('bentRow', 'barbell', null, 'Barbell Row (Bent Over)', 'Pendlay Row', 'Underhand Barbell Row')
add('bentRow', 'smith', null, 'Smith Machine Row')
add('facePull', 'cable', null, 'Face Pull')
add('straightArmPulldown', 'cable', null, 'Straight Arm Pulldown')
add('pullover', 'goblet', null, 'Dumbbell Pull Over')
add('pullover', 'barbell', null, 'Barbell Pull Over')

// Arms and shoulders
add('curl', 'barbell', null, 'Barbell Bicep Curl', 'EZ Bar Curl', '21s Curl')
add('curl', 'barbell', ['forearms', 'biceps'], 'Reverse Curl (Barbell)', 'Reverse Curl (EZ Bar)')
add('curl', 'dumbbell', null, 'Dumbbell Bicep Curl', 'Hammer Curl', 'Zottman Curl')
add('curl', 'dumbbell', ['forearms', 'biceps'], 'Dumbbell Reverse Curl')
add('curl', 'cable', null, 'Cable Bicep Curl', 'Cable Hammer Curl')
add('curl', 'band', null, 'Resistance Band Bicep Curl')
add('preacherCurl', 'barbell', null, 'Preacher Curl (Barbell)', 'EZ Bar Preacher Curl')
add('preacherCurl', 'dumbbell', null, 'Preacher Curl (Dumbbell)')
add('preacherCurl', 'none', null, 'Machine Preacher Curl')
add('pushdown', 'cable', null, 'Tricep Pushdown (Rope)', 'Tricep Pushdown (Straight Bar)', 'Reverse Grip Pushdown', 'Single Arm Pushdown')
add('pushdown', 'band', null, 'Resistance Band Pushdown')
add('overheadExtension', 'goblet', null, 'Overhead Tricep Extension (Dumbbell)')
add('overheadExtension', 'barbell', null, 'Overhead Tricep Extension (Barbell)')
add('overheadExtension', 'cable', null, 'Overhead Tricep Extension (Cable)', 'Cable Overhead Single Arm Extension')
add('skullCrusher', 'barbell', null, 'Skull Crusher (Barbell)', 'Skull Crusher (EZ Bar)')
add('skullCrusher', 'dumbbell', null, 'Skull Crusher (Dumbbell)')
add('kickback', 'dumbbell', null, 'Kickback (Dumbbell)')
add('kickback', 'cable', null, 'Kickback (Cable)')
add('frontRaise', 'dumbbell', null, 'Dumbbell Front Raise')
add('frontRaise', 'barbell', null, 'Barbell Front Raise', 'Plate Front Raise')
add('frontRaise', 'cable', null, 'Cable Front Raise')

// Core
add('plank', 'none', null, 'Plank')
add('crunch', 'none', null, 'Crunch')
add('sitUp', 'none', null, 'Sit Up')
add('legRaise', 'none', null, 'Leg Raise (Lying)')
add('hangingKneeRaise', 'none', null, 'Hanging Knee Raise')
add('hangingLegRaise', 'none', null, 'Hanging Leg Raise')
add('mountainClimber', 'none', null, 'Mountain Climber')

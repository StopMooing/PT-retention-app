// Plain-English coaching cues for the exercise library: exact-name tips first, then a
// fallback per muscle group.
export const getCoachingTips = (exerciseName, muscleGroup) => {
  const tips = {

    // BICEPS
    "21s Curl": [
      "Keep your elbows pinned to your sides the whole time. They should not drift forward.",
      "Bottom half is from fully straight arms to 90 degrees, top half is 90 degrees to the top. Complete all reps of one half before switching.",
      "Lower the weight slowly on every rep. Do not let it drop."
    ],
    "Alternating Hammer Curl": [
      "Keep your upper arms completely still at your sides. Only your forearms should move.",
      "Squeeze hard at the top and hold for a second before lowering.",
      "Lower slowly, taking about 3 seconds to get back to the bottom."
    ],
    "Barbell Bicep Curl": [
      "Keep your elbows tucked into your sides. Do not let them swing forward.",
      "Squeeze hard at the top of each curl.",
      "Lower the weight slowly, taking about 3 seconds to return to the bottom."
    ],
    "Cable Bicep Curl": [
      "Stand close to the cable. Keep your elbows pinned to your sides.",
      "Squeeze hard at the top and hold briefly before lowering.",
      "Lower slowly and feel the stretch at the bottom."
    ],
    "Concentration Curl": [
      "Rest your elbow on the inside of your thigh. It must not move at all.",
      "Curl slowly and squeeze hard at the top.",
      "This is a slow, controlled exercise. No swinging."
    ],
    "Dumbbell Bicep Curl": [
      "Keep your elbows pinned to your sides. They should not swing forward.",
      "Squeeze hard at the top of each curl.",
      "Lower the weight slowly, taking about 3 seconds to return to the bottom."
    ],
    "EZ Bar Curl": [
      "The angled grip takes pressure off your wrists. Use it if straight bar curls hurt your wrists.",
      "Keep your elbows tucked into your sides. Do not let them swing.",
      "Lower slowly and feel the stretch at the bottom."
    ],
    "Hammer Curl": [
      "Hold the dumbbells like you are gripping a hammer, thumbs facing up.",
      "Keep your upper arms completely still at your sides throughout.",
      "Squeeze at the top and lower slowly."
    ],
    "Incline Dumbbell Curl": [
      "Lie back on the incline bench and let your arms hang straight down behind you.",
      "Keep your upper arms still throughout. Only your forearms move.",
      "Lower all the way back down to a full stretch before curling again."
    ],
    "Preacher Curl": [
      "Rest the back of your upper arms flat on the pad. They must stay on the pad the whole time.",
      "Lower all the way down to a full stretch at the bottom before curling back up.",
      "Squeeze hard at the top before lowering slowly."
    ],
    "Reverse Curl": [
      "Hold the bar with your palms facing down instead of up.",
      "Keep your elbows still at your sides throughout.",
      "Go lighter than a normal curl as this is harder on your forearms."
    ],
    "Spider Curl": [
      "Lie chest down on the incline bench and let your arms hang straight down.",
      "Keep your upper arms pointing straight down throughout. Only your forearms move.",
      "Squeeze hard at the top before lowering slowly."
    ],
    "Zottman Curl": [
      "Curl up with palms facing up, then rotate your palms to face down before lowering.",
      "Lower slowly with palms facing down. That is the challenging part.",
      "Take your time with the rotation. Do not rush it."
    ],

    // TRICEPS
    "Bench Dip": [
      "Keep your back close to the bench the whole time. Do not let your hips drift out.",
      "Lower until your elbows reach 90 degrees, then push back up.",
      "Fully straighten your arms at the top and squeeze your triceps."
    ],
    "Cable Tricep Pushdown": [
      "Keep your elbows tucked into your sides. They must not move.",
      "Push all the way down until your arms are fully straight, then squeeze.",
      "Let the cable come back up slowly. Do not let it snap back."
    ],
    "Close Grip Bench Press": [
      "Grip the bar with your hands about shoulder-width apart. Do not go narrower than that.",
      "Keep your elbows tucked close to your body as you lower the bar.",
      "Press up powerfully and squeeze your triceps at the top."
    ],
    "Diamond Push Up": [
      "Form a diamond shape with your thumbs and index fingers on the floor.",
      "Keep your elbows close to your body as you lower down.",
      "Push all the way back up and squeeze your triceps at the top."
    ],
    "Dumbbell Overhead Tricep Extension": [
      "Hold one dumbbell with both hands above your head. Keep your upper arms pointing straight up.",
      "Lower the dumbbell behind your head by bending your elbows only. Upper arms stay still.",
      "Press back up to fully straight arms and squeeze at the top."
    ],
    "EZ Bar Skullcrusher": [
      "Lie on the bench with arms straight above your chest.",
      "Lower the bar toward your forehead by bending your elbows only. Upper arms stay pointing straight up.",
      "Press back up to straight arms. Keep everything slow and controlled."
    ],
    "Overhead Tricep Extension": [
      "Keep your upper arms pointing straight up next to your ears throughout.",
      "Lower the weight behind your head by bending your elbows only.",
      "Press back up to fully straight arms and squeeze at the top."
    ],
    "Rope Pushdown": [
      "Keep your elbows tucked into your sides. They must not move.",
      "At the bottom, pull the rope ends slightly apart as you lock out fully.",
      "Let the rope come back up slowly. Do not let it snap."
    ],
    "Skull Crusher": [
      "Lie on the bench with arms straight above your chest.",
      "Lower the bar toward your forehead by bending your elbows only. Upper arms stay still.",
      "Press back up to straight arms. Slow and controlled throughout."
    ],
    "Tricep Dip": [
      "Keep your body upright. Do not lean forward.",
      "Lower until your elbows reach 90 degrees, then push back up.",
      "Fully straighten your arms at the top and squeeze your triceps."
    ],
    "Tricep Kickback": [
      "Hinge forward so your upper body is roughly parallel to the floor.",
      "Keep your upper arm pinned to your side. Only your forearm moves.",
      "Fully straighten your arm at the top and hold for a second before lowering."
    ],

    // CHEST
    "Barbell Bench Press": [
      "Before you unrack the bar, squeeze your shoulder blades together and push them down into the bench, like tucking them into your back pockets.",
      "Lower the bar to your mid-chest with your elbows at roughly 45-75 degrees from your body, not flared straight out.",
      "Drive your feet hard into the floor and create tension through your whole body as you press."
    ],
    "Cable Crossover": [
      "Set the cables at shoulder height. Step forward so there is tension at the starting position.",
      "Bring your hands together in front of your chest like you are hugging a tree. Keep a slight bend in your elbows throughout.",
      "Squeeze your chest hard when your hands meet. Do not just swing your arms."
    ],
    "Cable Fly": [
      "Keep a slight bend in your elbows throughout. Do not let your arms go fully straight.",
      "Open your arms out wide, feeling a stretch across your chest, then bring them back together.",
      "Squeeze your chest hard when your hands meet."
    ],
    "Chest Dip": [
      "Lean your body forward as you dip. The forward lean shifts the work to your chest.",
      "Lower until you feel a stretch across your chest, then push back up.",
      "Squeeze your chest at the top of each rep."
    ],
    "Decline Bench Press": [
      "Squeeze your shoulder blades together and push them into the bench before you start.",
      "Lower the bar to your lower chest, keeping your elbows at roughly 45-75 degrees from your body.",
      "Press up powerfully and squeeze your chest at the top."
    ],
    "Dumbbell Bench Press": [
      "Squeeze your shoulder blades together and push them into the bench before you start.",
      "Lower the dumbbells until they are level with your chest, elbows at roughly 45-75 degrees from your body.",
      "Press up and bring the dumbbells slightly together at the top. Squeeze your chest."
    ],
    "Dumbbell Fly": [
      "Keep a slight bend in your elbows throughout. Do not let your arms go fully straight.",
      "Lower the dumbbells out to your sides until you feel a stretch across your chest.",
      "Bring the dumbbells back together above your chest and squeeze hard."
    ],
    "Incline Barbell Press": [
      "Squeeze your shoulder blades together and push them into the bench before you start.",
      "Lower the bar to your upper chest, keeping your elbows at roughly 45-75 degrees from your body.",
      "Press up and squeeze your upper chest at the top."
    ],
    "Incline Dumbbell Press": [
      "Squeeze your shoulder blades together and push them into the bench before you start.",
      "Lower the dumbbells until they are level with your upper chest.",
      "Press up and squeeze your upper chest at the top."
    ],
    "Incline Dumbbell Fly": [
      "Keep a slight bend in your elbows throughout.",
      "Lower the dumbbells out to your sides until you feel a good stretch across your upper chest.",
      "Bring the dumbbells back together above your upper chest and squeeze hard."
    ],
    "Machine Chest Press": [
      "Adjust the seat so the handles are at chest height.",
      "Squeeze your shoulder blades together and push them into the pad before you press.",
      "Press out fully and squeeze your chest, then return slowly."
    ],
    "Machine Fly": [
      "Adjust the seat so your arms are at chest height.",
      "Keep a slight bend in your elbows as you bring the handles together.",
      "Squeeze your chest hard when the handles meet, then open slowly."
    ],
    "Push Up": [
      "Keep your body in a straight line from head to heels. Do not let your hips sag or pike up.",
      "Lower your chest all the way to the floor, keeping your elbows at roughly 45 degrees from your body.",
      "Push all the way back up to fully straight arms and squeeze your chest."
    ],
    "Pec Deck": [
      "Adjust the seat so your arms are at chest height.",
      "Keep a slight bend in your elbows as you bring the pads together.",
      "Squeeze your chest hard when the pads meet, then open slowly."
    ],

    // BACK
    "Assisted Pull Up (Machine)": [
      "The heavier the weight on the machine, the easier the exercise. Start with a weight that lets you do clean reps.",
      "Pull your elbows straight down toward your hips to lift yourself up.",
      "Lower yourself slowly all the way back down to a full stretch before pulling again."
    ],
    "Band Pull Apart": [
      "Hold the band at shoulder height with straight arms in front of you.",
      "Pull the band apart by squeezing your shoulder blades together, like you are trying to pinch a pencil between them.",
      "Control the band back to the start. Do not let it snap forward."
    ],
    "Barbell Pull Over": [
      "Lie on the bench with the bar above your chest. Keep a slight bend in your elbows.",
      "Lower the bar back over your head in an arc until you feel a stretch through your back and chest.",
      "Pull the bar back over your chest by driving your elbows down toward your hips."
    ],
    "Barbell Row (Bent Over)": [
      "Hinge forward to about 45 degrees. Keep your back flat, not rounded.",
      "Pull the bar into your lower stomach by driving your elbows back behind you.",
      "Squeeze your shoulder blades together at the top, then lower slowly."
    ],
    "Cable Row (Seated)": [
      "Sit tall. Do not round your lower back.",
      "Pull the handle into your stomach by driving your elbows back behind you.",
      "Squeeze your shoulder blades together at the top, then let the cable pull your arms forward slowly."
    ],
    "Chest Supported Row": [
      "Lie chest down on the pad. This removes your lower back from the equation.",
      "Pull the handles up by driving your elbows back behind you.",
      "Squeeze your shoulder blades together at the top before lowering slowly."
    ],
    "Dumbbell Pull Over": [
      "Lie on the bench with the dumbbell above your chest. Keep a slight bend in your elbows.",
      "Lower the dumbbell back over your head in an arc until you feel a stretch through your back.",
      "Pull the dumbbell back over your chest by driving your elbows down toward your hips."
    ],
    "Dumbbell Row (Single Arm)": [
      "Place one hand and knee on the bench for support. Keep your back flat.",
      "Pull the dumbbell up by driving your elbow straight up toward the ceiling.",
      "Squeeze your shoulder blade in toward your spine at the top before lowering slowly."
    ],
    "Face Pull": [
      "Set the cable at face height. Pull the rope toward your face, flaring your elbows out to the sides.",
      "Think about trying to pull your shoulder blades together and back as you pull.",
      "Hold for a second at the end position, then return slowly."
    ],
    "Lat Pulldown": [
      "Grip the bar just wider than shoulder-width. Lean back slightly.",
      "Pull the bar down to your upper chest by driving your elbows straight down toward your hips.",
      "Lower the bar back up slowly all the way to a full stretch before pulling again."
    ],
    "Meadow Row": [
      "Stand side on to the barbell. Hinge forward and grip the end of the bar.",
      "Pull the bar up by driving your elbow back behind you.",
      "Squeeze your shoulder blade in at the top before lowering slowly."
    ],
    "Pull Up": [
      "Hang with your arms fully straight to start every rep.",
      "Pull yourself up by driving your elbows straight down toward your hips.",
      "Lower yourself slowly all the way back down to a full hang before pulling again."
    ],
    "Rack Pull": [
      "Set the bar at knee height in the rack. Stand with feet shoulder-width apart.",
      "Keep your back flat and chest up as you pull. Do not round your back.",
      "Drive your hips forward to stand up, then lower the bar back to the rack under control."
    ],
    "Straight Arm Pulldown": [
      "Keep your arms straight throughout. This is not a rowing movement.",
      "Pull the bar down toward your thighs by driving your arms down and back.",
      "Squeeze your back hard at the bottom before letting the bar rise slowly."
    ],
    "T-Bar Row": [
      "Hinge forward to about 45 degrees. Keep your back flat.",
      "Pull the bar into your chest by driving your elbows back behind you.",
      "Squeeze your shoulder blades together at the top before lowering slowly."
    ],

    // SHOULDERS
    "Arnold Press": [
      "Start with the dumbbells at chin height, palms facing you.",
      "As you press up, rotate your palms to face forward. Move smoothly through the rotation.",
      "Lower slowly back to the start position, rotating your palms back to face you."
    ],
    "Barbell Front Raise": [
      "Stand tall. Keep a slight bend in your elbows throughout.",
      "Raise the bar to shoulder height only. You do not need to go higher.",
      "Lower the bar slowly. Do not let it drop."
    ],
    "Barbell Overhead Press": [
      "Press the bar in a straight vertical line above your head. Do not press forward.",
      "Tighten your core and squeeze your glutes hard to protect your lower back under load.",
      "As the bar passes your face, push your head slightly forward so the bar finishes directly above your shoulders."
    ],
    "Bent Over Rear Delt Fly": [
      "Hinge forward until your upper body is almost parallel to the floor.",
      "Raise your arms out to your sides by leading with your elbows, not your hands.",
      "Squeeze your shoulder blades together at the top before lowering slowly."
    ],
    "Cable Lateral Raise": [
      "Stand side on to the cable with the handle at your hip.",
      "Raise your arm out to the side to shoulder height. Lead with your elbow, not your hand.",
      "Lower slowly. Do not let the cable pull your arm down quickly."
    ],
    "Dumbbell Lateral Raise": [
      "Keep a slight bend in your elbows throughout.",
      "Raise your arms out to your sides to shoulder height. Think about pouring water out of a jug.",
      "Lower slowly, taking about 3 seconds to return to your sides."
    ],
    "Dumbbell Shoulder Press": [
      "Sit tall or stand tall. Do not arch your lower back.",
      "Press the dumbbells straight up above your head.",
      "Lower slowly until your elbows are at 90 degrees before pressing again."
    ],
    "Front Raise": [
      "Keep a slight bend in your elbows throughout.",
      "Raise to shoulder height only. You do not need to go higher.",
      "Lower slowly. Do not let the weight drop."
    ],
    "Lateral Raise Machine": [
      "Adjust the seat so the pads sit just above your elbows.",
      "Raise your arms out to shoulder height, then lower slowly.",
      "Do not shrug your shoulders up as you raise. Keep them relaxed and down."
    ],
    "Rear Delt Machine": [
      "Adjust the seat so the handles are at shoulder height.",
      "Pull your arms back by driving your elbows back behind you.",
      "Squeeze your shoulder blades together at the end position before returning slowly."
    ],
    "Upright Row": [
      "Grip the bar about shoulder-width apart.",
      "Pull the bar straight up close to your body, leading with your elbows. Elbows should rise higher than your hands.",
      "Lower slowly back to the start."
    ],

    // LEGS / QUADS
    "Back Squat": [
      "Take a big breath in and brace your core hard before you descend, like you are about to take a punch to the stomach.",
      "Push your knees out in the same direction as your toes as you squat down.",
      "Drive your hips forward to stand up, not just your chest. Push the floor away from you."
    ],
    "Banded Squat": [
      "Push your knees out against the band throughout the whole movement.",
      "Drive through your whole foot, not just your heels.",
      "Master the full range of motion before adding load."
    ],
    "Box Jump": [
      "Stand in front of the box with feet shoulder-width apart.",
      "Swing your arms forward as you jump to help drive you up onto the box.",
      "Land softly with both feet flat on the box and knees slightly bent. Step down, do not jump down."
    ],
    "Box Step Down": [
      "Stand on the box on one leg. Lower your other foot toward the floor slowly.",
      "Keep your knee tracking over your toes as you lower.",
      "Touch the floor lightly, then drive back up to standing."
    ],
    "Bulgarian Split Squat": [
      "Rest your back foot on the bench with the top of your foot facing down.",
      "Lower straight down by bending your front knee. Keep your front foot flat.",
      "Your front knee should track over your toes as you lower."
    ],
    "Front Squat": [
      "Rest the bar on your front shoulders with your elbows pointing forward and up.",
      "Keep your chest up tall throughout. If your chest drops, the bar will fall.",
      "Push your knees out over your toes as you squat."
    ],
    "Goblet Squat": [
      "Hold the dumbbell or kettlebell at chest height with both hands.",
      "Keep your chest up and push your knees out over your toes as you squat.",
      "Drive through your whole foot to stand back up."
    ],
    "Hack Squat": [
      "Place your feet shoulder-width apart on the platform. Position depends on what feels comfortable.",
      "Lower slowly and push your knees out over your toes.",
      "Drive through your whole foot to push the platform away."
    ],
    "Leg Extension": [
      "Adjust the machine so the pad sits just above your ankles.",
      "Kick your legs up until they are fully straight, then squeeze hard for a second.",
      "Lower slowly. Do not let the weight drop."
    ],
    "Leg Press": [
      "Place your feet shoulder-width apart on the platform.",
      "Lower the platform slowly until your knees are at 90 degrees. Do not let your lower back peel off the seat.",
      "Drive through your whole foot to push the platform away. Do not lock your knees out completely at the top."
    ],
    "Lunge": [
      "Step forward and lower your back knee toward the floor.",
      "Keep your front knee tracking over your toes. Do not let it cave inward.",
      "Drive through your front heel to push back to the start."
    ],
    "Pistol Squat": [
      "Hold your arms out in front for balance.",
      "Lower slowly on one leg, keeping your heel flat on the floor.",
      "Drive through your heel to stand back up. Use a box or support until you build the strength."
    ],
    "Romanian Split Squat": [
      "Stand in a split stance with one foot forward and one back.",
      "Lower straight down by bending both knees.",
      "Keep your front foot flat and your front knee tracking over your toes."
    ],
    "Sissy Squat": [
      "Hold something for support to start. This is an advanced exercise.",
      "Lean your body back as you bend your knees, raising your heels off the floor.",
      "Lower slowly. The slower you go, the harder it is."
    ],
    "Smith Machine Squat": [
      "Set the bar so you can step under it comfortably. It should sit on your upper back.",
      "Push your knees out over your toes as you squat down.",
      "Drive through your whole foot to stand back up."
    ],
    "Step Up": [
      "Place your whole foot on the box or bench, not just your toes.",
      "Drive through your front heel to step up. Do not push off with your back foot.",
      "Lower your back foot slowly and with control."
    ],
    "Wall Sit": [
      "Stand with your back flat against the wall and slide down until your knees are at 90 degrees.",
      "Keep your feet flat on the floor directly under your knees.",
      "Hold the position and breathe. Do not hold your breath."
    ],

    // HAMSTRINGS AND GLUTES
    "Romanian Deadlift": [
      "Keep a slight bend in your knees throughout. This is not a straight-leg movement.",
      "Push your hips back as you lower the bar, like you are trying to touch the wall behind you with your backside.",
      "Feel the stretch in the back of your legs at the bottom, then drive your hips forward to stand back up."
    ],
    "Nordic Curl": [
      "Lock your feet under something secure. Keep your body in a straight line from knees to shoulders.",
      "Lower yourself toward the floor as slowly as you possibly can.",
      "Use your hands to push off the floor at the bottom, then curl yourself back up."
    ],
    "Leg Curl (Lying)": [
      "Lie face down with the pad just above your heels.",
      "Curl your heels toward your backside, squeezing the back of your legs hard at the top.",
      "Lower slowly. Do not let the weight drop."
    ],
    "Leg Curl (Seated)": [
      "Adjust the machine so the pad sits just above your heels.",
      "Curl your legs down as far as the machine allows. Squeeze hard at the bottom.",
      "Return slowly to the start position."
    ],
    "Stiff Leg Deadlift": [
      "Keep your legs straight but not locked. There should be a soft bend at the knee.",
      "Push your hips back as you lower, like you are trying to touch the wall behind you with your backside.",
      "Feel the stretch in the back of your legs, then drive your hips forward to stand back up."
    ],
    "Good Morning": [
      "Keep your back flat throughout. Do not round forward.",
      "Push your hips back as you hinge forward. Keep a soft bend in your knees.",
      "Drive your hips forward to stand back up."
    ],
    "Glute Ham Raise": [
      "Lock your feet securely. Start with your body in a straight line.",
      "Lower your upper body toward the floor as slowly as you can.",
      "Use the strength of the back of your legs to curl yourself back up."
    ],
    "45 Degree Back Extension": [
      "Lie face down on the pad with your hips at the top edge.",
      "Lower your upper body down toward the floor, then raise back up to a straight line with your legs.",
      "Squeeze your glutes and the back of your legs hard at the top."
    ],
    "Reverse Hyper": [
      "Lie face down on the pad with your hips at the edge.",
      "Raise your legs up by squeezing your glutes and the back of your legs.",
      "Lower slowly and with control."
    ],

    // GLUTES
    "Hip Thrust (Barbell)": [
      "Rest your upper back on the bench and place the barbell across your hips. Use a pad for comfort.",
      "Drive your hips straight up by squeezing your glutes hard. Think about pushing the ceiling away with your hips.",
      "Squeeze and hold at the top for a second before lowering slowly."
    ],
    "Hip Thrust (Dumbbell)": [
      "Rest your upper back on the bench with the dumbbell sitting across your hips.",
      "Drive your hips straight up by squeezing your glutes hard.",
      "Squeeze and hold at the top for a second before lowering slowly."
    ],
    "Banded Hip Thrust": [
      "Place the band just above your knees and push your knees out against it throughout.",
      "Drive your hips straight up by squeezing your glutes hard.",
      "Squeeze and hold at the top for a second before lowering slowly."
    ],
    "American Hip Thrust": [
      "At the top, tuck your hips under slightly, like you are flattening your lower back.",
      "This is different to a standard hip thrust and targets a different part of your glutes.",
      "Squeeze hard at the top and hold for a second before lowering."
    ],
    "Glute Bridge": [
      "Lie on your back with your feet flat on the floor close to your backside.",
      "Drive your hips straight up by squeezing your glutes hard.",
      "Squeeze and hold at the top for a second before lowering slowly."
    ],
    "Single Leg Glute Bridge": [
      "Lie on your back. Lift one foot off the floor and drive your hips up using the other leg.",
      "Squeeze your glute hard at the top and hold for a second.",
      "Keep your hips level. Do not let one side drop."
    ],
    "Cable Kickback": [
      "Attach the ankle strap and face the cable machine.",
      "Kick your leg straight back behind you, squeezing your glute hard at the top.",
      "Return your foot slowly to the start. Do not swing your leg."
    ],
    "Donkey Kick": [
      "Start on hands and knees with a flat back.",
      "Kick one leg back and up, squeezing your glute hard at the top.",
      "Keep your core tight so your lower back does not arch excessively."
    ],
    "Fire Hydrant": [
      "Start on hands and knees with a flat back.",
      "Lift one knee out to the side like a dog at a fire hydrant.",
      "Keep your core tight. Do not let your hips rotate."
    ],
    "Clamshell": [
      "Lie on your side with your hips and knees bent at 90 degrees.",
      "Lift your top knee up like a clamshell opening, keeping your feet together.",
      "Squeeze at the top and lower slowly. Do not let your hips roll back."
    ],
    "Hip Abduction Machine": [
      "Adjust the machine so the pads rest on the outside of your knees.",
      "Push your knees out against the pads, squeezing your outer glutes.",
      "Return slowly. Do not let the weight snap your knees back together."
    ],
    "Hip Adduction Machine": [
      "Adjust the machine so the pads rest on the inside of your knees.",
      "Squeeze your knees together against the pads.",
      "Return slowly. Do not let the weight pull your knees apart quickly."
    ],
    "Frog Pump": [
      "Lie on your back with the soles of your feet together and knees out to the sides.",
      "Drive your hips straight up by squeezing your glutes hard.",
      "Squeeze and hold at the top for a second before lowering."
    ],
    "Cable Pull Through": [
      "Face away from the cable machine with the rope between your legs.",
      "Hinge forward, pushing your hips back toward the machine and feeling the stretch.",
      "Drive your hips forward to stand up, squeezing your glutes hard at the top."
    ],
    "Curtsy Lunge": [
      "Step one foot back and across behind the other leg.",
      "Lower your back knee toward the floor, keeping your front knee tracking over your toes.",
      "Push through your front heel to return to the start."
    ],

    // CALVES
    "Calf Raise (Standing)": [
      "Stand with the balls of your feet on the edge of a step or platform.",
      "Lower your heels all the way down to feel a full stretch, then rise up as high as you can on your toes.",
      "Hold at the top for a second and squeeze your calves before lowering slowly."
    ],
    "Calf Raise (Seated)": [
      "Sit with the pad resting just above your knees.",
      "Lower your heels all the way down to feel a full stretch before rising up.",
      "Rise as high as you can on your toes and squeeze at the top before lowering slowly."
    ],
    "Calf Raise (Machine)": [
      "Place the balls of your feet on the platform with heels hanging off the edge.",
      "Lower your heels down to a full stretch before rising up.",
      "Rise as high as you can and squeeze at the top before lowering slowly."
    ],
    "Donkey Calf Raise": [
      "Hinge forward with your hands resting on a surface for support.",
      "Lower your heels all the way down to a full stretch, then rise up as high as you can.",
      "Squeeze your calves hard at the top before lowering slowly."
    ],
    "Jump Rope": [
      "Keep your elbows close to your sides and turn the rope using your wrists, not your arms.",
      "Jump with both feet together, bouncing lightly on the balls of your feet.",
      "Keep your knees slightly bent throughout to absorb impact."
    ],
    "Single Leg Calf Raise": [
      "Stand on one foot on the edge of a step. Hold something lightly for balance.",
      "Lower your heel all the way down to a full stretch, then rise as high as you can.",
      "Squeeze at the top before lowering slowly."
    ],
    "Tibialis Raise": [
      "Stand with your heels on an edge or a weight plate, toes off the floor.",
      "Raise your toes up as high as you can, squeezing the front of your shin.",
      "Lower slowly back to the start."
    ],

    // CORE
    "Ab Wheel Rollout": [
      "Start from kneeling. Only move to standing when you can do perfect kneeling reps.",
      "Brace your core hard before rolling out. If you lose that tension, you risk hurting your lower back.",
      "Pull yourself back in using your core and the back of your arms working together."
    ],
    "Bicycle Crunch": [
      "Lie on your back with hands lightly behind your head. Do not pull on your neck.",
      "Bring your opposite elbow to your opposite knee, rotating through your core.",
      "Keep the movement slow and controlled. Do not rush through the reps."
    ],
    "Bird Dog": [
      "Start on hands and knees with a flat back. Do not let your back sag.",
      "Extend your opposite arm and leg at the same time, keeping your body level.",
      "Hold at the top for a second, then return slowly before switching sides."
    ],
    "Cable Crunch": [
      "Kneel in front of the cable with the rope attachment behind your head.",
      "Crunch down by rounding your spine, bringing your elbows toward your knees.",
      "Return slowly to the start under control."
    ],
    "Dead Bug": [
      "Lie on your back with arms pointing to the ceiling and knees bent at 90 degrees.",
      "Brace your core and press your lower back flat into the floor. Keep it there throughout.",
      "Lower your opposite arm and leg slowly toward the floor, then return and switch sides."
    ],
    "Dragon Flag": [
      "This is an advanced exercise. Start with easier progressions first.",
      "Keep your body in a perfectly straight line from shoulders to feet as you lower.",
      "Lower as slowly as you can. The slower you go, the harder it is."
    ],
    "Hanging Knee Raise": [
      "Hang from the bar with a firm grip.",
      "Bring your knees up toward your chest by rounding your lower back slightly.",
      "Lower your legs slowly back to the start. Do not swing."
    ],
    "Hanging Leg Raise": [
      "Hang from the bar with a firm grip.",
      "Raise your legs up with straight knees until they are parallel to the floor or higher.",
      "Lower slowly. Do not swing or use momentum."
    ],
    "Hollow Body Hold": [
      "Lie on your back and press your lower back flat into the floor.",
      "Raise your shoulders and legs off the floor slightly, keeping your lower back flat.",
      "Hold the position and breathe. Do not hold your breath."
    ],
    "Landmine Rotation": [
      "Hold the end of the barbell with both hands, arms slightly bent.",
      "Rotate the bar from one side of your body to the other, pivoting your feet.",
      "Keep control of the bar throughout. Do not let it swing."
    ],
    "Leg Raise": [
      "Lie flat on your back with legs straight.",
      "Raise your legs up to 90 degrees by tightening your core, not just swinging your legs.",
      "Lower slowly. Do not let your lower back arch off the floor."
    ],
    "Mountain Climber": [
      "Start in a push up position with a flat back.",
      "Drive one knee toward your chest, then quickly switch legs.",
      "Keep your hips level and your core tight throughout."
    ],
    "Pallof Press": [
      "Stand side on to the cable. The cable should be at chest height.",
      "Press the handle straight out in front of your chest and hold briefly.",
      "Pull it back to your chest. Resist the cable trying to rotate your body throughout."
    ],
    "Plank": [
      "Place your forearms on the floor with elbows directly under your shoulders.",
      "Keep your body in a straight line from head to heels. Do not let your hips sag or pike up.",
      "Breathe normally throughout. Do not hold your breath."
    ],
    "Reverse Crunch": [
      "Lie flat on your back with hands by your sides.",
      "Bring your knees toward your chest by curling your lower back off the floor.",
      "Lower slowly. Do not let your legs drop."
    ],
    "Russian Twist": [
      "Sit with your knees bent and feet off the floor. Keep your back at a 45 degree angle.",
      "Rotate your upper body from side to side, keeping your core tight.",
      "Keep the movement controlled. Do not just swing your arms."
    ],
    "Side Plank": [
      "Stack your feet or stagger them for balance. Keep your body in a straight line from head to heels.",
      "Do not let your hips drop toward the floor.",
      "Breathe normally throughout. Do not hold your breath."
    ],
    "Sit Up": [
      "Lie on your back with knees bent and feet flat.",
      "Curl your upper body up toward your knees using your core.",
      "Lower slowly all the way back down before the next rep."
    ],
    "Toes to Bar": [
      "Hang from the bar with a firm grip.",
      "Raise your legs up and touch your toes to the bar.",
      "Lower slowly with control. Do not just drop your legs."
    ],
    "Windmill": [
      "Stand with feet wider than shoulder-width, toes turned out.",
      "Hinge sideways, lowering one hand toward your foot while the other reaches to the ceiling.",
      "Keep both arms straight and look up toward your raised hand."
    ],
    "Wood Chop": [
      "Stand side on to the cable or holding a weight.",
      "Rotate and pull the weight from high to low in a chopping motion, pivoting your feet.",
      "Keep the movement controlled. Do not just swing."
    ],

    // FULL BODY
    "Assault Bike Sprint": [
      "Push and pull the handles at the same time as you pedal. Arms and legs work together.",
      "For sprints, drive as hard as you can for the full interval. Do not pace yourself.",
      "Keep your back upright and core tight. Do not hunch forward."
    ],
    "Barbell Complex": [
      "Choose a weight you can use for your weakest exercise in the series.",
      "Do not put the bar down between exercises. That is the whole point.",
      "Go through each movement with good form. Do not let technique fall apart when you are tired."
    ],
    "Battle Ropes": [
      "Keep a slight bend in your knees and your core tight throughout.",
      "Drive the waves from your shoulders, not just your wrists.",
      "Breathe continuously. Do not hold your breath."
    ],
    "Bear Crawl": [
      "Start on hands and knees with your knees hovering just an inch off the floor.",
      "Move your opposite hand and foot together, like a crawling baby.",
      "Keep your hips low and level. Do not let them rise up."
    ],
    "Broad Jump": [
      "Stand with feet shoulder-width apart.",
      "Swing your arms and bend your knees, then explode forward as far as you can.",
      "Land softly with knees bent to absorb the impact."
    ],
    "Burpee": [
      "Start standing. Drop your hands to the floor and jump or step your feet back to a push up position.",
      "Do a push up, then jump or step your feet back toward your hands.",
      "Jump up and clap overhead to finish one rep."
    ],
    "Clean": [
      "Start with the bar over your mid-foot, about shoulder-width grip.",
      "Drive through your legs first, then pull the bar up close to your body.",
      "As the bar reaches chest height, quickly drop under it and catch it on your front shoulders with elbows high."
    ],
    "Clean and Jerk": [
      "Perform the clean first to get the bar to your front shoulders.",
      "Dip slightly at the knees, then drive the bar overhead explosively.",
      "Split your feet or squat under the bar to catch it with straight arms."
    ],
    "Deadlift": [
      "Stand with the bar over your mid-foot. Feet shoulder-width apart.",
      "Keep your back flat and chest up as you pull. Think about pushing the floor away from you rather than pulling the bar up.",
      "Drive your hips forward to stand up. Do not let your lower back round."
    ],
    "Farmers Carry": [
      "Pick up the weights with a firm grip. Stand tall with your shoulders pulled back.",
      "Walk with short, controlled steps. Keep your core tight throughout.",
      "Do not let the weights pull your shoulders forward or your back round."
    ],
    "Kettlebell Swing": [
      "Push your hips back as the kettlebell swings down between your legs, like you are hiking a football.",
      "Drive your hips forward explosively to swing the kettlebell up. It is a hip movement, not a squat.",
      "Let the kettlebell swing back between your legs naturally and repeat."
    ],
    "Man Maker": [
      "This is a complex movement. Learn each part separately before combining them.",
      "Perform a push up, then a renegade row on each side, then stand and perform a squat to press.",
      "Choose a weight you can control for every part of the movement."
    ],
    "Power Clean": [
      "Start with the bar over your mid-foot.",
      "Drive through your legs, then pull the bar up close to your body and drop under it.",
      "Catch the bar on your front shoulders with your elbows high."
    ],
    "Sandbag Carry": [
      "Hug the sandbag to your chest or hoist it onto one shoulder.",
      "Keep your core tight and walk with controlled steps.",
      "Switch shoulders regularly if carrying on one side."
    ],
    "Sled Push": [
      "Lean forward into the sled with your arms straight or bent.",
      "Drive through your legs with powerful steps.",
      "Keep your core tight and back flat throughout."
    ],
    "Snatch": [
      "This is a technical lift. Work with a coach before adding heavy weight.",
      "Drive through your legs first, then pull the bar close to your body all the way overhead.",
      "Catch the bar with straight arms overhead in a partial squat."
    ],
    "Thruster": [
      "Start with the bar on your front shoulders.",
      "Squat down, then drive up explosively and use that momentum to press the bar overhead.",
      "Lock your arms out fully at the top before lowering back to your shoulders."
    ],
    "Tyre Flip": [
      "Start with the tyre flat on the ground. Hinge down and grip the bottom.",
      "Drive through your legs to tip the tyre up, then switch your hands to push it over.",
      "Use your legs throughout. Do not try to muscle it with your arms."
    ],

    // CARDIO
    "Cycling (Stationary)": [
      "Adjust the seat so your knee has a slight bend when the pedal is at the bottom.",
      "Keep a smooth, consistent pedal stroke throughout.",
      "Keep your upper body relaxed. Do not hunch forward."
    ],
    "Hill Sprints": [
      "Drive your knees up and pump your arms powerfully as you sprint up.",
      "Lean into the hill slightly.",
      "Walk back down slowly to recover before the next sprint."
    ],
    "Rowing Machine": [
      "The sequence is legs, then lean back, then arms on the way out. Reverse it on the way back: arms, lean forward, legs.",
      "Drive through your legs powerfully. Your legs do most of the work.",
      "Keep your back tall and avoid rounding your shoulders."
    ],
    "Running (Treadmill)": [
      "Keep your posture upright. Do not hunch forward.",
      "Land with your foot under your body, not out in front.",
      "Relax your shoulders and arms. Hands should be loose, not clenched."
    ],
    "Ski Erg": [
      "Pull the handles down past your hips in one smooth arc.",
      "Hinge at the hips as you pull, using your body weight to help drive the movement.",
      "Let the handles rise back up fully before pulling again."
    ],
    "Skipping": [
      "Keep your elbows close to your sides and turn the rope with your wrists, not your whole arms.",
      "Jump with both feet together, bouncing lightly on the balls of your feet.",
      "Keep your knees slightly bent to absorb the impact."
    ],
    "Stair Climber": [
      "Keep your posture upright. Do not lean heavily on the handrails.",
      "Place your whole foot on each step, not just your toes.",
      "Find a challenging pace you can maintain for the full duration."
    ],
    "Swimming": [
      "Keep your body as flat and horizontal in the water as possible.",
      "Breathe consistently. Do not hold your breath for long periods.",
      "Focus on long, smooth strokes rather than short, fast ones."
    ],
    "Versa Climber": [
      "Drive opposite arm and leg together, like an exaggerated walking motion.",
      "Keep your core tight throughout.",
      "Find a steady rhythm rather than going all out and burning out."
    ],
    "Walking": [
      "Keep your posture upright with your head up and shoulders back.",
      "Swing your arms naturally as you walk.",
      "Land your heel first and roll through to your toes with each step."
    ],
  };

  if (tips[exerciseName]) {
    return tips[exerciseName];
  }

  const muscleGroupTips = {
    "Biceps": [
      "Keep your elbows pinned to your sides throughout.",
      "Squeeze hard at the top and lower slowly.",
      "Control the weight on the way down. That is half the work."
    ],
    "Triceps": [
      "Keep your upper arms still. Only your forearms should move.",
      "Fully straighten your arms at the top and squeeze.",
      "Lower slowly. Do not let the weight drop."
    ],
    "Chest": [
      "Squeeze your shoulder blades together and push them into the bench before you start.",
      "Feel the stretch across your chest at the bottom of each rep.",
      "Squeeze your chest hard at the top."
    ],
    "Back": [
      "Think about pulling with your elbows, not your hands.",
      "Squeeze your shoulder blades together at the end of each rep.",
      "Lower slowly and feel the stretch at the bottom."
    ],
    "Shoulders": [
      "Keep your shoulders relaxed and down. Do not shrug them up.",
      "Control the weight on the way down.",
      "Do not use momentum. Move slowly and deliberately."
    ],
    "Legs": [
      "Push your knees out in the direction of your toes.",
      "Drive through your whole foot, not just your heels.",
      "Lower slowly and with control."
    ],
    "Glutes": [
      "Squeeze your glutes hard at the top of every rep.",
      "Hold the squeeze for a full second before lowering.",
      "Lower slowly. Do not just drop the weight."
    ],
    "Core": [
      "Brace your core hard before every rep, like you are about to take a punch.",
      "Do not hold your breath. Breathe throughout.",
      "Slow is harder. The slower you go, the more your core works."
    ],
    "Full Body": [
      "Set up properly before every rep. Good position makes the movement safer and more effective.",
      "Focus on moving well, not moving fast.",
      "If your form breaks down, reduce the weight or rest."
    ],
    "Cardio": [
      "Breathe consistently throughout. Find a rhythm.",
      "Keep your posture upright. Do not hunch.",
      "Focus on maintaining a steady effort rather than going all out and stopping."
    ],
    "Hamstrings": [
      "Feel the stretch in the back of your legs at the bottom of each rep.",
      "Lower slowly and with control.",
      "Drive through your heels to return to the start."
    ],
    "Calves": [
      "Lower your heels all the way down to a full stretch before rising.",
      "Rise as high as you can on your toes and squeeze at the top.",
      "Lower slowly. Do not bounce at the bottom."
    ]
  };

  return muscleGroupTips[muscleGroup] || [
    "Set up properly before every rep.",
    "Focus on moving well, not moving fast.",
    "Lower slowly and with control on every rep."
  ];
};

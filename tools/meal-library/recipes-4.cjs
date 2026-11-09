// Recipes, part 4: High protein, Gluten free and Dairy free (added 9 Nov 2026).
// These styles mostly reuse recipes already in the library that fit (same ingredients,
// method and tips, so they were checked once), placed on new days. Gluten free needed
// three new breakfasts, because every other breakfast has toast or oats.
// Australia does not count oats as gluten free, so none of the gluten free recipes use them.
const existing = [...require('./recipes-1.cjs'), ...require('./recipes-2.cjs'), ...require('./recipes-3.cjs')]
const byKey = Object.fromEntries(existing.map((r) => [r.key, r]))

// A copy of a library recipe for a new style and day.
function reuse(from, family, prefix, day, meal) {
  const r = byKey[from]
  if (!r) throw new Error(`No recipe ${from}`)
  if (r.meal !== meal) throw new Error(`${from} is a ${r.meal}, not a ${meal}`)
  return { ...r, key: `${prefix}-${day.toLowerCase()}-${meal}`, family, day, from }
}

const gfBreakfasts = [
  {
    key: 'gf-a-breakfast', family: 'glutenfree', day: 'A', meal: 'breakfast',
    name: 'Veggie omelette with sweet potato hash',
    desc: 'A three egg omelette with mushrooms and spinach, with crispy paprika sweet potato in place of toast.',
    prep: 10, cook: 15,
    ing: [
      ['Eggs', 'Egg, chicken, whole, raw', 150, '3 eggs', { each: 'egg', g: 50 }],
      ['Sweet potato', 'Sweet potato, orange flesh, peeled, raw', 150, '1/2 medium sweet potato'],
      ['Mushrooms', 'Mushroom, common, raw', 60, '3 mushrooms'],
      ['Baby spinach', 'Spinach, baby, raw', 30, '1 handful'],
      ['Spring onion', 'Onion, spring, raw', 10, '1 stem'],
      ['Olive oil', 'Oil, olive', 8, '2 tsp'],
      ['Smoked paprika', 'Paprika, dried', 1, '1/2 tsp'],
    ],
    steps: [
      'Peel the sweet potato and cut it into 1 cm cubes. Put them in a microwave-safe bowl with 1 tablespoon of water, cover and microwave on high for 4 minutes until just soft.',
      'Heat 1 teaspoon of the olive oil in a non-stick frying pan over medium-high heat. Add the sweet potato, sprinkle with the paprika and a pinch of salt, and cook for 5 to 6 minutes, turning now and then, until golden at the edges. Tip it onto your plate.',
      'Slice the mushrooms and the spring onion.',
      'Add the rest of the olive oil to the pan and cook the mushrooms for 3 minutes until soft. Add the spinach and stir for 30 seconds until it wilts.',
      'Crack the eggs into a bowl, add a pinch of salt and pepper and whisk with a fork.',
      'Turn the heat down to medium-low. Pour the eggs over the vegetables and leave them for 2 minutes. Gently lift the edges with a spatula so the runny egg flows underneath.',
      'When the top is almost set, scatter over the spring onion, fold the omelette in half and slide it onto the plate next to the sweet potato hash.',
    ],
    tip: 'Cook a big batch of the sweet potato on Sunday. It keeps for 3 days in the fridge and reheats in a hot pan in 2 minutes.',
  },
  {
    key: 'gf-b-breakfast', family: 'glutenfree', day: 'B', meal: 'breakfast',
    name: 'Greek yoghurt crunch bowl',
    desc: 'Thick Greek yoghurt with berries, almonds, pepitas and chia. Crunchy like muesli, with no oats or grains.',
    prep: 5, cook: 0,
    ing: [
      ['Greek yoghurt, low fat', 'Yoghurt, Greek style, low fat, natural', 200, '3/4 cup'],
      ['Frozen mixed berries', 'Berries, mixed, frozen', 80, '1/2 cup'],
      ['Almonds', 'Almond, with skin, raw', 15, '12 almonds'],
      ['Pepitas (pumpkin seeds)', 'Seed, pumpkin, hulled, dried', 10, '1 tbsp'],
      ['Chia seeds', 'Seed, chia, dried', 10, '2 tsp'],
      ['Honey', 'Honey', 10, '1 1/2 tsp'],
    ],
    steps: [
      'Put the frozen berries in a small bowl and microwave for 40 to 60 seconds until just thawed and juicy. Or put them in the fridge the night before.',
      'Roughly chop the almonds on a board.',
      'Spoon the Greek yoghurt into a bowl and stir in the chia seeds.',
      'Tip the berries and their juice over the yoghurt.',
      'Scatter the chopped almonds and pepitas on top and drizzle with the honey.',
    ],
    tip: 'Most plain Greek yoghurt is gluten free, but check the label says so.',
  },
  {
    key: 'gf-c-breakfast', family: 'glutenfree', day: 'C', meal: 'breakfast',
    name: 'Smoked salmon, egg and avocado rice cakes',
    desc: 'Crunchy rice cakes with smashed avocado, smoked salmon and a soft boiled egg. A Sunday cafe breakfast at home.',
    prep: 5, cook: 8,
    ing: [
      ['Plain rice cakes', 'Rice cake, plain', 30, '3 rice cakes', { each: 'rice cake', g: 10 }],
      ['Eggs', 'Egg, chicken, whole, raw', 100, '2 eggs', { each: 'egg', g: 50 }],
      ['Smoked salmon', 'Salmon, smoked, sliced', 60, '3 slices'],
      ['Avocado', 'Avocado, raw', 50, '1/3 avocado'],
      ['Lemon juice', 'Lemon, juice', 5, '1 tsp'],
      ['Fresh chives', 'Chives, raw', 3, '1 tbsp chopped'],
    ],
    steps: [
      'Bring a small saucepan of water to the boil. Lower the eggs in gently with a spoon and boil them for 8 minutes.',
      'Lift the eggs into a bowl of cold water and leave them for 2 minutes, then peel and slice them.',
      'While the eggs cook, scoop the avocado into a bowl, add the lemon juice and a pinch of salt and pepper, and mash with a fork.',
      'Spread the avocado over the rice cakes.',
      'Top with the smoked salmon and the sliced egg, then snip or scatter the chives over the top. Eat straight away so the rice cakes stay crunchy.',
    ],
    tip: 'Pick rice cakes labelled gluten free. Boil extra eggs: peeled, they keep for 2 days in a sealed container in the fridge.',
  },
]

module.exports = [
  // ---------------------------------------------------------------- High protein
  // The highest protein recipe for each meal, keeping the same main food off a day twice.
  reuse('veg-a-breakfast', 'highprotein', 'hp', 'A', 'breakfast'),
  reuse('med-c-lunch', 'highprotein', 'hp', 'A', 'lunch'),
  reuse('pes-c-dinner', 'highprotein', 'hp', 'A', 'dinner'),
  reuse('pes-b-snack', 'highprotein', 'hp', 'A', 'snack'),
  reuse('bud-c-breakfast', 'highprotein', 'hp', 'B', 'breakfast'),
  reuse('med-a-lunch', 'highprotein', 'hp', 'B', 'lunch'),
  reuse('bal-a-dinner', 'highprotein', 'hp', 'B', 'dinner'),
  reuse('veg-b-snack', 'highprotein', 'hp', 'B', 'snack'),
  reuse('pes-c-breakfast', 'highprotein', 'hp', 'C', 'breakfast'),
  reuse('pes-b-lunch', 'highprotein', 'hp', 'C', 'lunch'),
  reuse('bal-c-dinner', 'highprotein', 'hp', 'C', 'dinner'),
  reuse('veg-a-snack', 'highprotein', 'hp', 'C', 'snack'),

  // ---------------------------------------------------------------- Gluten free
  gfBreakfasts[0],
  reuse('med-b-lunch', 'glutenfree', 'gf', 'A', 'lunch'),
  reuse('pes-c-dinner', 'glutenfree', 'gf', 'A', 'dinner'),
  reuse('vgn-b-snack', 'glutenfree', 'gf', 'A', 'snack'),
  gfBreakfasts[1],
  reuse('vgn-a-lunch', 'glutenfree', 'gf', 'B', 'lunch'),
  reuse('bud-a-dinner', 'glutenfree', 'gf', 'B', 'dinner'),
  reuse('pes-b-snack', 'glutenfree', 'gf', 'B', 'snack'),
  gfBreakfasts[2],
  reuse('veg-c-lunch', 'glutenfree', 'gf', 'C', 'lunch'),
  reuse('bal-c-dinner', 'glutenfree', 'gf', 'C', 'dinner'),
  reuse('med-c-snack', 'glutenfree', 'gf', 'C', 'snack'),

  // ---------------------------------------------------------------- Dairy free
  reuse('bud-b-breakfast', 'dairyfree', 'df', 'A', 'breakfast'),
  reuse('bal-a-lunch', 'dairyfree', 'df', 'A', 'lunch'),
  reuse('pes-a-dinner', 'dairyfree', 'df', 'A', 'dinner'),
  reuse('vgn-b-snack', 'dairyfree', 'df', 'A', 'snack'),
  reuse('vgn-a-breakfast', 'dairyfree', 'df', 'B', 'breakfast'),
  reuse('pes-a-lunch', 'dairyfree', 'df', 'B', 'lunch'),
  reuse('med-a-dinner', 'dairyfree', 'df', 'B', 'dinner'),
  reuse('pes-a-snack', 'dairyfree', 'df', 'B', 'snack'),
  reuse('vgn-b-breakfast', 'dairyfree', 'df', 'C', 'breakfast'),
  reuse('med-c-lunch', 'dairyfree', 'df', 'C', 'lunch'),
  reuse('bal-c-dinner', 'dairyfree', 'df', 'C', 'dinner'),
  reuse('vgn-c-snack', 'dairyfree', 'df', 'C', 'snack'),
]

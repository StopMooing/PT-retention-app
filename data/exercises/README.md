# Exercise library source

The global exercise library is written here, one file per area, and turned into SQL by
`build.py`. `current.json` is the library as it was before the November 2026 rebuild.

Format of each entry:

    ## New Name | Muscle group | equipment | category | was Old Name | aka other, names
    how: one step of the how-to (2 to 4 lines)
    cue: one coaching cue (3 lines)

- `was` links the entry to an existing exercise, so its id, programs, logs and PBs stay.
  Leave it out when the name is unchanged. An entry with a new name and no `was` is added.
- The old name becomes an alternative name, so search, saved AI workouts and the AI
  program builder still find it.
- `## merge Old Name > Kept Name` moves everything from one exercise to another (programs,
  logs, PBs, coach videos, alternative names) and then removes the duplicate.

Naming: the movement first, the kit in brackets, seated or standing at the front when
people really do both: "Seated Arnold Press (Dumbbell)", "Bench Press (Barbell)".

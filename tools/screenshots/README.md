# Screenshot harness

Runs the real built app in a headless browser against made-up sample data (a coach, six
clients, a program, workouts, check-ins). Supabase is faked inside the browser by
`mock.cjs`, so nothing touches the real database and no real login is needed.

    npm run build && npx vite preview --port 4173 &
    NODE_PATH=$(npm root -g) node tools/screenshots/shoot.cjs plan.json

`plan.json` is a list of shots, for example:

    [{ "role": "client", "path": "/my-workout", "out": "/tmp/home.png", "theme": "dark",
       "steps": [{ "click": "Progress", "exact": true }] }]

role is "client", "coach" or null (signed out). Set BASE=http://localhost:4174 to use
another port. Writes made by the app are kept in memory for that shot only.

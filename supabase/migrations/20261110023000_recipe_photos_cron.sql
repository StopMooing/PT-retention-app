-- Calls the recipe-photos edge function every hour. It fills missing recipe photos a few
-- at a time (a new Unsplash app gets 50 requests an hour) and does nothing once every
-- dish has its photo. The key in the header is the public anon key (already in the app).
select cron.schedule(
  'unfnshd-recipe-photos',
  '7 * * * *',
  $$select net.http_post(
      url := 'https://ksataubrattfspjpftlk.supabase.co/functions/v1/recipe-photos',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYXRhdWJyYXR0ZnNwanBmdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjcxNTksImV4cCI6MjA5MjUwMzE1OX0.Aq_aDRG5Op4lAii5Fk_7Mxe37Stf7MPfAxcU_6GYCSY'),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
  )$$
);

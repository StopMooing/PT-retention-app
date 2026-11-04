# UNFNSHD auth email templates (Supabase)

Paste into Supabase: Authentication, Emails, Templates. Each template has a Subject and a
Message body (switch the body to source/HTML and paste the whole file).

| Template | Subject | File |
|---|---|---|
| Reset password | Reset your UNFNSHD password | reset-password.html |
| Confirm sign up | Confirm your email for UNFNSHD | confirm-signup.html |
| Change email address | Confirm your new email for UNFNSHD | change-email.html |

Sent from no-reply@unfnshd.app through Resend (custom SMTP, set up 4 Nov 2026).
Colours are the light-mode brand colours, written out because email apps ignore CSS variables.

Links go to {{ .SiteURL }}/auth/confirm?token_hash=...&type=... (unfnshd.app), not to
supabase.co: one site in the email reads as more trustworthy to spam filters. The app
checks the token (App.jsx, CONFIRM_AT_LOAD): recovery opens the new password page,
email and email_change go into the app. Site URL in Supabase must stay https://unfnshd.app.

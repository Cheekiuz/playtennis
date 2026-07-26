# Google Sign-In Setup (Supabase Auth)

Enable Google OAuth so users can sign in and manage court alerts from any device.

## 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Authorized redirect URIs — add your Supabase callback URL:
   ```
   https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
   ```
4. Copy **Client ID** and **Client Secret**

## 2. Supabase Dashboard

1. **Authentication → Providers → Google** — enable and paste Client ID + Secret
2. **Authentication → URL Configuration**
   - Site URL: `https://www.playtennis.lt`
   - Redirect URLs:
     - `https://www.playtennis.lt/auth/callback`
     - `http://localhost:3000/auth/callback`

## 3. Environment variables

Add to Vercel and `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR-PROJECT-REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Keep existing server-only keys:

```
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```

## 4. Verify

1. Visit `/dashboard` — you should be redirected to Google sign-in
2. After login, alerts created on this browser are migrated automatically
3. New alerts are tied to your Google account (same ID as Supabase `auth.users`)

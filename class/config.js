/* ==========================================================================
   Supabase connection details, shared by class.html and class_display.html.

   Get these from the Supabase dashboard: Project Settings → API.
   The anon/public key is meant to be public — it ships in the page source —
   access control lives in the Row Level Security policies (see schema.sql),
   not in keeping this key secret.
   ========================================================================== */

window.NG_CLASS_CONFIG = {
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR-ANON-KEY'
};

(function initSupabaseClient() {
  if (typeof APP_CONFIG === 'undefined') return;
  window.supabase = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);
})();

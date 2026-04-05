const Profile = (() => {
  async function render(container) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <h2 class="text-2xl font-bold">Settings & Profile</h2>
        
        <!-- Profile Info Card -->
        <div class="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div class="flex items-center gap-6 mb-8">
            <div class="relative group">
              <img id="profile-avatar-large" src="/favicon.svg" class="w-24 h-24 rounded-full border-4 border-[var(--accent)] object-cover" />
              <label class="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                📷
                <input type="file" class="hidden" />
              </label>
            </div>
            <div>
              <h3 class="text-xl font-bold">Student Name</h3>
              <p class="text-[var(--text-secondary)]">student@example.com</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <h4 class="font-bold text-sm uppercase tracking-wider text-[var(--text-secondary)]">Basic Info</h4>
              <input type="text" placeholder="Display Name" class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none" />
              <button class="w-full bg-[var(--accent)] text-white font-bold py-3 rounded-xl">Save Changes</button>
            </div>
            <div class="space-y-4">
              <h4 class="font-bold text-sm uppercase tracking-wider text-[var(--text-secondary)]">Security</h4>
              <button class="w-full border border-[var(--border)] py-3 rounded-xl font-semibold">Change Password</button>
              <button class="w-full border border-[var(--border)] py-3 rounded-xl font-semibold">Link Educator/Tutor</button>
            </div>
          </div>
        </div>

        <!-- Preferences Section (Collapsible Cards) -->
        <div class="space-y-4">
          <details class="group bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden" open>
            <summary class="p-6 font-bold cursor-pointer list-none flex items-center justify-between">
              Appearance & Accessibility
              <span class="group-open:rotate-180 transition">▼</span>
            </summary>
            <div class="p-6 pt-0 border-t border-[var(--border)] space-y-4">
               <div class="flex items-center justify-between">
                 <span class="font-bold text-sm">Dark Mode</span>
                 <button id="theme-toggle-btn" class="w-12 h-6 bg-[var(--border)] rounded-full relative transition">
                   <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition transform translate-x-0 dark:translate-x-6"></div>
                 </button>
               </div>
               <div class="flex items-center justify-between">
                 <span class="font-bold text-sm">High Contrast</span>
                 <input type="checkbox" id="high-contrast-toggle" class="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)]" ${localStorage.getItem('highContrast') === '1' ? 'checked' : ''} />
               </div>
               <div class="flex items-center justify-between">
                 <span class="font-bold text-sm">Dyslexia Mode</span>
                 <input type="checkbox" id="dyslexia-toggle" class="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)]" ${localStorage.getItem('dyslexiaMode') === '1' ? 'checked' : ''} />
               </div>
               <div class="flex items-center justify-between">
                 <span class="font-bold text-sm">Language</span>
                 <select id="language-select" class="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-1 text-xs font-bold">
                   <option value="en" ${localStorage.getItem('language') === 'en' ? 'selected' : ''}>English</option>
                   <option value="sw" ${localStorage.getItem('language') === 'sw' ? 'selected' : ''}>Swahili</option>
                 </select>
               </div>
            </div>
          </details>

          <details class="group bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <summary class="p-6 font-bold cursor-pointer list-none flex items-center justify-between">
              AI Configuration
              <span class="group-open:rotate-180 transition">▼</span>
            </summary>
            <div class="p-6 pt-0 border-t border-[var(--border)] space-y-4">
              <div>
                <label class="text-sm font-semibold mb-1 block">Preferred Provider</label>
                <select class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3">
                  <option>DeepSeek</option>
                  <option>OpenAI</option>
                  <option>Claude</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-semibold mb-1 block">API Key (ALPHA Encoded)</label>
                <input type="password" class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3" />
              </div>
            </div>
          </details>
          
        <!-- Sync & Data Section -->
        <div class="space-y-4">
          <details class="group bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <summary class="p-6 font-bold cursor-pointer list-none flex items-center justify-between">
              Sync & Data
              <span class="group-open:rotate-180 transition">▼</span>
            </summary>
            <div class="p-6 pt-0 border-t border-[var(--border)] space-y-4">
              <button class="w-full border border-[var(--border)] py-3 rounded-xl font-semibold">Force Offline Sync</button>
              <button id="admin-panel-btn" class="w-full bg-black text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition">Open Admin Panel</button>
            </div>
          </details>
        </div>
      </div>
    `;

    container.querySelector('#admin-panel-btn')?.addEventListener('click', () => {
      App.switchTab('admin');
    });

    container.querySelector('#theme-toggle-btn')?.addEventListener('click', () => {
      UI.toggleTheme();
      render(container);
    });

    container.querySelector('#high-contrast-toggle')?.addEventListener('change', () => {
      UI.toggleHighContrast();
    });

    container.querySelector('#dyslexia-toggle')?.addEventListener('change', () => {
      UI.toggleDyslexia();
    });

    container.querySelector('#language-select')?.addEventListener('change', (e) => {
      Translation.changeLanguage(e.target.value);
    });

    if (window.UI?.applyTranslations) UI.applyTranslations();
  }

  return { render };
})();
window.Profile = Profile;

const UI = (() => {
  function initTheme() {
    const saved = localStorage.getItem('theme') || APP_CONFIG.theme;
    applyTheme(saved);
    applyAccessibility();
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }

  function applyAccessibility() {
    const dyslexia = localStorage.getItem('dyslexiaMode') === '1';
    document.documentElement.classList.toggle('dyslexia-mode', dyslexia);
    const perf = localStorage.getItem('performanceMode') === '1';
    document.documentElement.classList.toggle('performance-mode', perf);
    const highContrast = localStorage.getItem('highContrast') === '1';
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }

  function toggleDyslexia() {
    const current = localStorage.getItem('dyslexiaMode') === '1';
    localStorage.setItem('dyslexiaMode', current ? '0' : '1');
    applyAccessibility();
    showNotification(`Dyslexia Mode ${!current ? 'Enabled' : 'Disabled'}`, 'info');
  }

  function toggleHighContrast() {
    const current = localStorage.getItem('highContrast') === '1';
    localStorage.setItem('highContrast', current ? '0' : '1');
    applyAccessibility();
    showNotification(`High Contrast ${!current ? 'Enabled' : 'Disabled'}`, 'info');
  }

  function toggleTheme() {
    const current = localStorage.getItem('theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    showNotification(`Theme set to ${next}`, 'info');
  }

  function showNotification(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center gap-3 animate-in slide-in-from-right duration-300`;
    
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span class="text-sm font-medium">${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function createToastContainer() {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'fixed bottom-20 md:bottom-6 right-6 z-[2000] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(el);
    return el;
  }

  function showGlobalLoader(text = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 z-[3000] bg-[var(--bg-primary)]/80 backdrop-blur-sm flex items-center justify-center';
    loader.innerHTML = `
      <div class="relative flex flex-col items-center gap-4">
        <div class="relative flex items-center justify-center">
          <img src="/favicon.svg" class="w-12 h-12 animate-pulse absolute z-10" />
          <div class="w-16 h-16 rounded-full border-t-4 border-b-4 border-[var(--accent)] animate-spin"></div>
        </div>
        <div class="text-sm font-semibold animate-pulse">${text}</div>
      </div>
    `;
    document.body.appendChild(loader);
  }

  function hideGlobalLoader() {
    document.getElementById('global-loader')?.remove();
  }

  function applyTranslations() {
    if (window.i18next?.isInitialized) {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = window.i18next.t(el.dataset.i18n);
      });
    }
  }

  return { initTheme, applyTheme, toggleTheme, toggleDyslexia, toggleHighContrast, showNotification, showGlobalLoader, hideGlobalLoader, applyTranslations };
})();
window.UI = UI;

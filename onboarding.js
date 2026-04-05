const Onboarding = (() => {
  async function runSplashDemo() {
    const container = document.getElementById('viewport-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div class="relative">
          <img src="/favicon.svg" class="w-24 h-24 animate-bounce" alt="StudyHub Logo" />
          <div class="absolute -top-2 -right-2 bg-[var(--accent)] text-white text-xs font-bold px-2 py-1 rounded-full">DEMO</div>
        </div>
        
        <div class="max-w-2xl space-y-4">
          <h1 class="text-4xl md:text-6xl font-black tracking-tight">Master Your Studies with AI</h1>
          <p class="text-xl text-[var(--text-secondary)]">Experience the future of learning. Practice papers, instant marking, and smart flashcards—all in one place.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
            <span class="text-4xl block mb-4">📝</span>
            <h3 class="font-bold mb-2">AI Papers</h3>
            <p class="text-sm text-[var(--text-secondary)]">Generate practice questions for any topic in seconds.</p>
          </div>
          <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
            <span class="text-4xl block mb-4">⚡</span>
            <h3 class="font-bold mb-2">Instant Marking</h3>
            <p class="text-sm text-[var(--text-secondary)]">Get immediate feedback and detailed error analysis.</p>
          </div>
          <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition">
            <span class="text-4xl block mb-4">🧠</span>
            <h3 class="font-bold mb-2">Smart Review</h3>
            <p class="text-sm text-[var(--text-secondary)]">Spaced repetition flashcards built from your mistakes.</p>
          </div>
        </div>

        <div class="flex gap-4">
          <button id="demo-start-btn" class="bg-[var(--accent)] text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:scale-105 transition">Try the Demo</button>
          <button id="demo-login-btn" class="bg-[var(--bg-secondary)] border border-[var(--border)] font-bold px-8 py-4 rounded-2xl hover:bg-black/5 transition">Login / Sign Up</button>
        </div>
      </div>
    `;

    document.getElementById('demo-start-btn')?.addEventListener('click', () => {
      UI.showNotification('Starting demo session...', 'success');
      // Mock a study session
      App.switchTab('study');
    });

    document.getElementById('demo-login-btn')?.addEventListener('click', () => {
      Auth.showLoginModal();
    });
  }

  function startTour() {
    console.log("Tour started");
  }

  return { runSplashDemo, startTour };
})();
window.Onboarding = Onboarding;

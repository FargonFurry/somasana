const Dashboard = (() => {
  let _cachedStats = null;

  function renderSkeleton(container) {
    container.innerHTML = `
      <div class="space-y-8 animate-pulse">
        <header class="flex items-center justify-between">
          <div class="h-10 w-48 bg-[var(--border)] rounded-xl"></div>
          <div class="flex gap-4">
            <div class="h-14 w-32 bg-[var(--border)] rounded-2xl"></div>
            <div class="h-14 w-32 bg-[var(--border)] rounded-2xl"></div>
          </div>
        </header>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="h-48 bg-[var(--border)] rounded-[40px]"></div>
              <div class="h-48 bg-[var(--border)] rounded-[40px]"></div>
            </div>
            <div class="h-64 bg-[var(--border)] rounded-[40px]"></div>
          </div>
          <div class="h-96 bg-[var(--border)] rounded-[40px]"></div>
        </div>
      </div>
    `;
  }

  async function render(container) {
    const user = Auth.currentUser();
    if (!user) {
      if (window.Onboarding?.runSplashDemo) window.Onboarding.runSplashDemo();
      return;
    }

    // Show skeleton if no cache
    if (!_cachedStats) renderSkeleton(container);

    try {
      const { stats, recentPapers, recommendation } = await Health.monitor('Dashboard.loadData', async () => {
        const [statsRes, papersRes, recRes] = await Promise.all([
          supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('papers').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
          LearningIntel.getRecommendations()
        ]);
        if (statsRes.error) throw statsRes.error;
        if (papersRes.error) throw papersRes.error;
        return { stats: statsRes.data, recentPapers: papersRes.data, recommendation: recRes };
      }, { showLoader: false });
      
      _cachedStats = { stats, recentPapers, recommendation };

      container.innerHTML = `
        <div class="space-y-8 animate-in fade-in duration-700">
          <header class="flex items-center justify-between">
            <div>
              <h1 class="text-4xl font-black tracking-tight" data-i18n="welcome">Welcome Back</h1>
              <p class="text-[var(--text-secondary)] font-medium mt-1">${recommendation}</p>
            </div>
            <div class="flex gap-4">
              <div class="bg-[var(--bg-secondary)] px-6 py-3 rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-3">
                <span class="text-xl" aria-hidden="true">🔥</span>
                <div>
                  <div class="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Streak</div>
                  <div class="font-bold text-sm">${stats?.streak || 0} Days</div>
                </div>
              </div>
              <div class="bg-[var(--bg-secondary)] px-6 py-3 rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-3">
                <span class="text-xl" aria-hidden="true">💰</span>
                <div>
                  <div class="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Coins</div>
                  <div class="font-bold text-sm">${stats?.study_coins || 0}</div>
                </div>
              </div>
            </div>
          </header>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Main Stats -->
            <div class="lg:col-span-2 space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-[var(--accent)] p-8 rounded-[40px] text-white shadow-xl shadow-[var(--accent)]/20 relative overflow-hidden group">
                  <div class="absolute -right-4 -bottom-4 text-9xl opacity-10 group-hover:scale-110 transition duration-700" aria-hidden="true">📚</div>
                  <h3 class="font-bold text-lg mb-1">Study Time</h3>
                  <div class="text-4xl font-black mb-4">${Math.round((stats?.total_study_minutes || 0) / 60)}h ${stats?.total_study_minutes % 60 || 0}m</div>
                  <button onclick="App.switchTab('study')" class="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-2 rounded-xl text-sm font-bold transition" aria-label="Start Study Session">Start Session</button>
                </div>
                <div class="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm relative overflow-hidden group">
                  <div class="absolute -right-4 -bottom-4 text-9xl opacity-5 group-hover:scale-110 transition duration-700" aria-hidden="true">🎯</div>
                  <h3 class="font-bold text-lg mb-1 text-[var(--text-secondary)]">Accuracy</h3>
                  <div class="text-4xl font-black mb-4">${stats?.average_accuracy || 0}%</div>
                  <div class="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden">
                    <div class="bg-green-500 h-full transition-all duration-1000" style="width: ${stats?.average_accuracy || 0}%"></div>
                  </div>
                </div>
              </div>

              <div class="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm space-y-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold tracking-tight">Recent Activity</h3>
                  <button onclick="App.switchTab('study')" class="text-xs font-bold text-[var(--accent)] hover:underline uppercase tracking-widest">View All</button>
                </div>
                <div class="space-y-4">
                  ${(recentPapers || []).map(p => `
                    <div class="flex items-center justify-between p-4 rounded-3xl bg-[var(--bg-primary)]/50 border border-[var(--border)] hover:border-[var(--accent)] transition cursor-pointer group" onclick="App.switchTab('study', { paperId: '${p.id}' })">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition" aria-hidden="true">📝</div>
                        <div>
                          <div class="font-bold text-sm">${p.topic}</div>
                          <div class="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest">${new Date(p.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="font-black text-[var(--accent)]">${p.score}%</div>
                        <div class="text-[8px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Accuracy</div>
                      </div>
                    </div>
                  `).join('') || `
                    <div class="text-center py-12 space-y-4">
                      <div class="text-4xl opacity-20" aria-hidden="true">📝</div>
                      <p class="text-sm text-[var(--text-secondary)]">No papers generated yet. Start your first session to see activity!</p>
                      <button onclick="App.switchTab('study')" class="bg-[var(--accent)] text-white px-6 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition">Generate Paper</button>
                    </div>
                  `}
                </div>
              </div>
            </div>

            <!-- Sidebar Widgets -->
            <div class="space-y-8">
              <div class="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm space-y-6">
                <h3 class="text-xl font-bold tracking-tight">Level ${stats?.level || 1}</h3>
                <div class="space-y-2">
                  <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    <span>XP: ${stats?.xp || 0}</span>
                    <span>Next: ${(stats?.level || 1) * 1000}</span>
                  </div>
                  <div class="w-full bg-[var(--bg-primary)] h-3 rounded-full overflow-hidden p-0.5">
                    <div class="bg-gradient-to-r from-[var(--accent)] to-purple-500 h-full rounded-full transition-all duration-1000" style="width: ${(stats?.xp || 0) / ((stats?.level || 1) * 10)}%"></div>
                  </div>
                </div>
                <div class="pt-4 grid grid-cols-3 gap-2">
                  ${[1,2,3].map(i => `<div class="aspect-square rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-xl grayscale opacity-30" aria-hidden="true">🔒</div>`).join('')}
                </div>
              </div>

              <div class="bg-black p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition duration-500" aria-hidden="true">✨</div>
                <h3 class="font-bold text-lg mb-2">Upgrade to Pro</h3>
                <p class="text-xs text-gray-400 mb-6">Unlock unlimited AI papers and advanced analytics.</p>
                <button class="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition" aria-label="Upgrade to Pro Plan">Get Started</button>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Dashboard error:', err);
      container.innerHTML = `<div class="text-center py-20 text-[var(--text-secondary)]">Failed to load dashboard. Please try again.</div>`;
    }
  }

  return { render };
})();
window.Dashboard = Dashboard;

const Badges = (() => {
  const badges = [
    { id: 'first_paper', name: 'First Step', icon: '🌱', description: 'Generated your first AI practice paper.' },
    { id: 'perfect_score', name: 'Mastery', icon: '🏆', description: 'Achieved 100% accuracy on a practice paper.' },
    { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: 'Maintained a 7-day study streak.' },
    { id: 'social_butterfly', name: 'Social Butterfly', icon: '🦋', description: 'Added 5 friends to your study circle.' }
  ];

  async function render(container) {
    const user = Auth.currentUser();
    if (!user) return;

    const { data: userBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', user.id);
    const earnedIds = new Set((userBadges || []).map(b => b.badge_id));

    container.innerHTML = `
      <div class="space-y-8 animate-in fade-in duration-500">
        <h2 class="text-3xl font-black tracking-tight">Your Badges</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${badges.map(badge => {
            const earned = earnedIds.has(badge.id);
            return `
              <div class="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-all duration-300 group ${!earned ? 'grayscale opacity-50' : ''}">
                <div class="w-24 h-24 rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-5xl group-hover:scale-110 transition duration-500">${badge.icon}</div>
                <div>
                  <h3 class="font-bold text-lg">${badge.name}</h3>
                  <p class="text-xs text-[var(--text-secondary)] mt-1">${badge.description}</p>
                </div>
                ${earned ? `<span class="bg-green-100 text-green-700 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Earned</span>` : `<span class="bg-gray-100 text-gray-500 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Locked</span>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  async function awardBadge(badgeId) {
    const user = Auth.currentUser();
    if (!user) return;
    const { data } = await supabase.from('user_badges').select('*').eq('user_id', user.id).eq('badge_id', badgeId).maybeSingle();
    if (data) return; // Already earned

    await supabase.from('user_badges').insert([{ user_id: user.id, badge_id: badgeId }]);
    UI.showNotification(`New Badge Earned: ${badgeId}!`, 'success');
    await Gamification.awardXP(user.id, 100, 'badge_earned');
  }

  return { render, awardBadge };
})();
window.Badges = Badges;

const Shop = (() => {
  const items = [
    { id: 'streak_freeze', name: 'Streak Freeze', price: 50, icon: '❄️', description: 'Keeps your streak alive for 1 day.' },
    { id: 'xp_boost', name: 'XP Boost (2x)', price: 100, icon: '⚡', description: 'Double XP for 1 hour.' },
    { id: 'avatar_frame', name: 'Golden Frame', price: 200, icon: '✨', description: 'Show off your status with a golden frame.' },
    { id: 'cosmetic_cat', name: 'Study Cat', price: 150, icon: '🐱', description: 'A cute cat for your dashboard.' }
  ];

  async function render(container) {
    const user = Auth.currentUser();
    if (!user) return;

    const { data: stats } = await supabase.from('user_stats').select('study_coins').eq('user_id', user.id).maybeSingle();
    const coins = stats?.study_coins || 0;

    container.innerHTML = `
      <div class="space-y-8 animate-in fade-in duration-500">
        <div class="flex items-center justify-between">
          <h2 class="text-3xl font-black tracking-tight">Study Shop</h2>
          <div class="bg-[var(--accent)] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-[var(--accent)]/20">
            <span class="text-xl">💰</span>
            <span>${coins} StudyCoins</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${items.map(item => `
            <div class="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4 group">
              <div class="w-24 h-24 rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-5xl group-hover:scale-110 transition duration-500">${item.icon}</div>
              <div>
                <h3 class="font-bold text-lg">${item.name}</h3>
                <p class="text-xs text-[var(--text-secondary)] mt-1">${item.description}</p>
              </div>
              <button class="buy-btn w-full bg-[var(--accent)] text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition transform active:scale-95" 
                data-id="${item.id}" data-price="${item.price}">
                Buy for ${item.price} 💰
              </button>
            </div>
          `).join('')}
        </div>

        <div class="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm space-y-6">
          <h3 class="text-xl font-bold tracking-tight">Avatar Customization</h3>
          <div class="flex flex-wrap gap-4">
            ${['👤', '🐱', '🐶', '🦊', '🐨', '🦁', '🐯', '🐸'].map(avatar => `
              <button class="avatar-select w-16 h-16 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-3xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition" data-avatar="${avatar}">
                ${avatar}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.buy-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const price = parseInt(btn.dataset.price);
        if (coins < price) return UI.showNotification('Not enough StudyCoins!', 'error');
        
        UI.showGlobalLoader('Processing purchase...');
        try {
          await supabase.from('user_stats').update({ study_coins: coins - price }).eq('user_id', user.id);
          await supabase.from('user_inventory').insert([{ user_id: user.id, item_id: id }]);
          UI.showNotification(`Purchased ${id}!`, 'success');
          render(container);
        } catch (e) {
          UI.showNotification('Purchase failed', 'error');
        } finally {
          UI.hideGlobalLoader();
        }
      };
    });

    container.querySelectorAll('.avatar-select').forEach(btn => {
      btn.onclick = async () => {
        const avatar = btn.dataset.avatar;
        UI.showGlobalLoader('Updating avatar...');
        await supabase.from('profiles').update({ avatar_url: avatar }).eq('id', user.id);
        UI.hideGlobalLoader();
        UI.showNotification('Avatar updated!', 'success');
        document.getElementById('user-avatar').src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${avatar}</text></svg>`;
      };
    });
  }

  return { render };
})();
window.Shop = Shop;

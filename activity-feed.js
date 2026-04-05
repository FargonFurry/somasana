const ActivityFeed = (() => {
  async function render(container) {
    const user = Auth.currentUser();
    if (!user) return;

    const { data: feed } = await supabase.from('activity_feed')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20);

    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-500">
        <h2 class="text-2xl font-black tracking-tight">Activity Feed</h2>
        <div id="feed-list" class="space-y-4">
          ${(feed || []).map(item => `
            <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4 hover:shadow-md transition group">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <img src="${item.profiles?.avatar_url || '/favicon.svg'}" class="w-10 h-10 rounded-full border border-[var(--border)]" />
                  <div>
                    <div class="font-bold text-sm">${item.profiles?.username || 'Student'}</div>
                    <div class="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest">${new Date(item.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div class="bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">${item.type}</div>
              </div>
              
              <p class="text-sm leading-relaxed text-[var(--text-secondary)]">${item.content}</p>
              
              <div class="flex items-center gap-6 pt-2 border-t border-[var(--border)]">
                <button class="like-btn flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-red-500 transition" data-id="${item.id}">
                  <span class="text-lg">❤️</span> ${item.likes || 0}
                </button>
                <button class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition">
                  <span class="text-lg">💬</span> ${item.comments || 0}
                </button>
              </div>
            </div>
          `).join('') || '<div class="text-center py-20 opacity-40">No activity yet. Be the first to share!</div>'}
        </div>
      </div>
    `;

    container.querySelectorAll('.like-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        await supabase.rpc('increment_likes', { post_id: id });
        UI.showNotification('Liked!', 'success');
        render(container);
      };
    });
  }

  async function postActivity(type, content) {
    const user = Auth.currentUser();
    if (!user) return;
    await supabase.from('activity_feed').insert([{ user_id: user.id, type, content }]);
  }

  return { render, postActivity };
})();
window.ActivityFeed = ActivityFeed;

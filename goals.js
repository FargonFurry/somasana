const Goals = (() => {
  async function addGoal(text, category) {
    const user = Auth.currentUser();
    if (!user) return;
    try {
      const { error } = await supabase.from('goals').insert([{ user_id: user.id, text, category, status: 'pending' }]);
      if (error) throw error;
      UI.showNotification('Goal added!', 'success');
    } catch (e) {
      console.error('Error adding goal:', e);
      UI.showNotification('Failed to add goal', 'error');
    }
  }

  async function toggleGoal(id, status) {
    try {
      const newStatus = status === 'pending' ? 'completed' : 'pending';
      await supabase.from('goals').update({ status: newStatus }).eq('id', id);
      UI.showNotification('Goal updated!', 'success');
    } catch (e) {
      console.error('Error updating goal:', e);
    }
  }

  async function render(container) {
    const user = Auth.currentUser();
    if (!user) return;

    const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Add Goal Form -->
        <div class="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border)] space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">New Goal</h4>
          <div class="flex flex-col sm:flex-row gap-3">
            <input id="goal-input" type="text" placeholder="What's your goal?" class="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)] transition" />
            <select id="goal-category" class="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)] transition">
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Long-term">Long-term</option>
            </select>
            <button id="add-goal-btn" class="bg-[var(--accent)] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:opacity-90 transition">Save</button>
          </div>
        </div>

        <!-- Goals List -->
        <div id="goals-list-container" class="space-y-3">
          ${(goals || []).map(g => `
            <div class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition group">
              <div class="flex items-center gap-4">
                <input type="checkbox" class="goal-checkbox w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer" 
                  data-id="${g.id}" data-status="${g.status}" ${g.status === 'completed' ? 'checked' : ''} />
                <div class="${g.status === 'completed' ? 'line-through opacity-50' : ''}">
                  <div class="font-bold text-sm">${g.text}</div>
                  <div class="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest">${g.category}</div>
                </div>
              </div>
              <button class="delete-goal-btn opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition p-2" data-id="${g.id}">🗑️</button>
            </div>
          `).join('') || '<div class="text-center py-8 text-[var(--text-secondary)] opacity-50">No goals yet. Start small!</div>'}
        </div>
      </div>
    `;

    // Event Listeners
    container.querySelector('#add-goal-btn')?.addEventListener('click', async () => {
      const text = container.querySelector('#goal-input').value.trim();
      const category = container.querySelector('#goal-category').value;
      if (!text) return UI.showNotification('Enter a goal first', 'warning');
      
      await addGoal(text, category);
      render(container); // Refresh list
    });

    container.querySelectorAll('.goal-checkbox').forEach(cb => {
      cb.addEventListener('change', async () => {
        await toggleGoal(cb.dataset.id, cb.dataset.status);
        render(container); // Refresh list
      });
    });

    container.querySelectorAll('.delete-goal-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this goal?')) {
          await supabase.from('goals').delete().eq('id', btn.dataset.id);
          render(container); // Refresh list
        }
      });
    });

    if (window.UI?.applyTranslations) UI.applyTranslations();
  }

  return { render, addGoal };
})();
window.Goals = Goals;

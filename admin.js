const Admin = (() => {
  let _isAdmin = false;

  async function render(container) {
    if (!_isAdmin) {
      renderLogin(container);
      return;
    }

    container.innerHTML = `
      <div class="space-y-8 animate-in fade-in duration-500">
        <div class="flex items-center justify-between">
          <h2 class="text-3xl font-black tracking-tight">Admin Control Panel</h2>
          <button id="admin-logout" class="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs">Logout Admin</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
            <h3 class="font-bold mb-4">System Health</h3>
            <div id="admin-health-stats" class="space-y-2 text-sm">
              <div class="flex justify-between"><span>Logs:</span> <span class="font-mono">${Health.getLogs().length}</span></div>
              <div class="flex justify-between"><span>Status:</span> <span class="text-green-500 font-bold">Online</span></div>
            </div>
          </div>
          <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
            <h3 class="font-bold mb-4">User Reports</h3>
            <div id="admin-reports-count" class="text-3xl font-black">0</div>
          </div>
          <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
            <h3 class="font-bold mb-4">Recommendations</h3>
            <div id="admin-recs-count" class="text-3xl font-black">0</div>
          </div>
        </div>

        <div class="bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border)] overflow-hidden">
          <div class="p-6 border-b border-[var(--border)] bg-[var(--bg-primary)] font-bold flex justify-between items-center">
            <span>Bug Reports & Feedback</span>
            <button id="refresh-reports" class="text-xs text-[var(--accent)] font-bold">Refresh</button>
          </div>
          <div id="admin-reports-list" class="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            <div class="text-center py-10 text-[var(--text-secondary)]">No reports found.</div>
          </div>
        </div>

        <div class="bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border)] overflow-hidden">
          <div class="p-6 border-b border-[var(--border)] bg-[var(--bg-primary)] font-bold">User Management</div>
          <div class="p-6">
            <div class="flex gap-4 mb-6">
              <input id="ban-user-id" type="text" placeholder="User ID to ban..." class="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2 outline-none" />
              <button id="ban-btn" class="bg-red-500 text-white px-6 py-2 rounded-xl font-bold">Ban Account</button>
            </div>
            <div id="admin-users-list" class="space-y-2">
               <!-- Users list -->
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#admin-logout').onclick = () => {
      _isAdmin = false;
      render(container);
    };

    container.querySelector('#refresh-reports').onclick = () => loadReports(container);
    container.querySelector('#ban-btn').onclick = () => banUser(container);

    loadReports(container);
  }

  function renderLogin(container) {
    container.innerHTML = `
      <div class="max-w-md mx-auto mt-20 p-10 bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border)] shadow-2xl space-y-8 animate-in zoom-in-95">
        <div class="text-center space-y-2">
          <div class="text-5xl mb-4">🔐</div>
          <h2 class="text-3xl font-bold tracking-tight">Admin Access</h2>
          <p class="text-[var(--text-secondary)] text-sm">Authorized personnel only.</p>
        </div>
        <div class="space-y-4">
          <input type="password" id="admin-pass" placeholder="Admin Password" class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[var(--accent)] transition" />
          <button id="admin-login-btn" class="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition transform active:scale-95">
            Unlock Panel
          </button>
        </div>
      </div>
    `;

    container.querySelector('#admin-login-btn').onclick = () => {
      const pass = container.querySelector('#admin-pass').value;
      if (pass === 'Coolkid@2026') {
        _isAdmin = true;
        render(container);
        UI.showNotification('Admin Mode Active', 'success');
      } else {
        UI.showNotification('Invalid Admin Password', 'error');
      }
    };
  }

  async function loadReports(container) {
    const list = container.querySelector('#admin-reports-list');
    const countEl = container.querySelector('#admin-reports-count');
    
    // In a real app, we'd fetch from a 'reports' table
    // For now, we'll show health logs as a proxy or mock
    const logs = Health.getLogs().filter(l => l.type === 'error');
    countEl.textContent = logs.length;

    if (logs.length === 0) {
      list.innerHTML = `<div class="text-center py-10 text-[var(--text-secondary)]">No reports found.</div>`;
    } else {
      list.innerHTML = logs.map(log => `
        <div class="p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] text-xs space-y-2">
          <div class="flex justify-between font-bold">
            <span class="text-red-500">${log.context}</span>
            <span class="text-[var(--text-secondary)]">${new Date(log.timestamp).toLocaleString()}</span>
          </div>
          <p class="text-[var(--text-primary)]">${log.message}</p>
        </div>
      `).join('');
    }
  }

  async function banUser(container) {
    const userId = container.querySelector('#ban-user-id').value.trim();
    if (!userId) return;
    
    UI.showGlobalLoader('Banning user...');
    try {
      // In a real app, we'd update a 'profiles' table with 'is_banned: true'
      // and have a trigger or RLS to prevent access.
      const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
      if (error) throw error;
      UI.showNotification(`User ${userId} has been banned.`, 'success');
      container.querySelector('#ban-user-id').value = '';
    } catch (e) {
      UI.showNotification('Failed to ban user', 'error');
    } finally {
      UI.hideGlobalLoader();
    }
  }

  return { render };
})();
window.Admin = Admin;

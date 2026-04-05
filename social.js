const Social = (() => {
  let presenceChannel = null;
  let onlineUsers = new Set();

  async function initPresence() {
    const user = Auth.currentUser();
    if (!user) return;

    presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        onlineUsers = new Set(Object.keys(state));
        updateOnlineStatusUI();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });
  }

  function updateOnlineStatusUI() {
    document.querySelectorAll('.user-status-dot').forEach(dot => {
      const userId = dot.dataset.userId;
      if (onlineUsers.has(userId)) {
        dot.classList.remove('bg-gray-400');
        dot.classList.add('bg-green-500');
      } else {
        dot.classList.remove('bg-green-500');
        dot.classList.add('bg-gray-400');
      }
    });
  }

  // E2EE Messaging logic (AES-GCM)
  async function generateKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  }

  async function encryptMessage(text, password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await generateKey(password, salt);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
    
    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  async function decryptMessage(payload, password) {
    const dec = new TextDecoder();
    const salt = new Uint8Array(atob(payload.salt).split("").map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(payload.iv).split("").map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(payload.ciphertext).split("").map(c => c.charCodeAt(0)));
    const key = await generateKey(password, salt);
    
    try {
      const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
      return dec.decode(decrypted);
    } catch (e) {
      return "[Decryption Failed]";
    }
  }

  async function render(container) {
    container.innerHTML = `
      <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="flex items-center justify-between">
          <h2 class="text-3xl font-black tracking-tight">Community</h2>
          <div class="flex gap-2">
            <button id="tab-friends" class="px-4 py-2 rounded-xl font-bold bg-[var(--accent)] text-white">Friends</button>
            <button id="tab-forum" class="px-4 py-2 rounded-xl font-bold hover:bg-black/5 transition">Forum</button>
            <button id="tab-chapters" class="px-4 py-2 rounded-xl font-bold hover:bg-black/5 transition">Chapters</button>
            <button id="tab-feed" class="px-4 py-2 rounded-xl font-bold hover:bg-black/5 transition">Feed</button>
          </div>
        </div>

        <div id="social-content">
          <!-- Friends list will load here -->
        </div>
      </div>
    `;

    const content = container.querySelector('#social-content');
    
    container.querySelector('#tab-friends').onclick = () => {
      container.querySelectorAll('.flex.gap-2 button').forEach(b => b.classList.remove('bg-[var(--accent)]', 'text-white'));
      container.querySelector('#tab-friends').classList.add('bg-[var(--accent)]', 'text-white');
      if (window.CommunityFriends) window.CommunityFriends.render(content);
    };

    container.querySelector('#tab-forum').onclick = () => {
      container.querySelectorAll('.flex.gap-2 button').forEach(b => b.classList.remove('bg-[var(--accent)]', 'text-white'));
      container.querySelector('#tab-forum').classList.add('bg-[var(--accent)]', 'text-white');
      renderForum(content);
    };

    container.querySelector('#tab-chapters').onclick = () => {
      container.querySelectorAll('.flex.gap-2 button').forEach(b => b.classList.remove('bg-[var(--accent)]', 'text-white'));
      container.querySelector('#tab-chapters').classList.add('bg-[var(--accent)]', 'text-white');
      renderChapters(content);
    };

    container.querySelector('#tab-feed').onclick = () => {
      container.querySelectorAll('.flex.gap-2 button').forEach(b => b.classList.remove('bg-[var(--accent)]', 'text-white'));
      container.querySelector('#tab-feed').classList.add('bg-[var(--accent)]', 'text-white');
      if (window.ActivityFeed) window.ActivityFeed.render(content);
    };

    if (window.CommunityFriends) {
      window.CommunityFriends.render(content);
    }

    initPresence();
  }

  async function renderForum(container) {
    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-300">
        <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4">
          <h3 class="font-bold">Create a Discussion</h3>
          <textarea id="forum-post-text" placeholder="Ask a question or share a study tip..." class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-4 h-32 outline-none focus:ring-2 focus:ring-[var(--accent)] transition"></textarea>
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" id="hint-only-toggle" class="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" />
              <span class="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition uppercase tracking-widest">Hint-Only Mode (Anti-Cheat)</span>
            </label>
            <button id="post-btn" class="bg-[var(--accent)] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:opacity-90 transition">Post to Forum</button>
          </div>
        </div>
        <div id="forum-posts" class="space-y-4">
          <!-- Posts will load here -->
        </div>
      </div>
    `;

    const postsList = container.querySelector('#forum-posts');
    const { data: posts } = await supabase.from('forum_posts').select('*').order('created_at', { ascending: false });
    
    if (!posts || posts.length === 0) {
      postsList.innerHTML = `<div class="text-center p-12 text-[var(--text-secondary)]">No discussions yet. Be the first!</div>`;
    } else {
      postsList.innerHTML = posts.map(p => `
        <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xs">👤</div>
            <div class="text-xs font-bold">User ${p.user_id.slice(0, 5)}</div>
            ${p.hint_only ? `<span class="bg-yellow-100 text-yellow-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Hint-Only</span>` : ''}
          </div>
          <p class="text-sm text-[var(--text-secondary)]">${p.content}</p>
          <div class="flex gap-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
            <button class="hover:text-[var(--accent)] transition">Reply</button>
            <button class="hover:text-[var(--accent)] transition">Upvote (${p.upvotes || 0})</button>
          </div>
        </div>
      `).join('');
    }

    container.querySelector('#post-btn').onclick = async () => {
      const content = container.querySelector('#forum-post-text').value.trim();
      const hintOnly = container.querySelector('#hint-only-toggle').checked;
      if (!content) return;
      
      UI.showGlobalLoader('Posting...');
      await supabase.from('forum_posts').insert([{ 
        user_id: Auth.currentUser()?.id, 
        content, 
        hint_only: hintOnly 
      }]);
      if (window.ActivityFeed) await window.ActivityFeed.postActivity('forum', `Started a new discussion: ${content.slice(0, 50)}...`);
      UI.hideGlobalLoader();
      UI.showNotification('Posted successfully!', 'success');
      renderForum(container);
    };
  }

  async function renderChapters(container) {
    container.innerHTML = `
      <div class="space-y-6 animate-in fade-in duration-300">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold">Study Chapters & Events</h3>
          <button id="create-event-btn" class="bg-[var(--accent)] text-white px-4 py-2 rounded-xl font-bold text-xs">Create Event</button>
        </div>
        <div id="events-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Events will load here -->
        </div>
      </div>
    `;

    const eventsList = container.querySelector('#events-list');
    const { data: events } = await supabase.from('events').select('*').order('date', { ascending: true });

    if (!events || events.length === 0) {
      eventsList.innerHTML = `<div class="col-span-full text-center p-12 opacity-40">No upcoming events.</div>`;
    } else {
      eventsList.innerHTML = events.map(e => `
        <div class="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4 hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <span class="bg-blue-100 text-blue-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">${e.category || 'Study'}</span>
            <span class="text-[10px] font-bold text-[var(--text-secondary)]">${new Date(e.date).toLocaleDateString()}</span>
          </div>
          <h4 class="font-bold text-lg">${e.title}</h4>
          <p class="text-xs text-[var(--text-secondary)] line-clamp-2">${e.description}</p>
          <div class="flex items-center justify-between pt-2">
            <div class="flex -space-x-2">
              ${[1,2,3].map(() => `<div class="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px]">👤</div>`).join('')}
              <div class="w-6 h-6 rounded-full border-2 border-white bg-[var(--bg-primary)] flex items-center justify-center text-[8px] font-bold">+${e.attendees || 0}</div>
            </div>
            <button class="rsvp-btn bg-[var(--bg-primary)] border border-[var(--border)] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition" data-id="${e.id}">RSVP</button>
          </div>
        </div>
      `).join('');
    }

    container.querySelectorAll('.rsvp-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        await supabase.rpc('increment_attendees', { event_id: id });
        UI.showNotification('RSVP successful!', 'success');
        renderChapters(container);
      };
    });
  }

  return { render, encryptMessage, decryptMessage, onlineUsers };
})();
window.Social = Social;

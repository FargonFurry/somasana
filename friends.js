const CommunityFriends = (() => {
  async function render(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">Friends</h2>
          <button id="add-friend-btn" class="bg-[var(--accent)] text-white px-4 py-2 rounded-xl font-semibold">Add Friend</button>
        </div>
        <div id="friends-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Friends will be loaded here -->
        </div>
      </div>
    `;

    // Example of Event Delegation for accepting requests
    container.addEventListener('click', async (e) => {
      if (e.target.classList.contains('accept-request-btn')) {
        const requestId = e.target.dataset.id;
        await acceptRequest(requestId);
      }
    });

    const friendsList = container.querySelector('#friends-list');
    const user = Auth.currentUser();
    if (!user) return;

    const { data: friends } = await supabase.from('friends').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    
    if (!friends || friends.length === 0) {
      friendsList.innerHTML = `<div class="col-span-full text-center p-12 bg-black/5 rounded-3xl border border-dashed border-[var(--border)] text-[var(--text-secondary)]">No friends found. Add some to start studying together!</div>`;
    } else {
      friendsList.innerHTML = friends.map(f => {
        const isFriend = f.status === 'accepted';
        const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
        const isOnline = window.Social?.onlineUsers?.has(friendId);
        
        return `
          <div class="bg-[var(--bg-secondary)] p-5 rounded-3xl border border-[var(--border)] shadow-sm flex items-center justify-between hover:shadow-md transition group">
            <div class="flex items-center gap-4">
              <div class="relative">
                <img src="/favicon.svg" class="w-12 h-12 rounded-full border border-[var(--border)]" />
                <div class="user-status-dot absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}" data-user-id="${friendId}"></div>
              </div>
              <div>
                <div class="font-bold text-sm">User ${friendId.slice(0, 5)}</div>
                <div class="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest">${f.status}</div>
              </div>
            </div>
            <div class="flex gap-2">
              ${f.status === 'pending' && f.friend_id === user.id ? `
                <button class="accept-request-btn bg-[var(--accent)] text-white px-4 py-2 rounded-xl text-xs font-bold" data-id="${f.id}">Accept</button>
              ` : ''}
              ${isFriend ? `
                <button class="message-btn bg-[var(--bg-primary)] border border-[var(--border)] p-2 rounded-xl hover:bg-black/5 transition" data-id="${friendId}">💬</button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    // Messaging Event
    container.querySelectorAll('.message-btn').forEach(btn => {
      btn.onclick = () => openChat(btn.dataset.id);
    });

    if (window.UI?.applyTranslations) UI.applyTranslations();
  }

  async function openChat(friendId) {
    const password = prompt('Enter E2EE Chat Password (must be shared with friend):');
    if (!password) return;

    const chatModal = document.createElement('div');
    chatModal.className = 'fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4';
    chatModal.innerHTML = `
      <div class="bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border)] w-full max-w-lg h-[600px] flex flex-col overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xl">👤</div>
            <div>
              <div class="font-bold">Chat with ${friendId.slice(0, 5)}</div>
              <div class="text-[10px] text-green-500 font-bold uppercase tracking-widest">End-to-End Encrypted</div>
            </div>
          </div>
          <button id="close-chat" class="text-[var(--text-secondary)] hover:text-red-500 transition">✕</button>
        </div>
        <div id="chat-body" class="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--bg-primary)]/30"></div>
        <div class="p-6 border-t border-[var(--border)] flex gap-2">
          <input type="text" id="msg-input" placeholder="Type a secure message..." class="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)] transition" />
          <button id="send-msg" class="bg-[var(--accent)] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:opacity-90 transition">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(chatModal);

    const chatBody = chatModal.querySelector('#chat-body');
    const msgInput = chatModal.querySelector('#msg-input');
    const sendBtn = chatModal.querySelector('#send-msg');

    chatModal.querySelector('#close-chat').onclick = () => chatModal.remove();

    // Subscribe to messages
    const channel = supabase.channel(`chat_${[Auth.currentUser().id, friendId].sort().join('_')}`)
      .on('broadcast', { event: 'message' }, async ({ payload }) => {
        const decrypted = await window.Social.decryptMessage(payload, password);
        appendMessage(decrypted, 'friend');
      })
      .subscribe();

    sendBtn.onclick = async () => {
      const text = msgInput.value.trim();
      if (!text) return;
      const encrypted = await window.Social.encryptMessage(text, password);
      await channel.send({ type: 'broadcast', event: 'message', payload: encrypted });
      appendMessage(text, 'me');
      msgInput.value = '';
    };

    function appendMessage(text, side) {
      const msg = document.createElement('div');
      msg.className = `flex ${side === 'me' ? 'justify-end' : 'justify-start'}`;
      msg.innerHTML = `
        <div class="max-w-[80%] p-4 rounded-3xl text-sm ${side === 'me' ? 'bg-[var(--accent)] text-white rounded-tr-none' : 'bg-[var(--bg-secondary)] border border-[var(--border)] rounded-tl-none'}">
          ${text}
        </div>
      `;
      chatBody.appendChild(msg);
      chatBody.scrollTo(0, chatBody.scrollHeight);
    }
  }

  async function acceptRequest(requestId) {
    try {
      await supabase.from('friends').update({ status: 'accepted' }).eq('id', requestId);
      UI.showNotification('Friend request accepted!', 'success');
      
      // Gamification Patch
      if (window.Gamification?.awardStudyCoins) {
        await window.Gamification.awardStudyCoins(Auth.currentUser()?.id, 10, 'friend_accept');
      }
      
      // Re-render or update UI
    } catch (e) {
      UI.showNotification('Error accepting request', 'error');
    }
  }

  return { render };
})();
window.CommunityFriends = CommunityFriends;

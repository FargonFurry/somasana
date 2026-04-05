const Auth = (() => {
  let _userMetadata = null;
  let _state = 'INIT'; // INIT → AUTH_CHECK → UNAUTH → AUTH → ACTIVE → OFFLINE

  function setState(newState) {
    _state = newState;
    Health.log(`Auth state: ${_state}`, 'info');
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: _state }));
  }

  async function init() {
    setState('AUTH_CHECK');
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        localStorage.setItem('userId', session.user.id);
        _userMetadata = session.user.user_metadata;
        updateUIForLoggedIn();
        Gamification.updateStreak(session.user.id);
        setState('AUTH');
        setTimeout(() => setState('ACTIVE'), 500);
      } else {
        localStorage.removeItem('userId');
        _userMetadata = null;
        updateUIForLoggedOut();
        setState('UNAUTH');
      }
    });

    const { data: { session }, error } = await supabase.auth.getSession();
    if (session?.user) {
      _userMetadata = session.user.user_metadata;
      updateUIForLoggedIn();
      Gamification.updateStreak(session.user.id);
      setState('AUTH');
      setTimeout(() => setState('ACTIVE'), 500);
    } else {
      updateUIForLoggedOut();
      setState('UNAUTH');
    }
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password) {
    return password && password.length >= 6;
  }

  function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, ''); // Basic XSS prevention
  }

  function currentUser() {
    const id = localStorage.getItem('userId');
    return id ? { id, metadata: _userMetadata } : null;
  }

  function getState() { return _state; }

  function updateUIForLoggedIn() {
    document.getElementById('user-menu')?.classList.remove('hidden');
    document.getElementById('sidebar')?.classList.remove('hidden');
    document.getElementById('bottom-nav')?.classList.remove('hidden');
    document.getElementById('login-modal')?.classList.add('hidden');
    
    if (_userMetadata?.avatar_url) {
      const avatar = document.getElementById('user-avatar');
      if (avatar) avatar.src = _userMetadata.avatar_url;
    }
  }

  function updateUIForLoggedOut() {
    document.getElementById('user-menu')?.classList.add('hidden');
    document.getElementById('sidebar')?.classList.add('hidden');
    document.getElementById('bottom-nav')?.classList.add('hidden');
    if (window.Onboarding?.runSplashDemo) {
      window.Onboarding.runSplashDemo();
    }
  }

  function showLoginModal(isSignUp = false, initialEmail = '') {
    let modal = document.getElementById('login-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'login-modal';
      modal.className = 'fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div class="bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border)] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div class="p-10 space-y-8">
          <div class="text-center space-y-2">
            <img src="/favicon.svg" class="w-16 h-16 mx-auto mb-4" alt="Logo" />
            <h2 class="text-3xl font-bold tracking-tight">${isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p class="text-[var(--text-secondary)]">${isSignUp ? 'Join StudyHub to start your journey.' : 'Sign in to continue your learning journey.'}</p>
          </div>

          <div class="space-y-4">
            <button id="google-login" class="w-full flex items-center justify-center gap-3 bg-white border border-[var(--border)] py-4 rounded-2xl font-bold hover:bg-gray-50 transition disabled:opacity-50">
              <img src="https://www.google.com/favicon.ico" class="w-5 h-5" />
              Continue with Google
            </button>
            
            <div class="relative flex items-center py-2">
              <div class="flex-grow border-t border-[var(--border)]"></div>
              <span class="flex-shrink mx-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">or</span>
              <div class="flex-grow border-t border-[var(--border)]"></div>
            </div>

            <div class="space-y-3">
              <input type="email" id="auth-email" value="${sanitizeInput(initialEmail)}" placeholder="Email Address" class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[var(--accent)] transition" />
              <input type="password" id="auth-password" placeholder="Password" class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[var(--accent)] transition" />
              <button id="auth-submit" class="w-full bg-[var(--accent)] text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition disabled:opacity-50">
                ${isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>

          <p class="text-center text-sm text-[var(--text-secondary)]">
            ${isSignUp ? 'Already have an account?' : "Don't have an account?"} 
            <a href="#" id="toggle-auth-mode" class="text-[var(--accent)] font-bold hover:underline">
              ${isSignUp ? 'Sign In' : 'Create one'}
            </a>
          </p>
        </div>
        <button id="close-login" class="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
    
    const emailInput = modal.querySelector('#auth-email');
    const passwordInput = modal.querySelector('#auth-password');
    const submitBtn = modal.querySelector('#auth-submit');
    const googleBtn = modal.querySelector('#google-login');

    modal.querySelector('#close-login').onclick = () => modal.classList.add('hidden');
    
    modal.querySelector('#toggle-auth-mode').onclick = (e) => {
      e.preventDefault();
      showLoginModal(!isSignUp, emailInput.value);
    };

    googleBtn.onclick = async () => {
      googleBtn.disabled = true;
      await Health.monitor('Auth.signInWithOAuth', async () => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
      }, { showLoader: true, loaderMessage: 'Connecting to Google...' });
      googleBtn.disabled = false;
    };

    submitBtn.onclick = async () => {
      const email = sanitizeInput(emailInput.value);
      const password = passwordInput.value;
      
      if (!validateEmail(email)) {
        UI.showNotification('Please enter a valid email address', 'warning');
        return;
      }
      if (!validatePassword(password)) {
        UI.showNotification('Password must be at least 6 characters', 'warning');
        return;
      }

      submitBtn.disabled = true;
      
      await Health.monitor(isSignUp ? 'Auth.signUp' : 'Auth.signInWithPassword', async () => {
        const { error } = isSignUp 
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;
        
        UI.showNotification(isSignUp ? 'Account created! Please check your email.' : 'Welcome back!', 'success');
        if (!isSignUp) modal.classList.add('hidden');
      }, { showLoader: true, loaderMessage: isSignUp ? 'Creating account...' : 'Signing in...' });

      submitBtn.disabled = false;
    };
  }

  async function signOut() {
    return Health.monitor('Auth.signOut', async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      UI.showNotification('Logged out successfully', 'success');
      return true;
    }, { showLoader: true, loaderMessage: 'Signing out...' });
  }

  async function verifySession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && _state === 'ACTIVE') {
      Health.log('Session expired, logging out...', 'warning');
      signOut();
    }
  }

  return { init, currentUser, getState, showLoginModal, updateUIForLoggedOut, signOut, verifySession };
})();
window.Auth = Auth;

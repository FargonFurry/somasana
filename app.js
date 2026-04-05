document.addEventListener('DOMContentLoaded', async () => {
  Health.init();
  UI.initTheme();
  if (window.Translation) await window.Translation.init();
  
  // Ensure driver.js loads before onboarding and app
  // (In a real app, we'd use a bundler or dynamic imports, here we rely on HTML order)
  
  await Auth.init();

  const viewportContent = document.getElementById('viewport-content');
  const sidebar = document.getElementById('sidebar');
  const bottomNav = document.getElementById('bottom-nav');

  // Navigation Logic
  const switchTab = async (tabId, saveHistory = true) => {
    if (!tabId) return;
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active', 'text-[var(--accent)]'));
    document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(el => el.classList.add('active', 'text-[var(--accent)]'));
    
    // Persist active tab
    localStorage.setItem('activeTab', tabId);
    
    // Update History
    if (saveHistory) {
      history.pushState({ tabId }, '', `#${tabId}`);
    }
    
    UI.showGlobalLoader();
    
    try {
      switch(tabId) {
        case 'home':
          if (window.Dashboard?.render) await window.Dashboard.render(viewportContent);
          break;
        case 'study':
          if (window.Study?.render) await window.Study.render(viewportContent);
          break;
        case 'plan':
          if (window.Plan?.render) await window.Plan.render(viewportContent);
          break;
        case 'community':
          if (window.Social?.render) await window.Social.render(viewportContent);
          break;
        case 'rewards':
          if (window.Rewards?.render) await window.Rewards.render(viewportContent);
          break;
        case 'profile':
          if (window.Profile?.render) await window.Profile.render(viewportContent);
          break;
        case 'flashcards':
          if (window.Flashcards?.render) await window.Flashcards.render(viewportContent);
          break;
        case 'admin':
          if (window.Admin?.render) await window.Admin.render(viewportContent);
          break;
      }
    } catch (err) {
      console.error(`Error loading tab ${tabId}:`, err);
      UI.showNotification(`Failed to load ${tabId}`, 'error');
    }
    
    UI.hideGlobalLoader();
    if (window.UI?.applyTranslations) UI.applyTranslations();
  };

  window.App = { switchTab };

  // Handle Browser History
  window.addEventListener('popstate', (event) => {
    if (event.state?.tabId) {
      switchTab(event.state.tabId, false);
    } else {
      const hash = window.location.hash.replace('#', '');
      if (hash) switchTab(hash, false);
    }
  });

  // Sidebar & Bottom Nav Events
  document.querySelectorAll('.sidebar-item, .bottom-nav-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // Initial Tab
  const savedTab = localStorage.getItem('activeTab') || window.location.hash.replace('#', '') || 'home';
  
  if (!Auth.currentUser()) {
    if (window.Auth?.updateUIForLoggedOut) window.Auth.updateUIForLoggedOut();
  } else {
    switchTab(savedTab);
  }

  // AI Interface Toggle
  const toggleAi = document.getElementById('toggle-ai-position');
  let aiPos = 'bottom';
  toggleAi?.addEventListener('click', () => {
    const aiInterface = document.getElementById('ai-interface');
    const viewport = document.getElementById('viewport');
    if (aiPos === 'bottom') {
      aiInterface.style.order = '-1';
      aiPos = 'top';
      toggleAi.textContent = 'Move to Bottom';
    } else {
      aiInterface.style.order = '1';
      aiPos = 'bottom';
      toggleAi.textContent = 'Move to Top';
    }
  });

  // Service Worker Registration for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    });
  }
});

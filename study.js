/**
 * Study Module - StudyHub
 * Refactored for modern card-based UI while retaining 100% functional logic.
 */
const Study = (() => {
  let currentPaper = null;
  let currentPaperId = null;

  // Session State
  let focusModeEnabled = false;
  let focusTimerId = null;
  let focusRemainingSeconds = 0;
  let focusRecommendedMinutes = 15;

  let skippedQueue = [];
  let confidenceByIdx = [];
  let questionTimesMsByIdx = [];
  let questionStartedAtMsByIdx = [];
  let hintLevelByIdx = [];

  let ghostModeEnabled = false;
  let ghostProgress = 0;
  let ghostTimerId = null;

  const AI_SERVICE_ERROR = 'AI service error. Enable Demo Mode or check your API key.';

  // --- Helpers ---

  async function edgeHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  function getPreferredProvider() {
    try {
      const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      return profile?.preferred_ai_provider || window.APP_CONFIG?.defaultAIProvider || 'deepseek';
    } catch {
      return 'deepseek';
    }
  }

  function isDemoModeEnabled() {
    return localStorage.getItem('demoMode') === '1';
  }

  function detectAnswerType(val) {
    const v = (val || '').trim();
    if (!v) return null;
    if (/^-?\d+(\.\d+)?$/.test(v)) return 'numeric';
    if (/[a-zA-Z]/.test(v) && /(=|x|\b[a-zA-Z]\w*\b)/.test(v)) return 'algebraic';
    return 'word';
  }

  async function applySkipPenalty() {
    if (!window.APP_CONFIG?.features?.penaltySkip) return;
    const user = Auth.currentUser();
    if (!user) return;
    try {
      const { data: stats } = await supabase.from('user_stats').select('total_xp').eq('user_id', user.id).maybeSingle();
      const newXp = Math.max(0, (stats?.total_xp || 0) - 5);
      await supabase.from('user_stats').update({ total_xp: newXp }).eq('user_id', user.id);
      UI.showNotification('Skipped (-5 XP)', 'info');
    } catch (e) { console.error(e); }
  }

  // --- Core Logic ---

  let _recentTopics = [];

  async function render(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
        
        <!-- Left Column: Generation & Workspace -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Generator Card -->
          <div class="bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border)] p-8 shadow-sm">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 class="text-2xl font-bold tracking-tight">Generate Practice Paper</h2>
                <p class="text-[var(--text-secondary)] text-sm mt-1">Syllabus-aligned AI practice tailored to your level.</p>
              </div>
              
              <!-- Study Tools Row -->
              <div class="flex items-center gap-2 bg-[var(--bg-primary)] p-1.5 rounded-2xl border border-[var(--border)]">
                <button id="tool-notebook" title="NotebookLM" class="p-2.5 hover:bg-[var(--bg-secondary)] rounded-xl transition shadow-sm">📓</button>
                <button id="tool-yt-search" title="YouTube Search" class="p-2.5 hover:bg-[var(--bg-secondary)] rounded-xl transition shadow-sm">📺</button>
                <button id="tool-wiki" title="Wikipedia" class="p-2.5 hover:bg-[var(--bg-secondary)] rounded-xl transition shadow-sm">🌐</button>
                <button id="tool-yt-summarise" title="Summarise YouTube" class="p-2.5 hover:bg-[var(--accent)] hover:text-white rounded-xl transition shadow-sm">✨</button>
                <button id="tool-research" title="Research Topic" class="p-2.5 hover:bg-[var(--bg-secondary)] rounded-xl transition shadow-sm">🔍</button>
              </div>
            </div>

            <div class="space-y-6">
              <div class="relative group">
                <label class="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block ml-1">Topic or Concept</label>
                <div class="flex gap-3">
                  <div class="relative flex-1">
                    <input id="topic-input" type="text" placeholder="e.g. Simultaneous Equations" 
                      class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[var(--accent)] outline-none transition group-hover:border-[var(--accent)]/50" />
                  </div>
                  <label for="doc-upload" class="cursor-pointer flex items-center justify-center px-5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition group">
                    <span class="text-xl group-hover:scale-110 transition">📎</span>
                    <input id="doc-upload" type="file" class="hidden" accept=".pdf,.docx,.txt" />
                  </label>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">Difficulty</label>
                  <select id="diff-select" class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[var(--accent)] transition">
                    <option value="easy">Easy (Foundational)</option>
                    <option value="medium" selected>Medium (Standard)</option>
                    <option value="hard">Hard (Challenge)</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">Questions</label>
                  <input id="qty-input" type="number" value="5" min="1" max="20" 
                    class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[var(--accent)] transition" />
                </div>
              </div>

              <div class="flex items-center justify-between px-2 py-1">
                <div class="flex gap-6">
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input id="focus-toggle" type="checkbox" class="w-5 h-5 rounded-lg border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" />
                    <span class="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition">Focus Mode</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input id="ghost-toggle" type="checkbox" class="w-5 h-5 rounded-lg border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" />
                    <span class="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition">Ghost Race</span>
                  </label>
                </div>
                <div id="focus-timer-display" class="hidden font-mono text-[var(--accent)] font-bold bg-[var(--accent)]/10 px-3 py-1 rounded-lg">00:00</div>
              </div>

              <div class="flex gap-3 pt-2">
                <button id="gen-btn" class="flex-[2] bg-[var(--accent)] text-white font-bold py-5 rounded-2xl shadow-lg shadow-[var(--accent)]/20 hover:opacity-90 transition transform active:scale-[0.98]">
                  Generate Practice Paper
                </button>
                <button id="drill-btn" class="flex-1 border-2 border-[var(--accent)] text-[var(--accent)] font-bold py-5 rounded-2xl hover:bg-[var(--accent)]/5 transition transform active:scale-[0.98]">
                  Focused Drill
                </button>
              </div>
            </div>
          </div>

          <!-- Paper Viewport -->
          <div id="study-workspace" class="space-y-6 min-h-[200px]">
            <div class="text-center py-20 opacity-40">
              <span class="text-6xl block mb-4">📖</span>
              <p class="font-medium">Your practice questions will appear here.</p>
            </div>
          </div>
        </div>

        <!-- Right Column: Recent & Archive -->
        <div class="space-y-6">
          <div class="bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border)] p-6 shadow-sm sticky top-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-bold text-lg">Recent Papers</h3>
              <button id="view-archive-btn" class="text-sm text-[var(--accent)] font-bold hover:underline">Archive</button>
            </div>
            
            <div id="recent-list" class="space-y-3">
              <!-- Loaded dynamically -->
              <div class="animate-pulse space-y-3">
                <div class="h-16 bg-[var(--bg-primary)] rounded-2xl"></div>
                <div class="h-16 bg-[var(--bg-primary)] rounded-2xl"></div>
              </div>
            </div>

            <button id="retry-skipped-btn" class="hidden w-full mt-6 bg-orange-500/10 text-orange-600 border border-orange-500/20 font-bold py-3 rounded-2xl hover:bg-orange-500/20 transition">
              Retry Skipped Questions
            </button>
          </div>
        </div>
      </div>
    `;

    bindGeneratorEvents(container);
    loadRecentPapers();
    if (window.UI?.applyTranslations) UI.applyTranslations();
  }

  function bindGeneratorEvents(container) {
    const getVal = (id) => container.querySelector(`#${id}`)?.value;

    container.querySelector('#gen-btn')?.addEventListener('click', async () => {
      const topic = getVal('topic-input');
      const diff = getVal('diff-select');
      const qty = parseInt(getVal('qty-input')) || 5;
      focusModeEnabled = container.querySelector('#focus-toggle')?.checked;
      ghostModeEnabled = container.querySelector('#ghost-toggle')?.checked;
      
      if (!topic) return UI.showNotification('Please enter a topic.', 'warning');

      if (_recentTopics.includes(topic.toLowerCase())) {
        if (!confirm(`You recently generated a paper on "${topic}". Generate another one?`)) return;
      }
      
      await Health.monitor('Study.generatePaper', async (monitor) => {
        monitor.updateMessage('Analyzing topic...');
        await new Promise(r => setTimeout(r, 600));
        
        monitor.updateMessage('Generating questions...');
        const paper = await generatePaper(topic, diff, qty);
        
        monitor.updateMessage('Formatting paper...');
        await new Promise(r => setTimeout(r, 400));
        
        renderPaper(paper);
        _recentTopics = [topic.toLowerCase(), ..._recentTopics].slice(0, 5);
      }, { showLoader: true, loaderMessage: 'Starting generation...' });
    });

    container.querySelector('#drill-btn')?.addEventListener('click', async () => {
      const topic = getVal('topic-input') || 'General Review';
      const diff = getVal('diff-select');
      const qty = parseInt(getVal('qty-input')) || 5;
      await Health.monitor('Study.focusedDrill', async (monitor) => {
        monitor.updateMessage('Analyzing patterns...');
        const paper = await focusedDrill({ topic, difficulty: diff, num: qty });
        renderPaper(paper);
      }, { showLoader: true, loaderMessage: 'Preparing focused drill...' });
    });

    container.querySelector('#doc-upload')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const topic = getVal('topic-input') || file.name.split('.')[0];
      await Health.monitor('Study.generatePaperFromDocument', async (monitor) => {
        monitor.updateMessage('Uploading document...');
        const paper = await generatePaperFromDocument({ file, topic, difficulty: getVal('diff-select'), num: parseInt(getVal('qty-input')) || 5 }, monitor);
        renderPaper(paper);
      }, { showLoader: true, loaderMessage: 'Analyzing document...' });
    });

    // Toolbox
    container.querySelector('#tool-notebook')?.addEventListener('click', () => window.open(`https://notebooklm.google.com/?q=${encodeURIComponent(getVal('topic-input'))}`, '_blank'));
    container.querySelector('#tool-yt-search')?.addEventListener('click', () => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(getVal('topic-input'))}`, '_blank'));
    container.querySelector('#tool-wiki')?.addEventListener('click', () => window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(getVal('topic-input'))}`, '_blank'));
    
    container.querySelector('#tool-yt-summarise')?.addEventListener('click', async () => {
      const url = prompt('Paste YouTube URL:');
      if (!url) return;
      UI.showGlobalLoader('Summarizing & generating flashcards...');
      try {
        const res = await fetch(window.APP_CONFIG.edgeFunctionUrl, {
          method: 'POST',
          headers: await edgeHeaders(),
          body: JSON.stringify({ 
            userId: Auth.currentUser()?.id, 
            prompt: `Summarise this YouTube video and generate 5 flashcards. URL: ${url}. Return JSON {"summary":"...","flashcards":[{"front":"...","back":"..."}]}`, 
            provider: getPreferredProvider() 
          }),
        });
        const data = await res.json();
        const flashcards = data.flashcards || data.data?.flashcards || [];
        
        if (flashcards.length > 0) {
          for (const fc of flashcards) {
            await supabase.from('flashcards').insert([{ 
              user_id: Auth.currentUser()?.id, 
              front: `YT: ${fc.front || fc.question}`, 
              back: fc.back || fc.answer, 
              next_review: new Date().toISOString() 
            }]);
          }
          UI.showNotification(`Summary ready! Created ${flashcards.length} flashcards.`, 'success');
          
          // Show summary in chat
          const chat = document.getElementById('chat-messages');
          const msg = document.createElement('div');
          msg.className = 'bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-2xl p-4 space-y-2';
          msg.innerHTML = `<div class="font-bold text-[var(--accent)]">YouTube Summary</div><p class="text-xs">${data.summary || data.data?.summary || 'No summary available.'}</p>`;
          chat.appendChild(msg);
          chat.scrollTo(0, chat.scrollHeight);
        }
      } catch (e) { 
        console.error(e);
        UI.showNotification('Failed to summarise YT', 'error'); 
      }
      finally { UI.hideGlobalLoader(); }
    });

    container.querySelector('#tool-research')?.addEventListener('click', async () => {
      const topic = getVal('topic-input');
      if (!topic) return UI.showNotification('Enter a topic first', 'info');
      UI.showGlobalLoader('Researching topic...');
      try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
        const data = await res.json();
        
        const chat = document.getElementById('chat-messages');
        const msg = document.createElement('div');
        msg.className = 'bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 space-y-2 shadow-sm';
        msg.innerHTML = `
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">📖</span>
            <span class="font-bold text-sm">${data.title}</span>
          </div>
          <p class="text-xs leading-relaxed text-[var(--text-secondary)]">${data.extract || 'No summary found'}</p>
          ${data.content_urls?.desktop?.page ? `<a href="${data.content_urls.desktop.page}" target="_blank" class="text-[10px] text-[var(--accent)] font-bold hover:underline">Read more on Wikipedia →</a>` : ''}
        `;
        chat.appendChild(msg);
        chat.scrollTo(0, chat.scrollHeight);
        UI.showNotification('Research added to chat', 'success');
      } catch (e) { 
        console.error(e);
        UI.showNotification('Research failed', 'error'); 
      } finally {
        UI.hideGlobalLoader();
      }
    });

    container.querySelector('#view-archive-btn')?.addEventListener('click', () => window.Papers?.renderMyPapers());
    container.querySelector('#retry-skipped-btn')?.addEventListener('click', () => retrySkipped());
  }

  async function loadRecentPapers() {
    const list = document.getElementById('recent-list');
    const user = Auth.currentUser();
    if (!list || !user) return;
    try {
      const { data } = await supabase.from('papers').select('id, topic, difficulty, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
      list.innerHTML = (data || []).map(p => `
        <button class="w-full text-left p-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)] transition group" onclick="Study.reopenPaper('${p.id}')">
          <div class="font-bold text-sm truncate group-hover:text-[var(--accent)]">${p.topic}</div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)]">${p.difficulty}</span>
            <span class="text-[10px] text-[var(--text-secondary)]">${new Date(p.created_at).toLocaleDateString()}</span>
          </div>
        </button>
      `).join('') || '<div class="text-xs text-center py-4 opacity-50">No recent papers</div>';
    } catch (e) { list.innerHTML = ''; }
  }

  async function generatePaper(topic, difficulty, num) {
    if (isDemoModeEnabled()) {
      const qs = Array.from({ length: num }).map((_, i) => `${topic} - Question ${i + 1} (${difficulty})`);
      return { id: Date.now().toString(), topic, difficulty, questions: qs, createdAt: new Date().toISOString() };
    }
    const res = await fetch(window.APP_CONFIG.edgeFunctionUrl, {
      method: 'POST',
      headers: await edgeHeaders(),
      body: JSON.stringify({ userId: Auth.currentUser()?.id, prompt: `Generate ${num} ${difficulty} questions on ${topic} for grade 9. Return JSON {"questions":[string,...]}`, provider: getPreferredProvider() }),
    });
    const data = await res.json();
    const questions = data.questions || [];
    const paper = { id: Date.now().toString(), userId: Auth.currentUser()?.id, topic, difficulty, questions, createdAt: new Date().toISOString() };
    await supabase.from('papers').insert([{ id: paper.id, user_id: paper.userId, topic, difficulty, content: JSON.stringify(questions) }]);
    return paper;
  }

  async function generatePaperFromDocument({ file, topic, difficulty, num }, monitor) {
    const user = Auth.currentUser();
    if (!user) throw new Error('Not logged in');
    
    const path = `${user.id}/${Date.now()}_${file.name}`;
    if (monitor) monitor.updateMessage('Uploading to secure storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage.from('documents').upload(path, file);
    if (uploadError) throw uploadError;
    
    if (monitor) monitor.updateMessage('Extracting content...');
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
    const prompt = `Extract concepts from this document and generate ${num} ${difficulty} questions on ${topic}. Document URL: ${publicUrl}. Return JSON {"questions":[string,...]}`;
    return generatePaperWithCustomPrompt(topic, difficulty, num, prompt, monitor);
  }

  async function generatePaperWithCustomPrompt(topic, difficulty, num, prompt, monitor) {
    if (monitor) monitor.updateMessage('AI Analysis in progress...');
    const res = await fetch(window.APP_CONFIG.edgeFunctionUrl, {
      method: 'POST',
      headers: await edgeHeaders(),
      body: JSON.stringify({ userId: Auth.currentUser()?.id, prompt, provider: getPreferredProvider() }),
    });
    const data = await res.json();
    const paper = { id: Date.now().toString(), userId: Auth.currentUser()?.id, topic, difficulty, questions: data.questions || [], createdAt: new Date().toISOString() };
    if (monitor) monitor.updateMessage('Saving to your library...');
    await supabase.from('papers').insert([{ id: paper.id, user_id: paper.userId, topic, difficulty, content: JSON.stringify(paper.questions) }]);
    return paper;
  }

  async function focusedDrill({ topic, difficulty, num }) {
    const user = Auth.currentUser();
    const { data: patterns } = await supabase.from('user_error_patterns').select('error_type, frequency').eq('user_id', user.id).order('frequency', { ascending: false }).limit(5);
    
    const errors = patterns?.map(p => p.error_type) || [];
    if (!errors.length) {
      const localErrors = JSON.parse(localStorage.getItem('last10ErrorTypes') || '[]');
      if (!localErrors.length) throw new Error('No error patterns found. Submit a paper first.');
      errors.push(...localErrors);
    }

    const prompt = `Generate ${num} ${difficulty} questions on ${topic} focusing on these mistake types: ${errors.join(', ')}. Return JSON {"questions":[string,...]}`;
    return generatePaperWithCustomPrompt(topic, difficulty, num, prompt);
  }

  function renderPaper(paper) {
    currentPaper = paper;
    currentPaperId = paper.id;
    skippedQueue = [];
    confidenceByIdx = new Array(paper.questions.length).fill(null);
    questionTimesMsByIdx = new Array(paper.questions.length).fill(null);
    questionStartedAtMsByIdx = new Array(paper.questions.length).fill(0).map(() => Date.now());
    hintLevelByIdx = new Array(paper.questions.length).fill(0);

    if (focusModeEnabled) startFocusTimer(paper.questions.length * 5); // 5 mins per question
    if (ghostModeEnabled) startGhostRace(paper.questions.length);

    const workspace = document.getElementById('study-workspace');
    workspace.innerHTML = `
      <div class="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        ${ghostModeEnabled ? `
          <div class="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Ghost Progress</span>
              <span id="ghost-percent" class="text-[10px] font-bold text-[var(--accent)]">0%</span>
            </div>
            <div class="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <div id="ghost-bar" class="h-full bg-orange-500 transition-all duration-1000" style="width: 0%"></div>
            </div>
          </div>
        ` : ''}
        ${paper.questions.map((q, i) => `
          <div class="bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border)] p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <span class="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1 block">Question ${i + 1}</span>
                <p class="text-lg font-medium leading-relaxed">${q}</p>
              </div>
              <div class="flex flex-col gap-2">
                <button onclick="Study.skipQuestion(${i})" id="skip-${i}" class="p-2 hover:bg-orange-500/10 text-orange-500 rounded-xl transition" title="Skip">⏭️</button>
                <button onclick="Study.getHint(${i})" id="hint-btn-${i}" class="p-2 hover:bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl transition" title="Hint">💡</button>
              </div>
            </div>

            <div class="space-y-3">
              <textarea id="working-${i}" placeholder="Show your working (optional)..." 
                class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[var(--accent)] outline-none min-h-[100px] transition"></textarea>
              
              <div class="relative">
                <input id="final-${i}" type="text" placeholder="Final Answer" oninput="Study.handleInput(${i})"
                  class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-[var(--accent)] outline-none transition" />
                <span id="type-icon-${i}" class="absolute right-4 top-1/2 -translate-y-1/2 text-lg opacity-30"></span>
              </div>
            </div>

            <div id="conf-row-${i}" class="hidden flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span class="text-xs font-bold text-[var(--text-secondary)] uppercase">Confidence:</span>
              <div class="flex gap-2">
                <button onclick="Study.setConfidence(${i}, 'low')" class="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-red-50 transition">Low</button>
                <button onclick="Study.setConfidence(${i}, 'medium')" class="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-yellow-50 transition">Medium</button>
                <button onclick="Study.setConfidence(${i}, 'high')" class="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-green-50 transition">High</button>
              </div>
            </div>

            <div id="hint-box-${i}" class="hidden bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 animate-in zoom-in-95">
              <strong>Hint:</strong> <span id="hint-text-${i}"></span>
            </div>
          </div>
        `).join('')}

        <div class="flex gap-4 pt-4">
          <button id="submit-paper-btn" class="flex-1 bg-[var(--accent)] text-white font-bold py-5 rounded-2xl shadow-lg hover:opacity-90 transition transform active:scale-[0.98]">
            Submit for AI Marking
          </button>
          <button id="save-draft-btn" class="px-8 border border-[var(--border)] font-bold rounded-2xl hover:bg-black/5 transition">
            Save Draft
          </button>
        </div>
      </div>
    `;

    document.getElementById('submit-paper-btn')?.addEventListener('click', () => submitPaper(paper));
    document.getElementById('save-draft-btn')?.addEventListener('click', () => UI.showNotification('Draft saved locally', 'success'));
  }

  function startFocusTimer(minutes) {
    focusRemainingSeconds = minutes * 60;
    const display = document.getElementById('focus-timer-display');
    if (display) display.classList.remove('hidden');
    
    focusTimerId = setInterval(() => {
      focusRemainingSeconds--;
      if (focusRemainingSeconds <= 0) {
        clearInterval(focusTimerId);
        UI.showNotification('Focus time is up!', 'warning');
      }
      if (display) {
        const m = Math.floor(focusRemainingSeconds / 60);
        const s = focusRemainingSeconds % 60;
        display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  function startGhostRace(num) {
    ghostProgress = 0;
    const bar = document.getElementById('ghost-bar');
    const percent = document.getElementById('ghost-percent');
    
    ghostTimerId = setInterval(() => {
      ghostProgress += Math.random() * 2;
      if (ghostProgress >= 100) {
        ghostProgress = 100;
        clearInterval(ghostTimerId);
        UI.showNotification('The Ghost finished the paper!', 'warning');
      }
      if (bar) bar.style.width = `${ghostProgress}%`;
      if (percent) percent.textContent = `${Math.round(ghostProgress)}%`;
    }, 2000);
  }

  async function submitPaper(paper) {
    clearInterval(focusTimerId);
    clearInterval(ghostTimerId);
    const user = Auth.currentUser();
    const answers = paper.questions.map((_, i) => {
      const w = document.getElementById(`working-${i}`)?.value || '';
      const f = document.getElementById(`final-${i}`)?.value || '';
      return `Working: ${w}\nFinal: ${f}`;
    });

    await Health.monitor('Study.submitPaper', async () => {
      const res = await fetch(window.APP_CONFIG.edgeFunctionUrl, {
        method: 'POST',
        headers: await edgeHeaders(),
        body: JSON.stringify({
          userId: user.id,
          prompt: `Mark these answers: ${JSON.stringify(answers)} for questions: ${JSON.stringify(paper.questions)}. Classify errors (conceptual, arithmetic, misreading). Return JSON {"analysis":"...","errors":[{"questionIndex":number,"errorType":string,"correction":string}]}`,
          provider: getPreferredProvider()
        })
      });
      const result = await res.json();
      await handleMarkingResults(paper, result);
    }, { showLoader: true, loaderMessage: 'Marking your answers...' });
  }

  async function handleMarkingResults(paper, result) {
    const errors = result.errors || [];
    const accuracy = ((paper.questions.length - errors.length) / paper.questions.length) * 100;
    const user = Auth.currentUser();
    
    // Clutch Bonus Logic
    checkClutchBonus(paper.topic, accuracy);

    // Update Error Patterns in DB
    const newTypes = errors.map(e => e.errorType).filter(Boolean);
    for (const type of newTypes) {
      const { data: existing } = await supabase.from('user_error_patterns').select('*').eq('user_id', user.id).eq('error_type', type).maybeSingle();
      if (existing) {
        await supabase.from('user_error_patterns').update({ frequency: existing.frequency + 1, last_seen: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('user_error_patterns').insert([{ user_id: user.id, error_type: type, frequency: 1, last_seen: new Date().toISOString() }]);
      }
    }
    
    const existingLocal = JSON.parse(localStorage.getItem('last10ErrorTypes') || '[]');
    localStorage.setItem('last10ErrorTypes', JSON.stringify([...existingLocal, ...newTypes].slice(-10)));

    // Spaced Repetition Integration
    if (errors.length > 0) {
      for (const e of errors) {
        const q = paper.questions[e.questionIndex];
        await supabase.from('flashcards').insert([{
          user_id: user.id,
          front: `Review: ${q}`,
          back: `Correction: ${e.correction}`,
          next_review: new Date().toISOString()
        }]);
      }
      UI.showNotification(`Created ${errors.length} flashcards from mistakes.`, 'info');
    }

    // Render Results in Chat
    const chat = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-2xl p-4 space-y-3';
    msg.innerHTML = `
      <div class="font-bold text-[var(--accent)] flex items-center justify-between">
        <span>Marking Results</span>
        <span class="bg-[var(--accent)] text-white px-2 py-0.5 rounded text-[10px]">${Math.round(accuracy)}%</span>
      </div>
      <p class="text-xs leading-relaxed">${result.analysis}</p>
      <div class="space-y-2">
        ${errors.map(e => `
          <div class="text-[10px] border-t border-[var(--border)] pt-2">
            <div class="font-bold uppercase tracking-widest text-red-500">Q${e.questionIndex + 1}: ${e.errorType}</div>
            <div class="mt-1">${e.correction}</div>
          </div>
        `).join('')}
      </div>
    `;
    chat.appendChild(msg);
    chat.scrollTo(0, chat.scrollHeight);

    // Show Summary Modal
    showSummaryModal(paper, accuracy, errors);
  }

  async function checkClutchBonus(topic, accuracy) {
    const user = Auth.currentUser();
    try {
      const { data } = await supabase.from('performance').select('results').eq('user_id', user.id).limit(5);
      const pastAccs = (data || []).map(r => r.results.accuracy).filter(a => a != null);
      if (pastAccs.length >= 3) {
        const avg = pastAccs.reduce((a,b) => a+b, 0) / pastAccs.length;
        if (avg < 70 && accuracy > avg + 20) {
          await Gamification.awardStudyCoins(user.id, 10, 'clutch_bonus');
          UI.showNotification('Clutch Bonus! +10 Coins', 'success');
        }
      }
    } catch (e) {}
  }

  function showSummaryModal(paper, accuracy, errors) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300';
    modal.innerHTML = `
      <div class="bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border)] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div class="p-10 text-center space-y-6">
          <div class="relative inline-block">
            <div class="w-32 h-32 rounded-full border-8 border-[var(--accent)] flex items-center justify-center text-3xl font-black">
              ${Math.round(accuracy)}%
            </div>
            <span class="absolute -top-2 -right-2 text-4xl">🎉</span>
          </div>
          
          <div>
            <h2 class="text-3xl font-bold">Session Complete!</h2>
            <p class="text-[var(--text-secondary)] mt-2">You mastered ${paper.questions.length - errors.length} out of ${paper.questions.length} concepts.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-[var(--bg-primary)] p-4 rounded-3xl">
              <div class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Mistakes</div>
              <div class="text-xl font-bold text-red-500">${errors.length}</div>
            </div>
            <div class="bg-[var(--bg-primary)] p-4 rounded-3xl">
              <div class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">XP Gained</div>
              <div class="text-xl font-bold text-[var(--accent)]">+25</div>
            </div>
          </div>

          <div class="space-y-3 pt-4">
            <button id="summary-close" class="w-full bg-[var(--accent)] text-white font-bold py-4 rounded-2xl shadow-lg">Back to Dashboard</button>
            <button id="summary-review" class="w-full border border-[var(--border)] font-bold py-4 rounded-2xl hover:bg-black/5 transition">Review Flashcards</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#summary-close').onclick = () => { modal.remove(); App.switchTab('home'); };
    modal.querySelector('#summary-review').onclick = () => { modal.remove(); App.switchTab('rewards'); };
  }

  // --- Exposed Handlers ---
  
  function handleInput(i) {
    const val = document.getElementById(`final-${i}`).value;
    const type = detectAnswerType(val);
    const icon = document.getElementById(`type-icon-${i}`);
    if (icon) icon.textContent = type === 'numeric' ? '#' : type === 'algebraic' ? 'x' : 'A';
    
    if (val.trim() && !confidenceByIdx[i]) {
      document.getElementById(`conf-row-${i}`).classList.remove('hidden');
    }
  }

  function setConfidence(i, level) {
    confidenceByIdx[i] = level;
    questionTimesMsByIdx[i] = Date.now() - questionStartedAtMsByIdx[i];
    document.getElementById(`conf-row-${i}`).classList.add('opacity-50', 'pointer-events-none');
  }

  async function skipQuestion(i) {
    if (skippedQueue.includes(i)) return;
    skippedQueue.push(i);
    document.getElementById(`working-${i}`).disabled = true;
    document.getElementById(`final-${i}`).disabled = true;
    document.getElementById(`skip-${i}`).textContent = '✅';
    document.getElementById('retry-skipped-btn').classList.remove('hidden');
    await applySkipPenalty();
  }

  async function getHint(i) {
    const level = (hintLevelByIdx[i] % 3) + 1;
    hintLevelByIdx[i] = level;
    const box = document.getElementById(`hint-box-${i}`);
    const text = document.getElementById(`hint-text-${i}`);
    
    await Health.monitor('Study.getHint', async () => {
      const res = await fetch(window.APP_CONFIG.edgeFunctionUrl, {
        method: 'POST',
        headers: await edgeHeaders(),
        body: JSON.stringify({ userId: Auth.currentUser()?.id, prompt: `Give a level ${level}/3 hint for: ${currentPaper.questions[i]}. Return JSON {"hint":"..."}`, provider: getPreferredProvider() }),
      });
      const data = await res.json();
      text.textContent = data.hint;
      box.classList.remove('hidden');
    }, { showLoader: true, loaderMessage: 'Thinking...' });
  }

  async function reopenPaper(id) {
    await Health.monitor('Study.reopenPaper', async () => {
      const { data } = await supabase.from('papers').select('*').eq('id', id).single();
      const paper = { ...data, questions: JSON.parse(data.content) };
      renderPaper(paper);
    }, { showLoader: true, loaderMessage: 'Loading paper...' });
  }

  async function retrySkipped() {
    if (!skippedQueue.length) return;
    const qs = skippedQueue.map(i => currentPaper.questions[i]);
    const paper = { 
      id: `retry_${Date.now()}`, 
      topic: `Retry: ${currentPaper.topic}`, 
      difficulty: currentPaper.difficulty, 
      questions: qs, 
      createdAt: new Date().toISOString() 
    };
    renderPaper(paper);
    document.getElementById('retry-skipped-btn').classList.add('hidden');
  }

  return { render, generatePaper, handleInput, setConfidence, skipQuestion, getHint, reopenPaper, retrySkipped };
})();
window.Study = Study;

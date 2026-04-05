const Flashcards = (() => {
  async function render(container) {
    const user = Auth.currentUser();
    if (!user) return;

    const { data: cards } = await supabase.from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review', new Date().toISOString())
      .order('next_review', { ascending: true });

    if (!cards || cards.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 space-y-4">
          <span class="text-6xl">🎉</span>
          <h2 class="text-2xl font-bold">All caught up!</h2>
          <p class="text-[var(--text-secondary)]">No cards due for review today.</p>
          <button onclick="App.switchTab('study')" class="bg-[var(--accent)] text-white px-6 py-3 rounded-2xl font-bold shadow-lg">Generate New Paper</button>
        </div>
      `;
      return;
    }

    let currentIndex = 0;
    let isFlipped = false;

    function renderCard() {
      const card = cards[currentIndex];
      container.innerHTML = `
        <div class="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-black tracking-tight">Review Flashcards</h2>
            <span class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">${currentIndex + 1} / ${cards.length}</span>
          </div>

          <div id="card-inner" class="relative h-80 w-full cursor-pointer perspective-1000 group">
            <div class="absolute inset-0 transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} bg-[var(--bg-secondary)] rounded-[40px] border-2 border-[var(--border)] shadow-xl flex items-center justify-center p-10 text-center">
              <div class="backface-hidden">
                <p class="text-xl font-medium leading-relaxed">${isFlipped ? card.back : card.front}</p>
                <p class="mt-6 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Click to flip</p>
              </div>
            </div>
          </div>

          <div class="flex gap-3 ${isFlipped ? 'animate-in slide-in-from-bottom-4' : 'opacity-0 pointer-events-none'}">
            <button class="quality-btn flex-1 bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg" data-quality="1">Hard</button>
            <button class="quality-btn flex-1 bg-yellow-500 text-white font-bold py-4 rounded-2xl shadow-lg" data-quality="3">Good</button>
            <button class="quality-btn flex-1 bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg" data-quality="5">Easy</button>
          </div>
        </div>
      `;

      container.querySelector('#card-inner').onclick = () => {
        isFlipped = !isFlipped;
        renderCard();
      };

      container.querySelectorAll('.quality-btn').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const quality = parseInt(btn.dataset.quality);
          await updateCard(card, quality);
          currentIndex++;
          if (currentIndex < cards.length) {
            isFlipped = false;
            renderCard();
          } else {
            UI.showNotification('Review session complete!', 'success');
            App.switchTab('home');
          }
        };
      });
    }

    async function updateCard(card, quality) {
      await Health.monitor('Flashcards.updateCard', async () => {
        const result = LearningIntel.calculateNextReview({
          repetitions: card.repetitions || 0,
          ease_factor: card.ease_factor || 2.5,
          interval: card.interval || 0
        }, quality);

        const { error } = await supabase.from('flashcards').update({
          repetitions: result.repetitions,
          ease_factor: result.ease_factor,
          interval: result.interval,
          next_review: result.next_review
        }).eq('id', card.id);

        if (error) throw error;
        
        await Gamification.awardXP(user.id, 10, 'flashcard_review');
      }, { showLoader: false });
    }

    renderCard();
  }

  return { render };
})();
window.Flashcards = Flashcards;

const Plan = (() => {
  async function renderCalendar(container) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Fetch events/sessions
    const user = Auth.currentUser();
    const { data: sessions } = await supabase.from('performance').select('created_at').eq('user_id', user?.id);
    const studyDays = new Set((sessions || []).map(s => new Date(s.created_at).getDate()));

    let calendarHtml = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-bold text-sm">${monthNames[month]} ${year}</h4>
          <div class="flex gap-2">
            <button class="p-1 hover:bg-[var(--bg-primary)] rounded">◀</button>
            <button class="p-1 hover:bg-[var(--bg-primary)] rounded">▶</button>
          </div>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--text-secondary)] mb-2">
          <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
        </div>
        <div class="grid grid-cols-7 gap-1">
    `;

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      calendarHtml += `<div class="aspect-square"></div>`;
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === now.getDate();
      const hasStudy = studyDays.has(d);
      calendarHtml += `
        <div class="aspect-square flex items-center justify-center text-xs rounded-lg transition cursor-default
          ${isToday ? 'bg-[var(--accent)] text-white font-bold' : 'hover:bg-[var(--bg-primary)]'}
          ${hasStudy && !isToday ? 'border border-[var(--accent)] text-[var(--accent)] font-bold' : ''}">
          ${d}
        </div>
      `;
    }

    calendarHtml += `</div></div>`;
    container.innerHTML = calendarHtml;
  }

  async function render(container) {
    container.innerHTML = `
      <div class="space-y-8 pb-20">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-3xl font-black tracking-tight">Your Plan</h2>
            <p class="text-[var(--text-secondary)] text-sm">Organize your study sessions and track your goals.</p>
          </div>
          <button id="print-timetable-btn" class="bg-[var(--bg-secondary)] border border-[var(--border)] px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-md transition active:scale-95">
            🖨️ Print Timetable
          </button>
        </div>

        <!-- Timetable Section -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold">Weekly Schedule</h3>
            <span class="text-xs text-[var(--text-secondary)] font-medium bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border)]">Interactive Grid</span>
          </div>
          <div id="timetable-container"></div>
        </section>

        <!-- Goals & Calendar Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Goals (2/3 width on large screens) -->
          <div class="lg:col-span-2 space-y-4">
            <h3 class="text-lg font-bold">Active Goals</h3>
            <div id="goals-container"></div>
          </div>
          
          <!-- Calendar (1/3 width on large screens) -->
          <div class="space-y-4">
            <h3 class="text-lg font-bold">Study Calendar</h3>
            <div id="calendar-container" class="bg-[var(--bg-secondary)] border border-[var(--border)] p-6 rounded-[32px] shadow-sm"></div>
          </div>
        </div>
      </div>
    `;

    // Initialize Components
    if (window.Timetable?.render) {
      await window.Timetable.render(container.querySelector('#timetable-container'));
    }
    
    if (window.Goals?.render) {
      await window.Goals.render(container.querySelector('#goals-container'));
    }

    await renderCalendar(container.querySelector('#calendar-container'));

    // Print Listener
    container.querySelector('#print-timetable-btn')?.addEventListener('click', () => {
      window.print();
    });

    if (window.UI?.applyTranslations) UI.applyTranslations();
  }

  return { render };
})();
window.Plan = Plan;

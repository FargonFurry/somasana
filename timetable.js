const Timetable = (() => {
  let schedule = {};

  async function loadTimetable() {
    const user = Auth.currentUser();
    if (!user) return {};
    try {
      const { data, error } = await supabase.from('schedule').select('content').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data?.content || {};
    } catch (e) {
      console.error('Error loading timetable:', e);
      return {};
    }
  }

  async function persistSchedule(data) {
    const user = Auth.currentUser();
    if (!user) return;
    try {
      await supabase.from('schedule').upsert({ user_id: user.id, content: data }, { onConflict: 'user_id' });
      UI.showNotification('Timetable saved!', 'success');
    } catch (e) {
      console.error('Error saving timetable:', e);
      UI.showNotification('Failed to save timetable', 'error');
    }
  }

  async function render(container) {
    schedule = await loadTimetable();
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full border-collapse bg-[var(--bg-secondary)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border)]">
          <thead>
            <tr class="bg-[var(--bg-primary)]">
              <th class="p-4 border-b border-r border-[var(--border)] text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Day</th>
              ${slots.map(slot => `<th class="p-4 border-b border-[var(--border)] text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">${slot}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border)]">
            ${days.map(day => `
              <tr>
                <td class="p-4 border-r border-[var(--border)] font-bold text-sm bg-[var(--bg-primary)]/50">${day}</td>
                ${slots.map(slot => {
                  const key = `${day}-${slot}`;
                  const val = schedule[key] || '';
                  return `
                    <td class="p-2 h-24 group relative cursor-pointer hover:bg-[var(--accent)]/5 transition timetable-cell" data-day="${day}" data-slot="${slot}">
                      <div class="h-full w-full rounded-xl border border-dashed border-[var(--border)] group-hover:border-[var(--accent)] flex flex-col items-center justify-center text-center p-2 transition">
                        ${val ? `
                          <span class="text-xs font-bold text-[var(--accent)]">${val}</span>
                        ` : `
                          <span class="text-[10px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition">Click to add</span>
                        `}
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Event Delegation for cells
    container.querySelectorAll('.timetable-cell').forEach(cell => {
      cell.draggable = true;
      cell.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', cell.dataset.day + '|' + cell.dataset.slot);
      });
      cell.addEventListener('dragover', (e) => e.preventDefault());
      cell.addEventListener('drop', async (e) => {
        e.preventDefault();
        const [fromDay, fromSlot] = e.dataTransfer.getData('text/plain').split('|');
        const toDay = cell.dataset.day;
        const toSlot = cell.dataset.slot;
        const fromKey = `${fromDay}-${fromSlot}`;
        const toKey = `${toDay}-${toSlot}`;
        
        const temp = schedule[toKey];
        schedule[toKey] = schedule[fromKey];
        schedule[fromKey] = temp;
        
        await persistSchedule(schedule);
        render(container);
      });

      cell.addEventListener('click', async () => {
        const day = cell.dataset.day;
        const slot = cell.dataset.slot;
        const key = `${day}-${slot}`;
        const currentVal = schedule[key] || '';
        
        const newVal = prompt(`What are you studying on ${day} at ${slot}?`, currentVal);
        if (newVal !== null) {
          schedule[key] = newVal.trim();
          await persistSchedule(schedule);
          render(container); // Re-render to show changes
        }
      });
    });

    const actions = document.createElement('div');
    actions.className = 'flex gap-4 mt-6';
    actions.innerHTML = `
      <button id="print-timetable" class="bg-[var(--bg-secondary)] border border-[var(--border)] px-6 py-3 rounded-2xl font-bold hover:bg-black/5 transition">Print Timetable</button>
      <button id="ai-optimize" class="bg-[var(--accent)] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:opacity-90 transition">AI Optimize Schedule</button>
    `;
    container.appendChild(actions);

    container.querySelector('#print-timetable').onclick = () => window.print();
    container.querySelector('#ai-optimize').onclick = async () => {
      UI.showGlobalLoader('AI Optimizing your schedule...');
      const prompt = `Optimize this study schedule for a student. Current: ${JSON.stringify(schedule)}. Return ONLY the JSON grid.`;
      try {
        const response = await fetch(window.APP_CONFIG.edgeFunctionUrl, {
          method: 'POST',
          body: JSON.stringify({ prompt, systemInstruction: "You are a study expert. Return only JSON." })
        });
        const result = await response.json();
        if (result.grid) {
          schedule = result.grid;
          await persistSchedule(schedule);
          render(container);
          UI.showNotification('Schedule optimized by AI!', 'success');
        }
      } catch (e) {
        UI.showNotification('AI Optimization failed.', 'error');
      } finally {
        UI.hideGlobalLoader();
      }
    };
  }

  return { loadTimetable, persistSchedule, render };
})();
window.Timetable = Timetable;

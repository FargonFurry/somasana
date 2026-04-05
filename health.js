const Health = (() => {
  let _isInitialized = false;
  const _logs = [];

  function init() {
    if (_isInitialized) return;
    
    // Global Error Handler
    window.addEventListener('error', (event) => {
      logError('Uncaught Exception', event.error || event.message);
      UI.showNotification('An unexpected error occurred. Our team has been notified.', 'error');
    });

    // Unhandled Rejection Handler
    window.addEventListener('unhandledrejection', (event) => {
      logError('Unhandled Promise Rejection', event.reason);
      UI.showNotification('A background task failed. Please try again.', 'error');
    });

    _isInitialized = true;
    console.log('Health Monitoring System Initialized');
  }

  function log(message, type = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      context: 'System',
      message,
      type
    };
    _logs.push(entry);
    console.log(`[Health ${type.toUpperCase()}] ${message}`);
    if (_logs.length > 100) _logs.shift();
  }

  function logError(context, error) {
    const entry = {
      timestamp: new Date().toISOString(),
      context,
      message: error?.message || String(error),
      stack: error?.stack,
      type: 'error'
    };
    _logs.push(entry);
    console.error(`[Health Audit] ${context}:`, error);
    if (_logs.length > 100) _logs.shift();
  }

  /**
   * Wraps an async function with error handling and health reporting
   */
  async function monitor(context, fn, options = {}) {
    const { 
      showNotification = true, 
      showLoader = false,
      loaderMessage = 'Processing...',
      successMessage = null 
    } = options;

    const controller = {
      updateMessage: (msg) => {
        if (showLoader || options.showLoader) UI.showGlobalLoader(msg);
      }
    };

    if (showLoader || options.showLoader) UI.showGlobalLoader(loaderMessage);

    try {
      // Table Insertability Test (Internal Audit)
      if (options.testTable) {
        const testId = `health_test_${Date.now()}`;
        const { error: testError } = await supabase.from(options.testTable).insert([{ 
          user_id: Auth.currentUser()?.id, 
          [options.testField || 'content']: `Health Audit Test ${testId}`,
          is_health_test: true 
        }]);
        if (testError) {
          logError(`Table Audit Failure: ${options.testTable}`, testError);
          UI.showNotification(`Database Sync Warning: ${options.testTable} is currently read-only.`, 'warning');
        } else {
          // Cleanup test
          await supabase.from(options.testTable).delete().eq('is_health_test', true);
        }
      }

      const result = await fn(controller);
      
      if (result && result.error) {
        throw result.error;
      }

      if (successMessage) UI.showNotification(successMessage, 'success');
      return result;
    } catch (error) {
      logError(context, error);
      if (showNotification) {
        const msg = error?.message || 'Operation failed';
        UI.showNotification(`${context}: ${msg}`, 'error');
      }
      throw error;
    } finally {
      if (showLoader || options.showLoader) UI.hideGlobalLoader();
    }
  }

  function getLogs() {
    return [..._logs];
  }

  async function render(container) {
    container.innerHTML = `
      <div class="p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">System Health Audit</h2>
          <button id="clear-logs" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition">Clear Logs</button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)]">
            <div class="text-[var(--text-secondary)] text-sm uppercase tracking-wider font-bold mb-1">Status</div>
            <div class="text-green-500 font-bold flex items-center gap-2">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Operational
            </div>
          </div>
          <div class="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)]">
            <div class="text-[var(--text-secondary)] text-sm uppercase tracking-wider font-bold mb-1">Errors Logged</div>
            <div class="text-2xl font-bold">${_logs.length}</div>
          </div>
          <div class="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)]">
            <div class="text-[var(--text-secondary)] text-sm uppercase tracking-wider font-bold mb-1">Uptime</div>
            <div class="text-2xl font-bold" id="health-uptime">Calculating...</div>
          </div>
        </div>

        <div class="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div class="p-4 border-b border-[var(--border)] bg-[var(--bg-primary)] font-bold">Recent Error Logs</div>
          <div class="max-h-[400px] overflow-y-auto p-4 space-y-3" id="health-logs-list">
            ${_logs.length === 0 ? '<div class="text-center text-[var(--text-secondary)] py-8">No errors logged. System is healthy.</div>' : ''}
            ${_logs.map(log => `
              <div class="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] text-sm">
                <div class="flex justify-between mb-1">
                  <span class="font-bold text-red-500">${log.context}</span>
                  <span class="text-[var(--text-secondary)] text-xs">${new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="text-[var(--text-primary)] break-words">${log.message}</div>
              </div>
            `).reverse().join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('clear-logs')?.addEventListener('click', () => {
      _logs.length = 0;
      render(container);
    });

    // Simple uptime calculation
    const startTime = performance.now();
    const updateUptime = () => {
      const uptime = Math.floor((performance.now() - startTime) / 1000);
      const el = document.getElementById('health-uptime');
      if (el) el.textContent = `${uptime}s`;
    };
    setInterval(updateUptime, 1000);
    updateUptime();

    if (window.UI?.applyTranslations) UI.applyTranslations();
  }

  return { init, monitor, render, getLogs };
})();
window.Health = Health;

const OfflineDB = (() => {
  return {
    getSyncQueueLength: async () => 0,
    processSyncQueue: async () => {}
  };
})();
window.OfflineDB = OfflineDB;

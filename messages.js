const Messages = (() => {
  async function render(container) {
    container.innerHTML = `<div class="p-4">Messages View</div>`;
    if (window.UI?.applyTranslations) UI.applyTranslations();
  }
  return { render };
})();
window.Messages = Messages;

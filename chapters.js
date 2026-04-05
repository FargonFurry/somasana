const Chapters = (() => {
  async function render(container) {
    container.innerHTML = `<div class="p-4">Chapters & Events View</div>`;
    if (window.UI?.applyTranslations) UI.applyTranslations();
  }
  return { render };
})();
window.Chapters = Chapters;

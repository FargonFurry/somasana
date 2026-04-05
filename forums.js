const Forums = (() => {
  async function render(container) {
    container.innerHTML = `<div class="p-4">Forums View</div>`;
    if (window.UI?.applyTranslations) UI.applyTranslations();
  }
  return { render };
})();
window.Forums = Forums;

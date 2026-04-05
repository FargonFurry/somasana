const Rewards = (() => {
  async function render(container) {
    container.innerHTML = `
      <div class="space-y-12 animate-in fade-in duration-500">
        <div id="shop-container"></div>
        <div id="badges-container"></div>
      </div>
    `;

    if (window.Shop) await window.Shop.render(container.querySelector('#shop-container'));
    if (window.Badges) await window.Badges.render(container.querySelector('#badges-container'));

    if (window.UI?.applyTranslations) UI.applyTranslations();
  }

  return { render };
})();
window.Rewards = Rewards;

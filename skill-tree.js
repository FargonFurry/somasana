const SkillTree = (() => {
  async function render(container) {
    container.innerHTML = `<div class="p-4">Skill Tree View</div>`;
    if (window.UI?.applyTranslations) UI.applyTranslations();
  }
  return { render };
})();
window.SkillTree = SkillTree;

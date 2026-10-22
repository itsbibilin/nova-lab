const viewer = document.querySelector('#hero-model');

if (viewer) {
  const container = viewer.closest('.hero-product');
  const status = container.querySelector('.hero-model-status');

  const showError = () => {
    container.setAttribute('aria-busy', 'false');
    container.classList.add('model-error');
    status.textContent = 'The 3D product could not load. Please refresh to try again.';
    status.hidden = false;
  };

  viewer.addEventListener('load', () => {
    container.setAttribute('aria-busy', 'false');
    status.hidden = true;
  });
  viewer.addEventListener('error', showError);

  // Pin the Web Component version; keep model assets local for GitHub Pages.
  try {
    await import('https://cdn.jsdelivr.net/npm/@google/model-viewer@4.1.0/dist/model-viewer.min.js');
  } catch {
    showError();
  }
}

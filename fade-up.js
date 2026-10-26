(() => {
  const sections = [...document.querySelectorAll('.page-section:not(.hero) > .section-content')];
  const hardware = document.querySelector('.hardware');
  const hardwareContent = document.querySelector('.hardware > .section-content');
  const pills = [...document.querySelectorAll('.hardware .pills > li')];
  const contents = [...sections, ...pills];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reducedMotion.matches || !('IntersectionObserver' in window) ||
      !('animate' in Element.prototype)) return;

  let observer;
  let stopped = false;
  let hardwareReady = false;
  let nextPill = 0;
  const revealed = new WeakSet();
  const animations = new Map();

  const reveal = (content, immediate = false) => {
    observer?.unobserve(content);
    if (immediate) {
      revealed.add(content);
      content.style.removeProperty('opacity');
      animations.get(content)?.cancel();
      animations.delete(content);
      return Promise.resolve();
    }
    if (revealed.has(content)) return Promise.resolve();
    revealed.add(content);
    const animation = content.animate([
      { opacity: 0, transform: 'translateY(32px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], {
      duration: pills.includes(content) ? 350 : 1000,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
    content.style.removeProperty('opacity');
    animations.set(content, animation);
    return animation.finished.catch(() => {}).then(() => animations.delete(content));
  };

  // Reveal by scroll position without waiting for the previous pill to finish.
  const revealNextPill = () => {
    if (stopped || !hardware || !pills.length) return;
    const distanceToNextSection = hardware.getBoundingClientRect().bottom - window.innerHeight;
    // Finish even during a fast scroll, before the next section enters view.
    if (distanceToNextSection <= 40) {
      pills.forEach((pill) => reveal(pill, true));
      nextPill = pills.length;
      return;
    }
    if (!hardwareReady) return;
    while (nextPill < pills.length) {
      const pill = pills[nextPill];
      const triggerDistance = 240 - nextPill * 60;
      if (distanceToNextSection > triggerDistance) break;
      reveal(pill);
      nextPill += 1;
    }
  };

  const observeContents = () => {
    observer?.disconnect();
    const bottomInset = Math.round(window.innerHeight * 0.35);
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const finished = reveal(entry.target);
        if (entry.target === hardwareContent) {
          finished.then(() => {
            hardwareReady = true;
            revealNextPill();
          });
        }
      });
    }, { threshold: 0, rootMargin: `0px 0px -${bottomInset}px 0px` });
    sections.forEach((content) => {
      if (!revealed.has(content)) observer.observe(content);
    });
  };

  contents.forEach((content) => { content.style.opacity = '0'; });
  observeContents();
  revealNextPill();
  window.addEventListener('resize', observeContents);
  window.addEventListener('scroll', revealNextPill, { passive: true });

  document.addEventListener('focusin', (event) => {
    const section = event.target.closest('.page-section:not(.hero) > .section-content');
    if (section) reveal(section, true);
  });

  const revealAll = () => {
    stopped = true;
    contents.forEach((content) => reveal(content, true));
    observer.disconnect();
    window.removeEventListener('resize', observeContents);
    window.removeEventListener('scroll', revealNextPill);
  };
  window.addEventListener('beforeprint', revealAll);
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) revealAll();
  });
})();

(() => {
  const contents = document.querySelectorAll('.page-section:not(.hero) > .section-content, .hardware .pills > li');
  const pillGroups = document.querySelectorAll('.hardware .pills');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Leave content visible when animation is disabled or unsupported.
  if (reducedMotion.matches || !('IntersectionObserver' in window) ||
      !('animate' in Element.prototype)) return;

  let observer;
  let pillsObserver;
  const revealed = new WeakSet();
  const animations = new Map();
  const reveal = (content, immediate = false) => {
    observer?.unobserve(content);
    if (immediate) {
      revealed.add(content);
      content.style.removeProperty('opacity');
      animations.get(content)?.cancel();
      animations.delete(content);
      return;
    }
    if (revealed.has(content)) return;
    revealed.add(content);
    const animation = content.animate([
      { opacity: 0, transform: 'translateY(32px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], {
      duration: 1000,
      delay: content.matches('.hardware .pills > li')
        ? Array.from(content.parentElement.children).indexOf(content) * 150
        : 0,
      fill: 'backwards',
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
    content.style.removeProperty('opacity');
    animations.set(content, animation);
    animation.onfinish = () => animations.delete(content);
  };

  const observeContents = () => {
    observer?.disconnect();
    pillsObserver?.disconnect();
    // Use viewport-height pixels: percentage root margins are based on width.
    const bottomInset = Math.round(window.innerHeight * 0.35);
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
      });
    }, {
      threshold: 0,
      rootMargin: `0px 0px -${bottomInset}px 0px`,
    });
    // Trigger the three pills together as soon as their group enters view.
    pillsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('li').forEach((pill) => reveal(pill));
        pillsObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    contents.forEach((content) => {
      if (!content.matches('.hardware .pills > li') && !revealed.has(content)) {
        observer.observe(content);
      }
    });
    pillGroups.forEach((group) => {
      if (Array.from(group.children).some((pill) => !revealed.has(pill))) {
        pillsObserver.observe(group);
      }
    });
  };

  contents.forEach((section) => {
    section.style.opacity = '0';
  });
  observeContents();
  window.addEventListener('resize', observeContents);

  // Reveal content immediately when keyboard focus moves into it.
  document.addEventListener('focusin', (event) => {
    const section = event.target.closest('.page-section:not(.hero) > .section-content');
    if (section) reveal(section, true);
  });

  const revealAll = () => {
    contents.forEach((content) => reveal(content, true));
    observer.disconnect();
    pillsObserver.disconnect();
    window.removeEventListener('resize', observeContents);
  };
  window.addEventListener('beforeprint', revealAll);

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      revealAll();
    }
  });
})();

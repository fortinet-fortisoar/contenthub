/**
 * LogoLoop - Seamless infinite scrolling logo animation
 * Duplicates list for seamless loop effect
 */

(function() {
  'use strict';

  function initLogoLoops() {
    const sections = document.querySelectorAll('[data-logo-loop]');

    sections.forEach(section => {
      // Check if already initialized
      if (section.dataset.logoLoopInitialized) return;

      const logoloop = section.querySelector('.logoloop');
      const track = section.querySelector('.logoloop__track');
      const list = track.querySelector('.logoloop__list');

      if (!logoloop || !track || !list) return;

      // Get options from data attributes
      const speed = parseInt(section.dataset.speed) || 120;
      const gap = parseInt(section.dataset.gap) || 32;
      const logoHeight = parseInt(section.dataset.logoHeight) || 40;
      const pauseOnHover = section.dataset.pauseOnHover !== 'false';

      // Apply CSS variables
      logoloop.style.setProperty('--logoloop-gap', `${gap}px`);
      logoloop.style.setProperty('--logoloop-logoHeight', `${logoHeight}px`);

      // Clone the list 2 more times (total 3 copies for seamless loop)
      function duplicateList() {
        // Remove any existing duplicates
        const allLists = track.querySelectorAll('.logoloop__list');
        for (let i = allLists.length - 1; i >= 0; i--) {
          if (i > 0) {
            allLists[i].remove();
          }
        }

        // Get the original list again
        const originalList = track.querySelector('.logoloop__list');
        if (!originalList) return;

        // Clone the list 2 more times (total 3 copies)
        for (let i = 0; i < 2; i++) {
          const clone = originalList.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        }

        // Force a reflow to ensure the clones are rendered
        track.offsetHeight;

        // Calculate duration based on one list width
        const listWidth = originalList.offsetWidth;

        if (listWidth > 0) {
          // Calculate animation duration: listWidth / speed (pixels per second)
          const duration = listWidth / speed;
          track.style.animationDuration = `${duration}s`;
        }
      }

      // Run immediately and again after images load
      setTimeout(duplicateList, 10);

      // Also run after a longer delay to catch any delayed rendering
      setTimeout(duplicateList, 500);

      // Pause on hover
      if (pauseOnHover) {
        track.addEventListener('mouseenter', () => {
          track.style.animationPlayState = 'paused';
        });
        track.addEventListener('mouseleave', () => {
          track.style.animationPlayState = 'running';
        });
      }

      // Handle window resize
      window.addEventListener('resize', () => {
        duplicateList();
      });

      section.dataset.logoLoopInitialized = 'true';
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogoLoops);
  } else {
    initLogoLoops();
  }

  // Export for manual initialization
  window.initLogoLoops = initLogoLoops;
})();
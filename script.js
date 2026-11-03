/**
 * SNEHA JHA — ANTIQUE INDIAN STORYBOOK PORTFOLIO
 * High-precision chapter flipping, realistic 3D book-opening mechanics,
 * interactive Table of Contents / Index, and theme synchronizer.
 */

(() => {
  'use strict';

  const chapterKeys = [
    'index',        // Chapter 00: Table of Contents
    'home',         // Chapter 01: About Me
    'journey',      // Chapter 02: My Journey
    'education',    // Chapter 03: Education & Research
    'experience',   // Chapter 04: Experience
    'projects',     // Chapter 05: Technical Projects
    'skills',       // Chapter 06: Skills & Toolchains
    'publications', // Chapter 07: Publications
    'contact'       // Chapter 08: Contact & Résumé
  ];

  const state = {
    isOpen: false,
    currentChapter: 'index', // Opens onto Table of Contents / Index
    theme: 'light',
    isTurning: false
  };

  // --- Sound Engine (Web Audio API Synthesizer - 100% Offline) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playPaperRustle(intensity = 1.0) {
      try {
        this.init();
        if (!this.ctx) return;

        const duration = 0.38 * intensity;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Pink noise simulation for natural paper friction
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.95 * b1 + white * 0.1;
          b2 = 0.85 * b2 + white * 0.2;
          data[i] = (b0 + b1 + b2) * 0.25;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + duration);
        filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.22 * intensity, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
      } catch (err) {
        console.warn('Audio note:', err);
      }
    }
  }

  const sound = new SoundEngine();

  // --- Book Opening & Closing Animation Mechanics ---
  function openBook(animate = true) {
    if (state.isOpen) return;

    const closedScene = document.getElementById('closedBookScene');
    const openStage = document.getElementById('openBookStage');
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    sound.playPaperRustle(1.2);

    if (animate && !isReduced) {
      if (closedScene) {
        closedScene.classList.add('opening');
      }

      setTimeout(() => {
        if (closedScene) {
          closedScene.classList.add('is-hidden');
          closedScene.classList.remove('opening');
        }
        if (openStage) {
          openStage.classList.remove('is-hidden');
          openStage.classList.add('fade-unfold');
          setTimeout(() => {
            openStage.classList.remove('fade-unfold');
          }, 500);
        }
        state.isOpen = true;
        turnToChapter(state.currentChapter, false);
      }, 650);
    } else {
      if (closedScene) {
        closedScene.classList.add('is-hidden');
        closedScene.classList.remove('opening');
      }
      if (openStage) {
        openStage.classList.remove('is-hidden');
      }
      state.isOpen = true;
      turnToChapter(state.currentChapter, false);
    }
  }

  function closeBook(animate = true) {
    if (!state.isOpen) return;

    const closedScene = document.getElementById('closedBookScene');
    const openStage = document.getElementById('openBookStage');

    sound.playPaperRustle(0.9);

    if (openStage) {
      openStage.classList.add('is-hidden');
    }
    if (closedScene) {
      closedScene.classList.remove('is-hidden');
      closedScene.classList.remove('opening');
    }

    state.isOpen = false;
  }

  // --- Chapter Flipping Mechanism ---
  function turnToChapter(targetKey, animate = true) {
    if (state.isTurning && animate) return;
    if (!chapterKeys.includes(targetKey)) return;

    const currentIdx = chapterKeys.indexOf(state.currentChapter);
    const targetIdx = chapterKeys.indexOf(targetKey);

    state.isTurning = true;
    sound.playPaperRustle(0.85);

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updateDOM = () => {
      // 1. Update Top Navigation Menu
      document.querySelectorAll('.book-nav-link').forEach(btn => {
        const isMatch = btn.getAttribute('data-chapter') === targetKey;
        btn.classList.toggle('active', isMatch);
        if (isMatch) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
      });

      // 2. Update Bottom Spine Pagination Dots
      document.querySelectorAll('.pag-dot').forEach(dot => {
        const isMatch = dot.getAttribute('data-chapter') === targetKey;
        dot.classList.toggle('active', isMatch);
      });

      // 3. Switch Active Spread Section
      document.querySelectorAll('.chapter-content-spread').forEach(spread => {
        spread.classList.remove('active-spread');
      });
      const activeSpread = document.getElementById(`spread-${targetKey}`);
      if (activeSpread) {
        activeSpread.classList.add('active-spread');
      }

      // 4. Update Prev/Next Buttons
      const prevBtn = document.getElementById('prevSpreadBtn');
      const nextBtn = document.getElementById('nextSpreadBtn');
      if (prevBtn) prevBtn.disabled = targetIdx === 0;
      if (nextBtn) nextBtn.disabled = targetIdx === chapterKeys.length - 1;

      state.currentChapter = targetKey;
      state.isTurning = false;
    };

    if (animate && !isReduced && currentIdx !== targetIdx) {
      const currentSpread = document.getElementById(`spread-${state.currentChapter}`);
      if (currentSpread) {
        currentSpread.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        currentSpread.style.opacity = '0.2';
        currentSpread.style.transform = targetIdx > currentIdx ? 'translateX(-6px)' : 'translateX(6px)';

        setTimeout(() => {
          currentSpread.style.transition = '';
          currentSpread.style.opacity = '';
          currentSpread.style.transform = '';
          updateDOM();

          const newSpread = document.getElementById(`spread-${targetKey}`);
          if (newSpread) {
            newSpread.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
            newSpread.style.opacity = '0.3';
            newSpread.style.transform = targetIdx > currentIdx ? 'translateX(6px)' : 'translateX(-6px)';
            requestAnimationFrame(() => {
              newSpread.style.opacity = '1';
              newSpread.style.transform = 'none';
              setTimeout(() => {
                newSpread.style.transition = '';
                newSpread.style.transform = '';
              }, 220);
            });
          }
        }, 150);
      } else {
        updateDOM();
      }
    } else {
      updateDOM();
    }
  }

  // --- Pure Light Watercolor Mode Enforcement ---
  function enforceLuminousLightMode() {
    const root = document.documentElement;
    root.dataset.theme = 'light';
    state.theme = 'light';

    // Ensure all institutional artwork points to pure light watercolor paintings
    document.querySelectorAll('.institution-real-artwork img, .cover-center-medallion img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.includes('-dark.webp')) {
        img.setAttribute('src', src.replace('-dark.webp', '-light.webp'));
      }
    });

    try {
      localStorage.removeItem('sneha-storybook-theme');
    } catch (_) {}
  }

  // --- DOM Ready Event Bindings ---
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Enforce Pure Light Storybook Mode
    enforceLuminousLightMode();

    // 2. Closed Book Cover Opening Triggers
    const openBtn = document.getElementById('openCoverBtn');
    const skipBtn = document.getElementById('skipIntroCoverBtn');
    const closedCover = document.getElementById('closedCoverFrame');

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBook(true);
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBook(false);
      });
    }

    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', () => {
        openBook(false);
      });
    }

    if (closedCover) {
      closedCover.addEventListener('click', () => {
        openBook(true);
      });
    }

    // 3. Return to Closed Book Cover Button
    const closeBtn = document.getElementById('closeBookBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeBook(true);
      });
    }

    // 4. Return to Index / Table of Contents Button
    const returnIndexBtn = document.getElementById('returnIndexBtn');
    if (returnIndexBtn) {
      returnIndexBtn.addEventListener('click', () => {
        turnToChapter('index');
      });
    }

    // 5. Interactive Chapter Cards in Index Spread
    document.querySelectorAll('.index-chapter-card').forEach(card => {
      card.addEventListener('click', () => {
        const chapter = card.getAttribute('data-chapter');
        if (chapter) {
          turnToChapter(chapter);
        }
      });
    });

    // 6. Top Navigation Link Clicks
    document.querySelectorAll('.book-nav-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const chapter = btn.getAttribute('data-chapter');
        turnToChapter(chapter);
      });
    });

    // 7. Dot Indicator Clicks
    document.querySelectorAll('.pag-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const chapter = dot.getAttribute('data-chapter');
        turnToChapter(chapter);
      });
    });

    // 8. Prev / Next Pagination Arrow Buttons
    const prevBtn = document.getElementById('prevSpreadBtn');
    const nextBtn = document.getElementById('nextSpreadBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const currentIdx = chapterKeys.indexOf(state.currentChapter);
        if (currentIdx > 0) {
          turnToChapter(chapterKeys[currentIdx - 1]);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const currentIdx = chapterKeys.indexOf(state.currentChapter);
        if (currentIdx < chapterKeys.length - 1) {
          turnToChapter(chapterKeys[currentIdx + 1]);
        }
      });
    }

    // 9. Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeBook(true);
      } else if ((e.key === 'Enter' || e.key === ' ') && !state.isOpen) {
        openBook(true);
      } else if (state.isOpen) {
        if (e.key === 'ArrowRight') {
          const currentIdx = chapterKeys.indexOf(state.currentChapter);
          if (currentIdx < chapterKeys.length - 1) {
            turnToChapter(chapterKeys[currentIdx + 1]);
          }
        } else if (e.key === 'ArrowLeft') {
          const currentIdx = chapterKeys.indexOf(state.currentChapter);
          if (currentIdx > 0) {
            turnToChapter(chapterKeys[currentIdx - 1]);
          }
        }
      }
    });

    // 10. Initial state: Closed book is visible, Open book is hidden
    const closedScene = document.getElementById('closedBookScene');
    const openStage = document.getElementById('openBookStage');
    if (closedScene) closedScene.classList.remove('is-hidden');
    if (openStage) openStage.classList.add('is-hidden');
  });

})();

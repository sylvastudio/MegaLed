// ============================================================
// MegaLed - Scrolling LED Marquee Sign App
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // DOM References
  // ----------------------------------------------------------
  const inputScreen     = document.getElementById('inputScreen');
  const displayScreen   = document.getElementById('displayScreen');
  const ledTextInput    = document.getElementById('ledTextInput');
  const charCounter     = document.getElementById('charCounter');
  const charBarFill     = document.getElementById('charBarFill');
  const styleSelector   = document.getElementById('styleSelector');
  const speedSlider     = document.getElementById('speedSlider');
  const speedValue      = document.getElementById('speedValue');
  const sizeSlider      = document.getElementById('sizeSlider');
  const sizeValue       = document.getElementById('sizeValue');
  const directionToggle = document.getElementById('directionToggle');
  const playBtn         = document.getElementById('playBtn');
  const closeBtn        = document.getElementById('closeBtn');
  const ledText         = document.getElementById('ledText');

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  const state = {
    text: '',
    style: 'classic-red',
    speed: 5,
    fontSize: 80,
    direction: 'ltr',
    isPlaying: false
  };

  // Maps data-style values to CSS class names
  const styleClassMap = {
    'classic-red':   'led-text--red',
    'neon-glow':     'led-text--neon',
    'green-matrix':  'led-text--green',
    'blue-ice':      'led-text--blue',
    'rainbow':       'led-text--rainbow'
  };

  const displayStyleMap = {
    'classic-red':   'screen-display--red',
    'neon-glow':     'screen-display--neon',
    'green-matrix':  'screen-display--green',
    'blue-ice':      'screen-display--blue',
    'rainbow':       'screen-display--rainbow'
  };

  // Speed: maps slider value (1-10) to scroll duration in seconds.
  // 1 = slowest (20s), 10 = fastest (3s)
  function speedToDuration(speed) {
    return 22 - (speed * 1.9);
  }

  // ----------------------------------------------------------
  // Service Worker Registration
  // ----------------------------------------------------------
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./service-worker.js')
          .then(function (reg) {
            console.log('SW registered, scope:', reg.scope);
          })
          .catch(function (err) {
            console.warn('SW registration failed:', err);
          });
      });
    }
  }

  // ----------------------------------------------------------
  // Screen Management
  // ----------------------------------------------------------
  function showDisplay() {
    inputScreen.classList.add('is-hidden');
    displayScreen.classList.add('is-visible');
  }

  function showInput() {
    displayScreen.classList.remove('is-visible');
    inputScreen.classList.remove('is-hidden');
  }

  // ----------------------------------------------------------
  // Fullscreen Helpers
  // ----------------------------------------------------------
  function enterFullscreen() {
    var el = document.documentElement;
    var request = el.requestFullscreen
      || el.webkitRequestFullscreen
      || el.mozRequestFullScreen
      || el.msRequestFullscreen;

    if (request) {
      request.call(el).catch(function () {});
    }
  }

  function exitFullscreen() {
    var exit = document.exitFullscreen
      || document.webkitExitFullscreen
      || document.mozCancelFullScreen
      || document.msExitFullscreen;

    if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
      exit.call(document).catch(function () {});
    }
  }

  // ----------------------------------------------------------
  // Slider Fill Color
  // ----------------------------------------------------------
  function updateSliderFill(slider) {
    var pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = 'linear-gradient(to right, var(--accent-primary) ' + pct + '%, var(--surface-400) ' + pct + '%)';
  }

  // ----------------------------------------------------------
  // LED Style Application
  // ----------------------------------------------------------
  function applyLedStyle() {
    // Reset led-text classes
    ledText.className = 'led-text';
    var dirClass = state.direction === 'ltr' ? 'led-text--ltr' : 'led-text--rtl';
    ledText.classList.add(styleClassMap[state.style], dirClass);

    // Reset display screen style classes
    displayScreen.className = 'screen-display';
    displayScreen.classList.add(displayStyleMap[state.style], 'is-visible');
  }

  // ----------------------------------------------------------
  // Play / Stop
  // ----------------------------------------------------------
  function play() {
    var text = state.text.trim();
    if (!text) {
      ledTextInput.focus();
      ledTextInput.classList.add('shake');
      setTimeout(function () {
        ledTextInput.classList.remove('shake');
      }, 500);
      return;
    }

    state.isPlaying = true;

    // Set text content and font size
    ledText.textContent = text;
    ledText.style.fontSize = state.fontSize + 'px';

    // Set scroll duration
    var duration = speedToDuration(state.speed);
    ledText.style.setProperty('--scroll-duration', duration + 's');

    // Apply LED style and direction classes
    applyLedStyle();

    // Switch screens, go fullscreen
    showDisplay();
    enterFullscreen();
  }

  function stop() {
    state.isPlaying = false;

    // Remove animation
    ledText.style.animation = 'none';
    displayScreen.classList.remove('is-visible');

    exitFullscreen();
    showInput();
  }

  // ----------------------------------------------------------
  // Event: Text Input
  // ----------------------------------------------------------
  function onTextInput() {
    state.text = ledTextInput.value;
    var len = ledTextInput.value.length;
    var counterText = charCounter.querySelector('.char-counter__text');
    counterText.textContent = len + ' / 50';

    // Update progress bar
    var pct = (len / 50) * 100;
    charBarFill.style.width = pct + '%';

    // Warning / limit states
    charCounter.classList.remove('char-counter--warning', 'char-counter--limit');
    if (len >= 50) {
      charCounter.classList.add('char-counter--limit');
    } else if (len >= 40) {
      charCounter.classList.add('char-counter--warning');
    }
  }

  // ----------------------------------------------------------
  // Event: Style Selector
  // ----------------------------------------------------------
  function onStyleSelect(event) {
    var btn = event.target.closest('.style-swatch');
    if (!btn) return;

    // Update active state in UI
    styleSelector.querySelectorAll('.style-swatch').forEach(function (el) {
      el.classList.remove('is-active');
    });
    btn.classList.add('is-active');

    state.style = btn.dataset.style;
  }

  // ----------------------------------------------------------
  // Event: Speed Slider
  // ----------------------------------------------------------
  function onSpeedChange() {
    state.speed = parseInt(speedSlider.value, 10);
    speedValue.textContent = state.speed;
    updateSliderFill(speedSlider);

    if (state.isPlaying) {
      var duration = speedToDuration(state.speed);
      ledText.style.setProperty('--scroll-duration', duration + 's');
    }
  }

  // ----------------------------------------------------------
  // Event: Font Size Slider
  // ----------------------------------------------------------
  function onSizeChange() {
    state.fontSize = parseInt(sizeSlider.value, 10);
    sizeValue.textContent = state.fontSize + 'px';
    updateSliderFill(sizeSlider);

    if (state.isPlaying) {
      ledText.style.fontSize = state.fontSize + 'px';
    }
  }

  // ----------------------------------------------------------
  // Event: Direction Toggle
  // ----------------------------------------------------------
  function onDirectionChange() {
    var isRtl = directionToggle.checked;
    state.direction = isRtl ? 'rtl' : 'ltr';

    // Update label highlights
    document.querySelectorAll('.control-toggle__option').forEach(function (el) {
      el.classList.remove('is-active');
    });
    var activeLabel = document.querySelector('.control-toggle__option[data-dir="' + state.direction + '"]');
    if (activeLabel) activeLabel.classList.add('is-active');

    if (state.isPlaying) {
      applyLedStyle();
      var duration = speedToDuration(state.speed);
      ledText.style.setProperty('--scroll-duration', duration + 's');
    }
  }

  // ----------------------------------------------------------
  // Event: Fullscreen Change
  // ----------------------------------------------------------
  function onFullscreenChange() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && state.isPlaying) {
      setTimeout(function () {
        if (state.isPlaying) stop();
      }, 100);
    }
  }

  // ----------------------------------------------------------
  // Bind All Events
  // ----------------------------------------------------------
  function bindEvents() {
    ledTextInput.addEventListener('input', onTextInput);
    styleSelector.addEventListener('click', onStyleSelect);
    speedSlider.addEventListener('input', onSpeedChange);
    sizeSlider.addEventListener('input', onSizeChange);
    directionToggle.addEventListener('change', onDirectionChange);
    playBtn.addEventListener('click', play);
    closeBtn.addEventListener('click', stop);

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && state.isPlaying) {
        stop();
      }
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  function init() {
    registerServiceWorker();
    bindEvents();

    // Set initial slider fills
    updateSliderFill(speedSlider);
    updateSliderFill(sizeSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

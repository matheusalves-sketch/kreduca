(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var revealEls = document.querySelectorAll('main > section');

    if (!('IntersectionObserver' in window)) {

      revealEls.forEach(function (el) { el.classList.add('reveal', 'reveal-visible'); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('reveal'); });

      var observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('reveal-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0, rootMargin: '-50% 0px -50% 0px' }
      );

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          revealEls.forEach(function (el) { observer.observe(el); });
        });
      });
    }

    initMarquee();
    initCountdowns();
    initScrollProgressBar();
    initLegalModal();
    initMapsLink();

  });

  function initScrollProgressBar() {
    var bar = document.getElementById('scroll-progress-bar');
    if (!bar) return;

    var ticking = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
  }

  function initCountdowns() {
    var nodes = document.querySelectorAll('[data-countdown-target]');
    if (!nodes.length) return;

    function update() {
      nodes.forEach(function (node) {
        var target = new Date(node.getAttribute('data-countdown-target')).getTime();
        var now = Date.now();
        var diff = Math.max(0, target - now);

        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var minutes = Math.floor((diff % 3600000) / 60000);
        var seconds = Math.floor((diff % 60000) / 1000);

        var pad = function (n) { return String(n).padStart(2, '0'); };

        var inlineOutput = node.querySelector('.countdown-output');
        if (inlineOutput && !node.querySelector('.countdown-days')) {
          inlineOutput.textContent = days + 'd ' + pad(hours) + 'h ' + pad(minutes) + 'm ' + pad(seconds) + 's';
        }

        var daysEl = node.querySelector('.countdown-days');
        var hoursEl = node.querySelector('.countdown-hours');
        var minutesEl = node.querySelector('.countdown-minutes');
        var secondsEl = node.querySelector('.countdown-seconds');
        if (daysEl) daysEl.textContent = pad(days);
        if (hoursEl) hoursEl.textContent = pad(hours);
        if (minutesEl) minutesEl.textContent = pad(minutes);
        if (secondsEl) secondsEl.textContent = pad(seconds);

        if (diff <= 0) {
          node.setAttribute('data-countdown-expired', 'true');
        }
      });
    }

    update();
    setInterval(update, 1000);
  }

  function initMapsLink() {
    var links = document.querySelectorAll('[data-apple]');
    if (!links.length) return;
    var ua = navigator.userAgent || '';
    var isApple = /iPhone|iPad|iPod|Macintosh/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isApple) return;
    links.forEach(function (link) {
      var apple = link.getAttribute('data-apple');
      if (apple) link.setAttribute('href', apple);
    });
  }

  function initLegalModal() {
    var modal = document.getElementById('kr-legal-modal');
    if (!modal) return;

    var titles = { privacidade: 'Política de Privacidade', termos: 'Termos de Uso' };
    var titleEl = modal.querySelector('#kr-legal-modal-title');
    var panels = modal.querySelectorAll('[data-kr-legal-panel]');
    var openTriggers = document.querySelectorAll('[data-kr-legal-open]');
    var closeTriggers = modal.querySelectorAll('[data-kr-legal-close]');
    var lastFocused = null;

    function showPanel(key) {
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-kr-legal-panel') !== key;
      });
      titleEl.textContent = titles[key] || '';
    }

    function openModal(key) {
      lastFocused = document.activeElement;
      showPanel(key);
      modal.setAttribute('data-open', 'true');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.setAttribute('data-open', 'false');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    openTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        openModal(trigger.getAttribute('data-kr-legal-open'));
      });
    });

    closeTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.getAttribute('data-open') === 'true') closeModal();
    });
  }

  function initMarquee() {
    var container = document.querySelector('.kr-marquee');
    var track = document.querySelector('.kr-marquee-track');
    if (!container || !track) return;

    var AUTO_SPEED = 0.036;
    var IDLE_RESUME_MS = 1800;
    var FRICTION = 0.95;
    var MIN_MOMENTUM_VELOCITY = 0.3;

    var lastInteraction = 0;
    var isDragging = false;
    var dragStartX = 0;
    var dragStartScroll = 0;
    var momentumVelocity = 0;
    var autoPos = 0;
    var lastTs = 0;

    var lastMoveX = 0;
    var lastMoveTime = 0;

    var isTouchDevice = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) &&
      (!window.matchMedia || window.matchMedia('(pointer: coarse)').matches);

    var jsControlActive = false;
    function activateJsControl() {
      if (jsControlActive || isTouchDevice) return;
      jsControlActive = true;
      container.classList.add('kr-marquee-js');
    }

    function markInteraction() {
      lastInteraction = Date.now();
    }

    function isIdle() {
      return Date.now() - lastInteraction > IDLE_RESUME_MS;
    }

    function wrapLoop() {
      var half = track.scrollWidth / 2;
      if (container.scrollLeft >= half) {
        container.scrollLeft -= half;
      } else if (container.scrollLeft <= 0) {
        container.scrollLeft += half;
      }
    }

    function tick(ts) {
      var dt = lastTs ? Math.min(ts - lastTs, 64) : 16.7;
      lastTs = ts;
      var frames = dt / 16.7;
      var auto = false;
      if (!jsControlActive) {

      } else if (isDragging) {

      } else if (Math.abs(momentumVelocity) > MIN_MOMENTUM_VELOCITY) {
        container.scrollLeft -= momentumVelocity * frames;
        momentumVelocity *= Math.pow(FRICTION, frames);
      } else if (isIdle()) {
        auto = true;
      }
      if (auto) {
        var half = track.scrollWidth / 2;
        autoPos += AUTO_SPEED * dt;
        if (half > 0 && autoPos >= half) autoPos -= half;
        container.scrollLeft = autoPos;
      } else {
        autoPos = container.scrollLeft;
      }
      requestAnimationFrame(tick);
    }

    container.addEventListener('scroll', wrapLoop, { passive: true });

    container.addEventListener('touchstart', function () {
      activateJsControl();
      markInteraction();
    }, { passive: true });
    container.addEventListener('touchmove', markInteraction, { passive: true });
    container.addEventListener('touchend', markInteraction, { passive: true });
    container.addEventListener('touchcancel', markInteraction, { passive: true });

    container.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      activateJsControl();
      momentumVelocity = 0;
      container.scrollLeft += e.deltaX;
      markInteraction();
      e.preventDefault();
    }, { passive: false });

    container.addEventListener('mousedown', function (e) {
      activateJsControl();
      isDragging = true;
      momentumVelocity = 0;
      container.classList.add('kr-marquee-dragging');
      dragStartX = e.pageX;
      dragStartScroll = container.scrollLeft;
      lastMoveX = e.pageX;
      lastMoveTime = performance.now();
      markInteraction();
      e.preventDefault();
    });

    container.addEventListener('dragstart', function (e) {
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      e.preventDefault();
      var delta = e.pageX - dragStartX;
      container.scrollLeft = dragStartScroll - delta;

      var now = performance.now();
      var dt = now - lastMoveTime;
      if (dt > 0) {
        momentumVelocity = ((lastMoveX - e.pageX) / dt) * 16.7;
      }
      lastMoveX = e.pageX;
      lastMoveTime = now;
      markInteraction();
    });

    function stopDragging() {
      if (!isDragging) return;
      isDragging = false;
      container.classList.remove('kr-marquee-dragging');
      markInteraction();

    }

    window.addEventListener('mouseup', stopDragging);

    requestAnimationFrame(tick);
  }
})();

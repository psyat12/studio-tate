(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Sticky header background on scroll
     --------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var setScrolled = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
  }

  /* ---------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------- */
  var navToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
      });
    });
  }

  /* ---------------------------------------------------------
     Signature moment: hero blueprint -> photo reveal
     --------------------------------------------------------- */
  var heroMedia = document.getElementById('hero-media');
  if (heroMedia) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      heroMedia.classList.add('is-revealed');
    } else {
      var heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            heroMedia.classList.add('is-revealed');
            heroObserver.disconnect();
          }
        });
      }, { threshold: 0.35 });
      heroObserver.observe(heroMedia);
    }
  }

  /* ---------------------------------------------------------
     Scroll reveal for sections
     --------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ---------------------------------------------------------
     Stat count-up
     --------------------------------------------------------- */
  var statNums = document.querySelectorAll('.stat-item__num');
  if (statNums.length) {
    var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

    var animateCount = function (el) {
      var target = parseInt(el.dataset.countTo, 10) || 0;
      var suffix = el.dataset.suffix || '';
      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }
      var duration = 1200;
      var start = null;
      var step = function (timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var value = Math.round(target * easeOutCubic(progress));
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      statNums.forEach(animateCount);
    } else {
      var statObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      statNums.forEach(function (el) { statObserver.observe(el); });
    }
  }

  /* ---------------------------------------------------------
     Work grid filter
     --------------------------------------------------------- */
  var filterBar = document.querySelector('.filter-bar');
  var workGrid = document.getElementById('work-grid');
  if (filterBar && workGrid) {
    var chips = filterBar.querySelectorAll('.chip');
    var cards = workGrid.querySelectorAll('.work-card');
    filterBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var filter = chip.dataset.filter;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      cards.forEach(function (card) {
        var show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !show);
      });
    });
  }

  /* ---------------------------------------------------------
     Multi-step enquiry form
     --------------------------------------------------------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll('.enquiry-step'));
    var total = steps.length;
    var current = 0;

    var backBtn = document.getElementById('step-back');
    var nextBtn = document.getElementById('step-next');
    var submitBtn = document.getElementById('step-submit');
    var progressFill = document.getElementById('progress-fill');
    var progressRoot = document.querySelector('.enquiry__progress');
    var stepList = document.querySelectorAll('.enquiry__steps li');
    var statusEl = document.getElementById('enquiry-status');

    function updateUI() {
      steps.forEach(function (step, i) { step.classList.toggle('is-active', i === current); });
      backBtn.hidden = current === 0;
      nextBtn.hidden = current === total - 1;
      submitBtn.hidden = current !== total - 1;
      var pct = Math.round(((current + 1) / total) * 100);
      progressFill.style.width = pct + '%';
      if (progressRoot) progressRoot.setAttribute('aria-valuenow', String(current + 1));
      stepList.forEach(function (li, i) {
        li.style.color = i <= current ? 'var(--ink)' : '';
      });
      var focusTarget = steps[current].querySelector('input, textarea');
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    }

    function nearestError(el, step) {
      var sib = el.nextElementSibling;
      while (sib) {
        if (sib.classList.contains('field-error')) return sib;
        if (sib.classList.contains('pill-group') || sib.tagName === 'LEGEND') break;
        sib = sib.nextElementSibling;
      }
      return step.querySelector('.field-error');
    }

    function clearStepErrors(step) {
      step.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    }

    function validateStep(index) {
      var step = steps[index];
      clearStepErrors(step);
      var requiredGroups = step.querySelectorAll('[data-required]');
      for (var i = 0; i < requiredGroups.length; i++) {
        var checked = requiredGroups[i].querySelector('input:checked');
        if (!checked) {
          var groupError = nearestError(requiredGroups[i], step);
          if (groupError) groupError.textContent = 'Pick one to continue.';
          return false;
        }
      }
      var requiredFields = step.querySelectorAll('input[required], textarea[required]');
      for (var j = 0; j < requiredFields.length; j++) {
        if (!requiredFields[j].checkValidity()) {
          var errorEl = step.querySelector('.field-error');
          if (errorEl) errorEl.textContent = requiredFields[j].type === 'email'
            ? 'Enter a valid email address.'
            : 'This field is required.';
          requiredFields[j].focus();
          return false;
        }
      }
      return true;
    }

    nextBtn.addEventListener('click', function () {
      if (!validateStep(current)) return;
      current = Math.min(current + 1, total - 1);
      updateUI();
    });

    backBtn.addEventListener('click', function () {
      current = Math.max(current - 1, 0);
      updateUI();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;

      var data = new FormData(form);
      var payload = {};
      data.forEach(function (value, key) { payload[key] = value; });

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      statusEl.textContent = '';
      statusEl.removeAttribute('data-state');

      // TODO: point this at the real Cloudflare Worker / Formspree endpoint
      // that forwards submissions to hello@studiotate.co.uk.
      fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          statusEl.textContent = 'Thanks — we’ve got your message and will be in touch shortly.';
          statusEl.setAttribute('data-state', 'success');
          form.reset();
          current = 0;
          updateUI();
        })
        .catch(function () {
          statusEl.textContent = 'Something went wrong sending that. Try again, or email hello@studiotate.co.uk directly.';
          statusEl.setAttribute('data-state', 'error');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send enquiry';
        });
    });

    updateUI();
  }

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

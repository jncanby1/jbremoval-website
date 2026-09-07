/* ============================================================
   JB Removal Services — motion layer
   Requires: gsap.min.js + ScrollTrigger.min.js loaded before this.
   Progressive enhancement:
     - No GSAP or reduced-motion  -> nothing stays hidden, no animation.
     - Before/after slider is direct manipulation (not motion) and is
       always built, even under reduced-motion.
   Reusable helpers keep the per-section code short; add new reveals by
   calling reveal('.your-class', {...}) rather than repeating tweens.
   ============================================================ */
(function () {
  'use strict';

  var docEl  = document.documentElement;
  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function arr(list) { return Array.prototype.slice.call(list); }
  function $(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return arr((ctx || document).querySelectorAll(sel)); }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    buildBeforeAfterSliders();            // interactive, always on

    if (reduce || !window.gsap) {         // motion off or lib missing
      docEl.classList.remove('anim');     // guarantee content is visible
      window.__jbAnimReady = true;
      return;
    }
    window.__jbAnimReady = true;          // cancels the <head> failsafe timer
    initAnimations();
  });

  /* =========================================================
     ENTRANCE ANIMATIONS
     ========================================================= */
  function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power2.out' });

    heroIntro();
    revealHeadings();
    revealGroups();
    revealSteps();
    revealFinalCta();
    revealMisc();

    // Fonts / lazy images can shift positions — recalc once everything settles.
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* Reusable grid/list reveal: fade + rise (+ optional slight scale),
     staggered as the items enter the viewport. */
  function reveal(sel, opts) {
    var items = $all(sel);
    if (!items.length) return;
    opts = opts || {};
    gsap.set(items, {
      opacity: 0,
      y: opts.y == null ? 24 : opts.y,
      scale: opts.scale || 1
    });
    ScrollTrigger.batch(items, {
      start: opts.start || 'top 86%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, scale: 1,
          duration: opts.dur || 0.6,
          stagger: opts.stagger == null ? 0.08 : opts.stagger,
          overwrite: true
        });
      }
    });
  }

  /* Hero / page header — runs on load. Splits the headline into lines and
     staggers eyebrow -> headline lines -> supporting text -> chips -> CTAs. */
  function heroIntro() {
    var head = $('.phead');
    if (!head) return;

    var eyebrow = $('.eyebrow', head);
    var h1      = $('h1', head);
    var lead    = $('.wrap > p:not(.eyebrow)', head);
    var chips   = $all('.trust .chip', head);
    var ctas    = $all('.cta-row > *', head);
    var lines   = h1 ? splitLines(h1) : [];

    if (h1)          gsap.set(h1, { opacity: 1 });   // container visible; lines carry it
    if (lines.length) gsap.set(lines, { opacity: 0 }); // prevent 1-frame flash

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (eyebrow)      tl.fromTo(eyebrow, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, 0.05);
    if (lines.length) tl.fromTo(lines,   { opacity: 0, y: '0.55em' }, { opacity: 1, y: '0em', duration: 0.7, stagger: 0.1 }, 0.12);
    else if (h1)      tl.fromTo(h1,      { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 }, 0.08);
    if (lead)         tl.fromTo(lead,    { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.35');
    if (chips.length) tl.fromTo(chips,   { opacity: 0, y: 8  }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 }, '-=0.30');
    if (ctas.length)  tl.fromTo(ctas,    { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.25');
  }

  /* Wrap each <br>-separated line of a heading in its own block span so it
     can be animated independently. Preserves inner markup (e.g. gold span). */
  function splitLines(el) {
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) {
      return '<span class="l-line">' + p + '</span>';
    }).join('');
    return $all('.l-line', el);
  }

  function revealHeadings() {
    var heads = $all('.sec-head');
    if (!heads.length) return;
    gsap.set(heads, { opacity: 0, y: 20 });
    ScrollTrigger.batch(heads, {
      start: 'top 88%',
      once: true,
      onEnter: function (b) {
        gsap.to(b, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, overwrite: true });
      }
    });
  }

  function revealGroups() {
    reveal('.svc',   { scale: 0.985, stagger: 0.07 });        // service cards
    reveal('.value', { stagger: 0.08 });                      // "why JB" cards
    reveal('.rev',   { y: 26, stagger: 0.08 });               // reviews
    reveal('.ba',    { y: 28, stagger: 0.10 });               // before/after cards
    reveal('.town',  { y: 14, dur: 0.45, stagger: 0.04 });    // service-area rows
  }

  /* Three-step process: steps rise in sequence, and an injected vertical
     rail acts as a scroll-linked progress indicator connecting them. */
  function revealSteps() {
    $all('.steps').forEach(function (steps) {
      var rail = document.createElement('span');
      rail.className = 'steps-rail';
      rail.setAttribute('aria-hidden', 'true');
      var fill = document.createElement('span');
      fill.className = 'steps-rail-fill';
      rail.appendChild(fill);
      steps.insertBefore(rail, steps.firstChild);

      var stepEls = $all('.step', steps);
      gsap.set(stepEls, { opacity: 0, y: 22 });

      ScrollTrigger.create({
        trigger: steps, start: 'top 82%', once: true,
        onEnter: function () {
          gsap.to(stepEls, { opacity: 1, y: 0, duration: 0.55, stagger: 0.15, overwrite: true });
        }
      });

      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: steps, start: 'top 72%', end: 'bottom 62%', scrub: 0.4 }
      });
    });
  }

  /* Final CTA — a slightly stronger, sequenced entrance. */
  function revealFinalCta() {
    $all('.final').forEach(function (f) {
      var parts = [
        $('.eyebrow', f), $('h2', f), $('p', f), $('.cta-row', f)
      ].filter(Boolean);
      if (!parts.length) return;
      gsap.set(parts, { opacity: 0, y: 26 });
      ScrollTrigger.create({
        trigger: f, start: 'top 84%', once: true,
        onEnter: function () {
          gsap.to(parts, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', overwrite: true });
        }
      });
    });
  }

  /* About two-column + contact-grid content blocks. */
  function revealMisc() {
    reveal('.two-col > *',      { y: 24, stagger: 0.12 });
    reveal('.contact-grid > *', { y: 24, stagger: 0.12 });
  }

  /* =========================================================
     INTERACTIVE BEFORE / AFTER SLIDER
     Enhances only <article class="ba" data-ba-slider> cards.
     Cards without the attribute keep the side-by-side layout.
     ========================================================= */
  function buildBeforeAfterSliders() {
    $all('.ba[data-ba-slider]').forEach(function (card) {
      var imgs = $('.ba-imgs', card);
      if (!imgs) return;
      var beforeImg = $('.ba-fig.before img', imgs);
      var afterImg  = $('.ba-fig.after img', imgs);
      if (!beforeImg || !afterImg) return;

      var pos = card.getAttribute('data-ba-slider'); // "top"/"bottom"/"" (object-position)
      var objPos = pos === 'top' ? 'center top' : pos === 'bottom' ? 'center bottom' : 'center';

      var slider = document.createElement('div');
      slider.className = 'ba-slider';
      slider.style.setProperty('--pos', '50%');
      slider.setAttribute('role', 'slider');
      slider.setAttribute('tabindex', '0');
      slider.setAttribute('aria-label', 'Before and after comparison — drag or use arrow keys');
      slider.setAttribute('aria-valuemin', '0');
      slider.setAttribute('aria-valuemax', '100');
      slider.setAttribute('aria-valuenow', '50');
      slider.setAttribute('aria-valuetext', '50% before');

      var base = afterImg.cloneNode(true);   // base layer = AFTER
      base.className = 'ba-base';
      base.style.objectPosition = objPos;
      base.removeAttribute('width'); base.removeAttribute('height');

      var reveal = beforeImg.cloneNode(true); // top layer = BEFORE (clipped to left)
      reveal.className = 'ba-reveal';
      reveal.style.objectPosition = objPos;
      reveal.removeAttribute('width'); reveal.removeAttribute('height');
      reveal.setAttribute('loading', 'lazy');

      var labelB = mk('span', 'ba-label ba-label-before', 'Before');
      var labelA = mk('span', 'ba-label ba-label-after',  'After');

      var handle = document.createElement('span');
      handle.className = 'ba-handle';
      handle.setAttribute('aria-hidden', 'true');
      handle.innerHTML =
        '<span class="ba-grip"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" ' +
        'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M14 7l-5 5 5 5"/><path d="M10 7l5 5-5 5" opacity=".55"/></svg></span>';

      slider.appendChild(base);
      slider.appendChild(reveal);
      slider.appendChild(labelB);
      slider.appendChild(labelA);
      slider.appendChild(handle);

      imgs.replaceWith(slider);

      wireSlider(slider);
    });
  }

  function mk(tag, cls, text) {
    var el = document.createElement(tag);
    el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  function wireSlider(slider) {
    var dragging = false;

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      slider.style.setProperty('--pos', pct + '%');
      slider.setAttribute('aria-valuenow', Math.round(pct));
      slider.setAttribute('aria-valuetext', Math.round(pct) + '% before');
    }
    function pctFrom(clientX) {
      var r = slider.getBoundingClientRect();
      return ((clientX - r.left) / r.width) * 100;
    }

    slider.addEventListener('pointerdown', function (e) {
      dragging = true;
      if (slider.setPointerCapture) { try { slider.setPointerCapture(e.pointerId); } catch (_) {} }
      setPos(pctFrom(e.clientX));
    });
    slider.addEventListener('pointermove', function (e) {
      if (dragging) setPos(pctFrom(e.clientX));
    });
    function endDrag() { dragging = false; }
    slider.addEventListener('pointerup', endDrag);
    slider.addEventListener('pointercancel', endDrag);
    slider.addEventListener('lostpointercapture', endDrag);

    slider.addEventListener('keydown', function (e) {
      var cur = parseFloat(slider.getAttribute('aria-valuenow')) || 50;
      var step = e.shiftKey ? 10 : 4;
      if (e.key === 'ArrowLeft')       { setPos(cur - step); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setPos(cur + step); e.preventDefault(); }
      else if (e.key === 'Home')       { setPos(0);   e.preventDefault(); }
      else if (e.key === 'End')        { setPos(100); e.preventDefault(); }
    });
  }
})();

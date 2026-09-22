/*
 * Local membrane feedback for the navigation bubbles.
 * The anchor remains the hit target; this file only deforms its SVG artwork.
 */
(function () {
  'use strict';

  var instances = new WeakMap();
  var POINTS = 40;
  var CENTER = 100;
  var RADIUS = 92;
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function reducedMotion() {
    return !!(motionQuery && motionQuery.matches);
  }

  function circularDistance(a, b) {
    var tau = Math.PI * 2;
    var distance = ((a - b) % tau + tau) % tau;
    return Math.min(distance, tau - distance);
  }

  // A periodic Catmull-Rom spline converted to cubic Beziers keeps the edge smooth.
  function membranePath(values) {
    var points = values.map(function (offset, index) {
      var angle = index / POINTS * Math.PI * 2 - Math.PI / 2;
      var radius = RADIUS + offset;
      return {
        x: CENTER + Math.cos(angle) * radius,
        y: CENTER + Math.sin(angle) * radius
      };
    });
    var path = 'M ' + points[0].x.toFixed(2) + ' ' + points[0].y.toFixed(2);
    for (var i = 0; i < POINTS; i += 1) {
      var previous = points[(i - 1 + POINTS) % POINTS];
      var current = points[i];
      var next = points[(i + 1) % POINTS];
      var after = points[(i + 2) % POINTS];
      var control1x = current.x + (next.x - previous.x) / 6;
      var control1y = current.y + (next.y - previous.y) / 6;
      var control2x = next.x - (after.x - current.x) / 6;
      var control2y = next.y - (after.y - current.y) / 6;
      path += ' C ' + control1x.toFixed(2) + ' ' + control1y.toFixed(2) + ' ' +
        control2x.toFixed(2) + ' ' + control2y.toFixed(2) + ' ' +
        next.x.toFixed(2) + ' ' + next.y.toFixed(2);
    }
    return path + ' Z';
  }

  var REST_PATH = membranePath(new Array(POINTS).fill(0));

  function mount(container) {
    if (!container || !container.querySelectorAll) {
      return { destroy: function () {} };
    }
    var existing = instances.get(container);
    if (existing) existing.destroy();

    var abort = typeof AbortController === 'function' ? new AbortController() : null;
    var options = abort ? { signal: abort.signal } : false;
    var timers = [];
    var raf = 0;
    var destroyed = false;
    var active = true;
    var bubbles = [];
    var listeners = [];

    function addListener(node, type, listener) {
      node.addEventListener(type, listener, options);
      listeners.push({ node: node, type: type, listener: listener });
    }

    function removeTimer(timer) {
      var index = timers.indexOf(timer);
      if (index !== -1) timers.splice(index, 1);
    }

    function pointFromEvent(surface, event) {
      var rect = surface.getBoundingClientRect();
      if (!rect.width || !rect.height || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
        return { x: CENTER, y: CENTER, px: 50, py: 50 };
      }
      var px = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
      var py = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
      return { x: px * 2, y: py * 2, px: px, py: py };
    }

    function setContact(item, point, depth) {
      item.surface.style.setProperty('--touch-x', point.px + '%');
      item.surface.style.setProperty('--touch-y', point.py + '%');
      if (reducedMotion() || !active) return;
      var dx = point.x - CENTER, dy = point.y - CENTER;
      var proximity = Math.min(1, Math.sqrt(dx * dx + dy * dy) / RADIUS);
      // Centre touches make a ripple; edge touches push the nearby membrane.
      var influence = Math.max(0, (proximity - 0.2) / 0.8);
      depth *= influence * influence * (3 - 2 * influence);
      item.surface.style.setProperty('--shine-x', ((point.px - 50) * 0.09) + 'px');
      item.surface.style.setProperty('--shine-y', ((point.py - 50) * 0.07) + 'px');
      var angle = Math.atan2(dy, dx);
      // A compact Gaussian response makes a dent and lets nearby film follow it.
      for (var i = 0; i < POINTS; i += 1) {
        var sampleAngle = i / POINTS * Math.PI * 2 - Math.PI / 2;
        var local = circularDistance(sampleAngle, angle);
        item.target[i] = -depth * Math.exp(-(local * local) / 0.115);
      }
      ensureFrame(item);
    }

    function release(item) {
      item.pressed = false;
      item.surface.style.setProperty('--shine-x', '0px');
      item.surface.style.setProperty('--shine-y', '0px');
      item.target.fill(0);
      if (!reducedMotion() && active) ensureFrame(item);
    }

    function draw(item) {
      var d = membranePath(item.value);
      item.paths.forEach(function (path) { path.setAttribute('d', d); });
    }

    function settled(item) {
      for (var i = 0; i < POINTS; i += 1) {
        if (Math.abs(item.target[i] - item.value[i]) > 0.025 || Math.abs(item.velocity[i]) > 0.025) return false;
      }
      return true;
    }

    function tick() {
      raf = 0;
      if (destroyed || !active || reducedMotion()) return;
      var needsAnotherFrame = false;
      bubbles.forEach(function (item) {
        // Do not redraw a membrane that already matches its resting or hover target.
        if (settled(item)) return;
        for (var i = 0; i < POINTS; i += 1) {
          // Spring constants are intentionally conservative: membrane settles in ~350ms.
          item.velocity[i] += (item.target[i] - item.value[i]) * 0.22;
          item.velocity[i] *= 0.68;
          item.value[i] += item.velocity[i];
        }
        if (settled(item)) {
          for (var j = 0; j < POINTS; j += 1) {
            item.value[j] = item.target[j];
            item.velocity[j] = 0;
          }
        }
        draw(item);
        if (!settled(item)) needsAnotherFrame = true;
      });
      if (needsAnotherFrame) raf = requestAnimationFrame(tick);
    }

    function ensureFrame() {
      if (!raf && !destroyed && active && !reducedMotion()) raf = requestAnimationFrame(tick);
    }

    function makeRipple(item, point) {
      if (reducedMotion() || !active) return;
      var ripple = document.createElement('span');
      ripple.className = 'bubble-ripple';
      ripple.style.setProperty('--ripple-x', point.px + '%');
      ripple.style.setProperty('--ripple-y', point.py + '%');
      item.ripples.appendChild(ripple);
      if (ripple.animate) {
        var animation = ripple.animate([
          { opacity: 0.7, transform: 'translate(-50%, -50%) scale(0.15)' },
          { opacity: 0, transform: 'translate(-50%, -50%) scale(1)' }
        ], { duration: 680, easing: 'cubic-bezier(.16,.8,.25,1)' });
        animation.finished.catch(function () {}).then(function () { if (ripple.parentNode) ripple.remove(); });
      } else {
        var timer = window.setTimeout(function () { removeTimer(timer); if (ripple.parentNode) ripple.remove(); }, 700);
        timers.push(timer);
      }
    }

    function ordinaryPointerClick(event) {
      return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    }

    function activate(item, event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var isPointerActivation = event.detail > 0;
      if (isPointerActivation && !ordinaryPointerClick(event)) return;
      var point = pointFromEvent(item.surface, event);
      var href = item.anchor.getAttribute('href') || '';
      var activation = new CustomEvent('bubbleactivate', {
        bubbles: true,
        cancelable: true,
        detail: { x: point.x, y: point.y, href: href }
      });
      if (!item.anchor.dispatchEvent(activation)) {
        event.preventDefault();
        return;
      }

      // Preserve native keyboard activation. Pointer hash links get a short release beat.
      if (isPointerActivation && !reducedMotion() && href.charAt(0) === '#') {
        event.preventDefault();
        var timer = window.setTimeout(function () {
          removeTimer(timer);
          if (!destroyed && active) window.location.hash = href;
        }, 140);
        timers.push(timer);
      }
    }

    Array.prototype.forEach.call(container.querySelectorAll('.bubble[data-bubble]'), function (anchor) {
      var surface = anchor.querySelector('.bubble-surface');
      var paths = surface ? Array.prototype.slice.call(surface.querySelectorAll('[data-membrane]')) : [];
      var rippleHost = surface && surface.querySelector('.bubble-ripples');
      if (!surface || !paths.length || !rippleHost) return;
      var item = {
        anchor: anchor,
        surface: surface,
        paths: paths,
        ripples: rippleHost,
        value: new Array(POINTS).fill(0),
        velocity: new Array(POINTS).fill(0),
        target: new Array(POINTS).fill(0),
        pressed: false
      };
      paths.forEach(function (path) { path.setAttribute('d', REST_PATH); });
      bubbles.push(item);

      addListener(anchor, 'pointerenter', function (event) {
        if (event.pointerType === 'touch') return;
        var point = pointFromEvent(surface, event);
        setContact(item, point, 6);
        makeRipple(item, point);
      });
      addListener(anchor, 'pointermove', function (event) {
        if (event.pointerType !== 'touch' && event.buttons === 0) setContact(item, pointFromEvent(surface, event), 6);
        if (item.pressed) setContact(item, pointFromEvent(surface, event), 12);
      });
      addListener(anchor, 'pointerleave', function (event) {
        release(item);
      });
      addListener(anchor, 'pointerdown', function (event) {
        if (event.button !== 0) return;
        item.pressed = true;
        setContact(item, pointFromEvent(surface, event), 12);
      });
      addListener(anchor, 'pointerup', function (event) {
        if (!item.pressed) return;
        var point = pointFromEvent(surface, event);
        makeRipple(item, point);
        release(item);
      });
      addListener(anchor, 'pointercancel', function () { release(item); });
      addListener(anchor, 'focus', function () { setContact(item, { x: CENTER, y: CENTER - 32, px: 50, py: 34 }, 4); });
      addListener(anchor, 'blur', function () { release(item); });
      addListener(anchor, 'click', function (event) { activate(item, event); });
    });

    function stopAndReset() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      bubbles.forEach(function (item) {
        item.value.fill(0); item.velocity.fill(0); item.target.fill(0); item.pressed = false;
        item.surface.style.setProperty('--shine-x', '0px');
        item.surface.style.setProperty('--shine-y', '0px');
        draw(item);
      });
    }

    function containerIsActive() {
      if (document.hidden || container.dataset.bubbleActive === 'false') return false;
      var home = document.getElementById('view-home');
      if (home && (home === container || home.contains(container))) {
        return !window.location.hash || window.location.hash === '#home';
      }
      return true;
    }

    function updateActivity() {
      active = containerIsActive();
      if (!active) stopAndReset();
    }

    addListener(document, 'visibilitychange', updateActivity);
    addListener(window, 'hashchange', updateActivity);
    if (motionQuery) {
      var motionChange = function () { stopAndReset(); };
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', motionChange, options);
        listeners.push({ node: motionQuery, type: 'change', listener: motionChange });
      }
      else motionQuery.addListener(motionChange);
    }
    updateActivity();

    var api = {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        stopAndReset();
        timers.forEach(function (timer) { clearTimeout(timer); });
        timers.length = 0;
        bubbles.forEach(function (item) {
          item.surface.style.removeProperty('--touch-x');
          item.surface.style.removeProperty('--touch-y');
          Array.prototype.forEach.call(item.ripples.querySelectorAll('.bubble-ripple'), function (ripple) { ripple.remove(); });
        });
        if (abort) abort.abort();
        listeners.forEach(function (entry) { entry.node.removeEventListener(entry.type, entry.listener); });
        listeners.length = 0;
        if (motionQuery && !motionQuery.addEventListener) motionQuery.removeListener(motionChange);
        instances.delete(container);
      }
    };
    instances.set(container, api);
    return api;
  }

  window.BubbleField = window.BubbleField || {};
  window.BubbleField.mount = mount;
}());

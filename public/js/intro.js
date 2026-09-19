/**
 * Prawnique - Wave Intro Animation
 *
 * Runs on the landing page only, loaded synchronously from <head> so the page
 * underneath is hidden before it ever paints. The sequence is:
 *
 *   1. logo spins in and settles, ripples push outward
 *   2. the tagline surfaces letter by letter
 *   3. the sea rises and swallows the screen
 *   4. the whole overlay lifts away, revealing the site
 *
 * Everything here is controlled from the admin panel (Settings -> Intro
 * Animation): on/off, duration, tagline, and how often it plays.
 */
(function () {
    'use strict';

    // The intro belongs to the landing page only. Inner pages are reached by
    // navigation, and replaying it there would sit in front of the content the
    // visitor just asked for.
    var path = window.location.pathname.replace(/\/+$/, '');
    // Trailing slashes are stripped above, so the landing page is the empty
    // path. /index.html is redirected to / by the server before it gets here.
    var isLandingPage = path === '' || path === '/index';
    if (!isLandingPage) return;

    var SETTINGS_CACHE_KEY = 'prawnique.introSettings';
    var SESSION_SEEN_KEY = 'prawnique.introSeen';

    var defaults = {
        enabled: true,
        duration: 3200,
        tagline: 'Premium Prawns, Naturally Sourced',
        oncePerSession: false,
        logo: '/img/logo.png',
        wordmark: 'Prawnique'
    };

    // localStorage is unavailable in some privacy modes; never let that break the page.
    function readStore(store, key) {
        try {
            return window[store].getItem(key);
        } catch (e) {
            return null;
        }
    }

    function writeStore(store, key, value) {
        try {
            window[store].setItem(key, value);
        } catch (e) {
            /* ignore */
        }
    }

    /**
     * The intro has to start before /api/settings can possibly answer, so the
     * last known settings are cached and used to decide instantly. The live
     * values are fetched in parallel and refresh the cache for next time.
     */
    function cachedSettings() {
        var raw = readStore('localStorage', SETTINGS_CACHE_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function resolveSettings() {
        var cached = cachedSettings() || {};
        return {
            enabled: cached.enabled !== undefined ? cached.enabled : defaults.enabled,
            duration: cached.duration || defaults.duration,
            tagline: cached.tagline !== undefined ? cached.tagline : defaults.tagline,
            oncePerSession: cached.oncePerSession !== undefined ? cached.oncePerSession : defaults.oncePerSession,
            logo: cached.logo || defaults.logo,
            wordmark: cached.wordmark || defaults.wordmark
        };
    }

    function refreshSettingsCache() {
        fetch('/api/settings')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (s) {
                if (!s) return;
                var duration = parseInt(s.intro_animation_duration, 10);
                writeStore('localStorage', SETTINGS_CACHE_KEY, JSON.stringify({
                    enabled: s.intro_animation_enabled !== 'false',
                    duration: isNaN(duration) ? defaults.duration : Math.min(Math.max(duration, 1200), 10000),
                    tagline: s.intro_animation_tagline !== undefined ? s.intro_animation_tagline : defaults.tagline,
                    oncePerSession: s.intro_animation_once_per_session !== 'false',
                    logo: s.site_logo || defaults.logo,
                    wordmark: s.site_name || defaults.wordmark
                }));
            })
            .catch(function () { /* offline or API down - keep the cached values */ });
    }

    var settings = resolveSettings();
    var alreadySeen = settings.oncePerSession && readStore('sessionStorage', SESSION_SEEN_KEY) === '1';
    var shouldPlay = settings.enabled && !alreadySeen;

    // Always refresh the cache, even when we are not playing this time round,
    // so toggling the setting in the admin panel takes effect on the next load.
    refreshSettingsCache();

    if (!shouldPlay) return;

    // Hide the page immediately - this is the whole reason the script sits in <head>.
    document.documentElement.classList.add('intro-armed');

    // A stalled script must never leave the site permanently hidden.
    var failSafe = setTimeout(disarm, Math.max(settings.duration, 3000) + 4000);

    function disarm() {
        clearTimeout(failSafe);
        document.documentElement.classList.remove('intro-armed');
        var overlay = document.getElementById('introOverlay');
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    onReady(function () {
        try {
            play();
        } catch (e) {
            console.error('Intro animation failed:', e);
            disarm();
        }
    });

    function play() {
        writeStore('sessionStorage', SESSION_SEEN_KEY, '1');

        var prefersReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var overlay = buildOverlay();
        document.body.appendChild(overlay);

        var finished = false;
        var duration = prefersReducedMotion ? 1100 : settings.duration;

        function finish() {
            if (finished) return;
            finished = true;
            stopWaves();
            overlay.classList.add('intro-finishing');
            // Reveal the page as the water lifts, not after it, so the two read
            // as a single movement.
            document.documentElement.classList.remove('intro-armed');
            var exitMs = prefersReducedMotion ? 340 : 920;
            setTimeout(disarm, exitMs);
        }

        overlay.querySelector('.intro-skip').addEventListener('click', finish);
        overlay.addEventListener('click', finish);
        document.addEventListener('keydown', function onKey(e) {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                document.removeEventListener('keydown', onKey);
                finish();
            }
        });

        var stopWaves = prefersReducedMotion
            ? function () {}
            : animateWaves(overlay, duration);

        setTimeout(finish, duration);
    }

    // ------------------------------------------------------------------
    // Markup
    // ------------------------------------------------------------------

    function buildOverlay() {
        var overlay = document.createElement('div');
        overlay.className = 'intro-overlay';
        overlay.id = 'introOverlay';
        overlay.setAttribute('role', 'presentation');
        overlay.setAttribute('aria-hidden', 'true');

        var rays = '<div class="intro-rays">' +
            '<span class="intro-ray"></span><span class="intro-ray"></span>' +
            '<span class="intro-ray"></span><span class="intro-ray"></span>' +
            '</div>';

        // The logo artwork already carries the Prawnique wordmark, so the intro
        // shows the tagline instead of repeating the name. Each letter surfaces
        // on its own beat, like something rising through water.
        var tagline = settings.tagline
            ? '<p class="intro-tagline">' + letterByLetter(settings.tagline, 1250, 34) + '</p>'
            : '';

        overlay.innerHTML =
            rays +
            '<div class="intro-bubbles">' + bubbleMarkup() + '</div>' +
            '<svg class="intro-water" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">' +
            '  <defs>' +
            '    <linearGradient id="introWaveFill" x1="0" y1="0" x2="0" y2="1">' +
            '      <stop offset="0%" stop-color="#40c4ff" stop-opacity="0.55"/>' +
            '      <stop offset="100%" stop-color="#0a2342" stop-opacity="0.95"/>' +
            '    </linearGradient>' +
            '  </defs>' +
            '  <path class="intro-wave" data-layer="0" fill="#1a4a6e" fill-opacity="0.55"></path>' +
            '  <path class="intro-wave" data-layer="1" fill="url(#introWaveFill)" fill-opacity="0.75"></path>' +
            '  <path class="intro-wave" data-layer="2" fill="#40c4ff" fill-opacity="0.28"></path>' +
            '</svg>' +
            '<div class="intro-stage">' +
            '  <div class="intro-logo-wrap">' +
            '    <span class="intro-ripple"></span>' +
            '    <span class="intro-ripple"></span>' +
            '    <span class="intro-ripple"></span>' +
            '    <span class="intro-logo-medallion">' +
            '      <img class="intro-logo" src="' + escapeHtml(settings.logo) + '" alt="">' +
            '    </span>' +
            '  </div>' +
            tagline +
            '</div>' +
            '<button type="button" class="intro-skip">Skip</button>';

        return overlay;
    }

    // Each letter is its own inline-block, which would otherwise let the line
    // break in the middle of a word. Words are wrapped in a nowrap span so the
    // text still breaks only at spaces.
    function letterByLetter(text, startDelay, step) {
        var index = 0;
        return String(text)
            .split(/(\s+)/)
            .map(function (chunk) {
                if (/^\s+$/.test(chunk)) {
                    index += chunk.length;
                    return ' ';
                }
                var letters = chunk.split('').map(function (ch) {
                    var delay = startDelay + index * step;
                    index += 1;
                    return '<span style="animation-delay:' + delay + 'ms">' + escapeHtml(ch) + '</span>';
                }).join('');
                return '<span class="intro-word">' + letters + '</span>';
            })
            .join('');
    }

    function bubbleMarkup() {
        var html = '';
        for (var i = 0; i < 16; i++) {
            var size = 6 + Math.random() * 20;
            var left = Math.random() * 100;
            var dur = 5 + Math.random() * 6;
            var delay = -Math.random() * 8;
            var drift = (Math.random() * 80 - 40).toFixed(0);
            html += '<span class="intro-bubble" style="' +
                'width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;' +
                'left:' + left.toFixed(2) + '%;' +
                'animation-duration:' + dur.toFixed(2) + 's;' +
                'animation-delay:' + delay.toFixed(2) + 's;' +
                '--drift:' + drift + 'px;"></span>';
        }
        return html;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ------------------------------------------------------------------
    // Wave simulation
    // ------------------------------------------------------------------

    var VIEW_W = 1440;
    var VIEW_H = 900;
    var REST_LEVEL = 0.82 * VIEW_H;  // where the sea sits while the logo plays
    var FLOOD_LEVEL = -80;           // above the top edge: screen fully covered

    // Two sine components per layer keep the surface from looking like a single
    // repeating ripple.
    var LAYERS = [
        { amp: 26, k: 0.0062, speed: 0.0014, phase: 0.0, amp2: 11, k2: 0.0131, speed2: -0.0021, offset: 18 },
        { amp: 20, k: 0.0083, speed: 0.0019, phase: 2.1, amp2: 9,  k2: 0.0167, speed2: 0.0027,  offset: 0 },
        { amp: 14, k: 0.0112, speed: -0.0024, phase: 4.3, amp2: 7, k2: 0.0203, speed2: 0.0016,  offset: -14 }
    ];

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animateWaves(overlay, duration) {
        var paths = overlay.querySelectorAll('.intro-wave');
        var start = performance.now();
        var running = true;

        // The flood starts late enough that the logo and wordmark have landed.
        var floodStart = Math.max(duration - 1150, 900);
        var floodEnd = Math.max(duration - 150, floodStart + 400);

        function draw(now) {
            if (!running) return;

            var elapsed = now - start;
            var floodProgress = 0;
            if (elapsed > floodStart) {
                floodProgress = Math.min((elapsed - floodStart) / (floodEnd - floodStart), 1);
            }
            var level = REST_LEVEL + (FLOOD_LEVEL - REST_LEVEL) * easeInOutCubic(floodProgress);

            for (var i = 0; i < paths.length; i++) {
                var layer = LAYERS[i];
                // Chop flattens out as the water floods so the fill lands smooth.
                var calm = 1 - 0.65 * floodProgress;
                var baseline = level + layer.offset * calm;
                var d = 'M -40 ' + VIEW_H;

                for (var x = -40; x <= VIEW_W + 40; x += 20) {
                    var y = baseline +
                        Math.sin(x * layer.k + elapsed * layer.speed + layer.phase) * layer.amp * calm +
                        Math.sin(x * layer.k2 + elapsed * layer.speed2 + layer.phase) * layer.amp2 * calm;
                    d += ' L ' + x + ' ' + y.toFixed(1);
                }

                d += ' L ' + (VIEW_W + 40) + ' ' + VIEW_H + ' Z';
                paths[i].setAttribute('d', d);
            }

            requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);

        return function stop() {
            running = false;
        };
    }
})();

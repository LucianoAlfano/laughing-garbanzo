/* ===========================================================
   Harbor & Vine — muted background video with an honest fallback
   Poster image shows whenever playback is blocked or paused.
   =========================================================== */
(function () {
  'use strict';
  var video = document.querySelector('video.hero-video-bg');
  if (!video) return;

  var button = document.querySelector('.video-toggle');
  var mobile = matchMedia('(max-width:767px)');
  var motion = matchMedia('(prefers-reduced-motion:reduce)');
  var userPaused = false, source = '', mobileFailed = false;

  function silence() {
    if (!video.muted) video.muted = true;
    video.defaultMuted = true;
    if (video.volume !== 0) video.volume = 0;
    video.setAttribute('muted', '');
  }
  function label() {
    if (!button) return;
    button.hidden = false;
    var paused = video.paused;
    button.textContent = paused ? 'Play video' : 'Pause video';
    button.setAttribute('aria-label', (paused ? 'Play' : 'Pause') + ' background video');
    button.setAttribute('aria-pressed', String(!paused));
  }
  function play() {
    silence();
    if (userPaused || document.hidden || motion.matches) return;
    var attempt = video.play();
    if (attempt && typeof attempt['catch'] === 'function') attempt['catch'](label);
  }
  function wanted() {
    return mobile.matches && !mobileFailed ? 'Restaurant-Home-Video-Mobile.mp4' : 'Restaurant-Home-Video.mp4';
  }
  function select() {
    var next = wanted();
    if (next !== source) {
      source = next;
      video.src = next;
      video.load();
    }
    play();
    label();
  }

  video.addEventListener('error', function () {
    if (mobile.matches && !mobileFailed) { mobileFailed = true; select(); } else label();
  });
  video.addEventListener('canplay', play);
  video.addEventListener('playing', label);
  video.addEventListener('pause', label);
  video.addEventListener('volumechange', silence);

  if (button) button.addEventListener('click', function () {
    if (video.paused) {
      userPaused = false;
      if (!source) select();
      silence();
      var attempt = video.play();
      if (attempt && typeof attempt['catch'] === 'function') attempt['catch'](label);
    } else {
      userPaused = true;
      video.pause();
    }
    label();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) video.pause(); else play();
  });
  document.addEventListener('pointerdown', function () { play(); }, { once: true, passive: true });

  function watch(query, handler) {
    if (query.addEventListener) query.addEventListener('change', handler);
    else if (query.addListener) query.addListener(handler);
  }
  watch(mobile, select);
  watch(motion, function () {
    if (motion.matches) video.pause(); else play();
    label();
  });

  silence();
  if (motion.matches) {
    video.removeAttribute('autoplay');
    video.preload = 'none';
    label();
  } else {
    select();
  }
})();

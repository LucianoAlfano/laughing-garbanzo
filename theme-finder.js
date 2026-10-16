/* ===========================================================
   NextDay Digital — guided theme finder
   Local only: no tracking, no storage, no automatic submission.
   Share links carry public choices in the URL fragment, never notes.
   =========================================================== */
(function () {
  'use strict';

  var themes = [
    { id: 'restaurant',   name: 'Harbor & Vine',       industry: 'Restaurant',           tone: 'editorial',  goal: 'menu',     features: 'Seasonal menu · Wine list · Reservation journey' },
    { id: 'bakery',       name: 'Sunday Crumb',        industry: 'Bakery & café',        tone: 'warm',       goal: 'menu',     features: 'Daily offerings · Signature bakes · Catering' },
    { id: 'landscape',    name: 'Field & Form',        industry: 'Landscape & garden',   tone: 'organic',    goal: 'projects', features: 'Project stories · Process · Care plans' },
    { id: 'auto',         name: 'Gloss Garage',        industry: 'Auto detailing',       tone: 'bold',       goal: 'projects', features: 'Service packages · Process · Results' },
    { id: 'fitness',      name: 'Northpoint Strength', industry: 'Fitness & training',   tone: 'bold',       goal: 'booking',  features: 'Programmes · Timetable · Memberships' },
    { id: 'salon',        name: 'Linden & Co',         industry: 'Salon & wellness',     tone: 'editorial',  goal: 'booking',  features: 'Service menu · Team · Booking journey' },
    { id: 'contractor',   name: 'Granite Ridge',       industry: 'Contractor & trades',  tone: 'bold',       goal: 'quotes',   features: 'Services · Credentials · Estimate journey' },
    { id: 'professional', name: 'Calloway & Reed',     industry: 'Professional services',tone: 'structured', goal: 'quotes',   features: 'Practice areas · Team · Consultation journey' }
  ];
  var goals = {
    menu: 'Menu or product list',
    projects: 'Showcase finished work',
    booking: 'Guide visitors toward booking',
    quotes: 'Quote or consultation enquiries'
  };
  var tones = {
    editorial: 'Editorial & understated',
    warm: 'Warm & welcoming',
    organic: 'Organic & photography-led',
    bold: 'Bold & high contrast',
    structured: 'Structured & restrained'
  };
  var ids = themes.map(function (t) { return t.id; });
  var MAX = 3;

  /* ---------- pure state helpers ---------- */
  function clean(raw) {
    raw = raw || {};
    var list = Array.isArray(raw.selected) ? raw.selected : [];
    var selected = [];
    list.forEach(function (id) {
      if (ids.indexOf(id) > -1 && selected.indexOf(id) === -1 && selected.length < MAX) selected.push(id);
    });
    return {
      industry: ids.indexOf(raw.industry) > -1 ? raw.industry : 'other',
      goal: Object.prototype.hasOwnProperty.call(goals, raw.goal) ? raw.goal : '',
      tone: Object.prototype.hasOwnProperty.call(tones, raw.tone) ? raw.tone : '',
      selected: selected,
      preferred: selected.indexOf(raw.preferred) > -1 ? raw.preferred : ''
    };
  }
  function encode(state) {
    var s = clean(state), q = new URLSearchParams();
    q.set('v', '4');
    if (s.industry !== 'other') q.set('i', s.industry);
    if (s.goal) q.set('g', s.goal);
    if (s.tone) q.set('t', s.tone);
    if (s.selected.length) q.set('s', s.selected.join(','));
    if (s.preferred) q.set('p', s.preferred);
    return '#' + q.toString();
  }
  function decode(hash) {
    var q = new URLSearchParams(String(hash || '').replace(/^#/, ''));
    return clean({
      industry: q.get('i'), goal: q.get('g'), tone: q.get('t'),
      selected: (q.get('s') || '').split(','), preferred: q.get('p')
    });
  }
  function rank(state) {
    return themes.map(function (t, i) {
      return {
        t: t, i: i,
        score: (t.id === state.industry ? 100 : 0) +
               (state.goal && t.goal === state.goal ? 20 : 0) +
               (state.tone && t.tone === state.tone ? 8 : 0)
      };
    }).sort(function (a, b) {
      return b.score - a.score || a.i - b.i;
    }).map(function (x) { return x.t; });
  }
  function toggle(state, id) {
    var next = clean(state);
    if (ids.indexOf(id) === -1) return next;
    if (next.selected.indexOf(id) > -1) {
      next.selected = next.selected.filter(function (x) { return x !== id; });
      if (next.preferred === id) next.preferred = '';
    } else if (next.selected.length < MAX) {
      next.selected.push(id);
    }
    return next;
  }
  function matchesView(theme, query, onlyShortlisted, selected) {
    var haystack = [theme.name, theme.industry, theme.features, tones[theme.tone], goals[theme.goal]]
      .join(' ').toLowerCase();
    var words = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (onlyShortlisted && selected.indexOf(theme.id) === -1) return false;
    return words.every(function (w) { return haystack.indexOf(w) > -1; });
  }

  /* ---------- wiring ---------- */
  var form = document.getElementById('guide');
  if (!form) return;
  document.documentElement.classList.add('finder-js');

  function $(id) { return document.getElementById(id); }
  var cards = $('cards'), brief = $('brief'), dialog = $('theme-dialog');
  var state = decode(location.hash);
  var undoState = null, previewId = '', previewTrigger = null, prepared = false, stale = false;

  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function actionButton(text, action, id) {
    var b = el('button', text);
    b.type = 'button';
    b.dataset.action = action;
    b.dataset.id = id;
    return b;
  }
  function publicState() {
    return clean({
      industry: form.elements.industry.value,
      goal: form.elements.goal.value,
      tone: form.elements.tone.value,
      selected: state.selected,
      preferred: state.preferred
    });
  }
  function markStale() {
    if (!prepared) return;
    stale = true;
    $('brief-status').textContent = 'Choices changed. Prepare the brief again before copying, downloading, printing or emailing.';
    ['copy', 'download', 'print'].forEach(function (id) { $(id).disabled = true; });
    var mail = $('email');
    mail.removeAttribute('href');
    mail.setAttribute('aria-disabled', 'true');
    mail.classList.add('disabled-link');
  }
  function persist() {
    state = publicState();
    try { history.replaceState(null, '', location.pathname + location.search + encode(state)); } catch (e) {}
    $('share-panel').hidden = true;
    markStale();
  }
  function reason(theme) {
    var out = [];
    if (theme.id === state.industry) out.push('Your industry');
    if (state.goal && theme.goal === state.goal) out.push('Matches your priority');
    if (state.tone && theme.tone === state.tone) out.push('Matches your visual direction');
    return out.length ? out.join(' · ') : 'Another direction to explore';
  }
  function filterCards() {
    var query = $('theme-search').value, only = $('shortlist-only').checked, count = 0;
    themes.forEach(function (t) {
      var visible = matchesView(t, query, only, state.selected);
      cards.querySelector('[data-id="' + t.id + '"]').hidden = !visible;
      if (visible) count++;
    });
    $('browse-count').textContent = count + ' of ' + themes.length + ' directions shown';
    $('browse-empty').hidden = count !== 0;
  }
  function syncPreview() {
    if (!previewId) return;
    var selected = state.selected.indexOf(previewId) > -1, b = $('dialog-shortlist');
    b.textContent = selected ? 'Remove from shortlist' : 'Shortlist this direction +';
    b.setAttribute('aria-pressed', String(selected));
  }
  function rememberChange(message) {
    undoState = clean(state);
    $('undo-panel').hidden = false;
    $('undo-message').textContent = message;
  }

  function render() {
    var ordered = rank(state);
    ordered.forEach(function (t) {
      var card = cards.querySelector('[data-id="' + t.id + '"]');
      cards.appendChild(card);
      card.querySelector('[data-reason]').textContent = reason(t);
      var add = card.querySelector('[data-add]');
      var selected = state.selected.indexOf(t.id) > -1;
      add.setAttribute('aria-pressed', String(selected));
      add.textContent = selected ? 'Shortlisted ✓' : 'Shortlist +';
      add.setAttribute('aria-label', (selected ? 'Remove ' : 'Shortlist ') + t.name);
      card.classList.toggle('selected', selected);
    });
    filterCards();
    syncPreview();

    var grid = $('comparison');
    grid.replaceChildren();
    if (!state.selected.length) {
      var empty = el('div', '', 'empty');
      empty.appendChild(el('h3', 'Your shortlist is a blank canvas.'));
      empty.appendChild(el('p', 'Choose up to three directions above, then compare them here and mark a preferred starting point.'));
      grid.appendChild(empty);
    }
    state.selected.forEach(function (id) {
      var t = themes.filter(function (x) { return x.id === id; })[0];
      var card = el('article', '', 'compare-card');
      card.classList.toggle('preferred', id === state.preferred);
      card.appendChild(el('p', id === state.preferred ? 'Preferred starting point' : 'Shortlisted direction', 'eyebrow'));
      card.appendChild(el('h3', t.name));
      var dl = el('dl');
      [['Business', t.industry], ['Visual direction', tones[t.tone]], ['Starting structure', t.features]]
        .forEach(function (pair) { dl.appendChild(el('dt', pair[0])); dl.appendChild(el('dd', pair[1])); });
      var actions = el('div', '', 'actions');
      var demo = el('a', 'Explore demo ↗');
      demo.href = t.id + '.html';
      var prefer = actionButton(id === state.preferred ? 'Preferred ✓' : 'Make preferred', 'prefer', id);
      prefer.setAttribute('aria-pressed', String(id === state.preferred));
      prefer.setAttribute('aria-label', 'Make ' + t.name + ' the preferred direction');
      var remove = actionButton('Remove', 'remove', id);
      remove.setAttribute('aria-label', 'Remove ' + t.name + ' from shortlist');
      actions.appendChild(demo); actions.appendChild(prefer); actions.appendChild(remove);
      card.appendChild(dl); card.appendChild(actions);
      grid.appendChild(card);
    });

    $('tray').hidden = !state.selected.length;
    $('count').textContent = state.selected.length + ' of ' + MAX + ' shortlisted';
    $('shortlist-help').textContent = state.selected.length
      ? state.selected.length + ' directions selected. Choose a preferred starting point, or remove any direction here.'
      : 'Choose up to three directions. Mark one as your preferred starting point.';
  }

  function restore() {
    state = decode(location.hash);
    form.elements.industry.value = state.industry;
    form.elements.goal.value = state.goal;
    form.elements.tone.value = state.tone;
    render();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    persist();
    render();
    $('status').textContent = 'Suggested starting point: ' + rank(state)[0].name + '. Match reasons appear on each card.';
  });
  form.addEventListener('change', function () {
    persist();
    render();
    $('status').textContent = 'Suggestions updated for your choices.';
  });

  $('theme-search').addEventListener('input', filterCards);
  $('shortlist-only').addEventListener('change', filterCards);
  $('reset-browse').addEventListener('click', function () {
    $('theme-search').value = '';
    $('shortlist-only').checked = false;
    filterCards();
    $('theme-search').focus();
  });

  cards.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) {
      var id = add.dataset.add;
      if (state.selected.length === MAX && state.selected.indexOf(id) === -1) {
        $('status').textContent = 'Three directions are already shortlisted. Remove one before adding another.';
        return;
      }
      rememberChange('Shortlist updated.');
      state = toggle(state, id);
      persist();
      render();
      var next = cards.querySelector('[data-add="' + id + '"]');
      if (next && !next.closest('[hidden]')) next.focus({ preventScroll: true });
      else $('browse-title').focus({ preventScroll: true });
      $('status').textContent = state.selected.length + ' directions shortlisted.';
      return;
    }
    var trigger = e.target.closest('[data-preview]');
    if (!trigger) return;
    var theme = themes.filter(function (x) { return x.id === trigger.dataset.preview; })[0];
    if (!theme) return;
    if (!dialog || typeof dialog.showModal !== 'function') { location.href = theme.id + '.html'; return; }
    previewId = theme.id;
    previewTrigger = trigger;
    $('dialog-title').textContent = theme.name;
    $('dialog-industry').textContent = theme.industry;
    $('dialog-reason').textContent = reason(theme);
    $('dialog-features').textContent = theme.features;
    $('dialog-demo').href = theme.id + '.html';
    $('dialog-art').replaceChildren(cards.querySelector('[data-id="' + theme.id + '"] .art').cloneNode(true));
    $('dialog-status').textContent = '';
    syncPreview();
    dialog.showModal();
    $('dialog-close').focus();
  });

  if (dialog) {
    $('dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) {
      if (e.target !== dialog) return;
      var r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener('close', function () {
      if (previewTrigger && !previewTrigger.closest('[hidden]')) previewTrigger.focus({ preventScroll: true });
      else $('browse-title').focus({ preventScroll: true });
      previewId = '';
    });
    $('dialog-shortlist').addEventListener('click', function () {
      if (!previewId) return;
      if (state.selected.length === MAX && state.selected.indexOf(previewId) === -1) {
        $('dialog-status').textContent = 'Your shortlist has three directions. Remove one before adding another.';
        return;
      }
      rememberChange('Shortlist updated from quick view.');
      state = toggle(state, previewId);
      persist();
      render();
      $('dialog-status').textContent = state.selected.indexOf(previewId) > -1
        ? 'Added to your shortlist.' : 'Removed from your shortlist.';
    });
  }

  $('comparison').addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (!b) return;
    var id = b.dataset.id;
    rememberChange(b.dataset.action === 'remove' ? 'Direction removed.' : 'Preferred direction changed.');
    if (b.dataset.action === 'remove') state = toggle(state, id);
    else if (state.selected.indexOf(id) > -1) state.preferred = id;
    persist();
    render();
    $('share-status').textContent = b.dataset.action === 'remove' ? 'Direction removed.' : 'Preferred direction updated.';
    var target = b.dataset.action === 'remove'
      ? $('shortlist-title')
      : $('comparison').querySelector('[data-action="prefer"][data-id="' + id + '"]');
    if (target) target.focus({ preventScroll: true });
  });

  $('undo').addEventListener('click', function () {
    if (!undoState) return;
    var previous = undoState;
    undoState = null;
    state.selected = previous.selected.slice();
    state.preferred = previous.preferred;
    persist();
    render();
    $('undo-panel').hidden = true;
    $('share-status').textContent = 'Last shortlist change undone. Filters and notes were kept.';
    $('shortlist-title').focus({ preventScroll: true });
  });

  $('clear').addEventListener('click', function () {
    rememberChange('Shortlist cleared.');
    state.selected = [];
    state.preferred = '';
    persist();
    render();
    $('share-status').textContent = 'Shortlist cleared. Your filters and notes remain.';
  });

  function copyText(text, field, status) {
    function fallback() {
      field.focus();
      if (field.select) field.select();
      status.textContent = 'Select and copy the text above. Automatic clipboard access was unavailable.';
    }
    try {
      if (!navigator.clipboard) { fallback(); return; }
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = 'Copied.';
      })['catch'](fallback);
    } catch (e) { fallback(); }
  }

  $('share').addEventListener('click', function () {
    var url = new URL(location.href);
    url.hash = encode(publicState());
    $('share-url').value = url.href;
    $('share-panel').hidden = false;
    copyText(url.href, $('share-url'), $('share-status'));
  });

  $('notes').addEventListener('input', markStale);

  function makeBrief() {
    var s = publicState();
    var industry = themes.filter(function (t) { return t.id === s.industry; })[0];
    var preferred = themes.filter(function (t) { return t.id === s.preferred; })[0];
    var lines = [
      'WEBSITE PROJECT BRIEF',
      'For Anthony & Luciano Alfano | NextDay Digital',
      '',
      'Business: ' + (industry ? industry.industry : 'Something else / still exploring'),
      'Priority: ' + (goals[s.goal] || 'Open to discussion'),
      'Visual direction: ' + (tones[s.tone] || 'Open to ideas'),
      'Preferred starting point: ' + (preferred ? preferred.name : 'Not chosen yet'),
      '',
      'SHORTLIST'
    ];
    if (s.selected.length) {
      s.selected.forEach(function (id) {
        lines.push('- ' + themes.filter(function (t) { return t.id === id; })[0].name);
      });
    } else {
      lines.push('Help me choose a direction.');
    }
    lines.push('', 'WHAT I WANT THE WEBSITE TO DO BETTER', $('notes').value.trim() || 'To discuss.',
      '', 'A conversation starter, not an agreed scope, quote or booking.');
    return lines.join('\n');
  }

  $('prepare').addEventListener('click', function () {
    brief.value = makeBrief();
    $('print-brief').textContent = brief.value;
    $('brief-panel').hidden = false;
    prepared = true;
    stale = false;
    ['copy', 'download', 'print'].forEach(function (id) { $(id).disabled = false; });
    var mail = $('email');
    mail.href = 'mailto:anthonyalfano157@gmail.com?subject=' +
      encodeURIComponent('Website brief for Anthony and Luciano') +
      '&body=' + encodeURIComponent(brief.value);
    mail.removeAttribute('aria-disabled');
    mail.classList.remove('disabled-link');
    $('brief-status').textContent = 'Brief ready. Nothing has been sent.';
    brief.focus({ preventScroll: true });
  });

  $('copy').addEventListener('click', function () {
    if (!stale) copyText(brief.value, brief, $('brief-status'));
  });
  $('download').addEventListener('click', function () {
    if (stale) return;
    var url = URL.createObjectURL(new Blob([brief.value], { type: 'text/plain;charset=utf-8' }));
    var a = el('a');
    a.href = url;
    a.download = 'NextDay-project-brief.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    $('brief-status').textContent = 'Download requested. Nothing has been sent.';
  });
  $('print').addEventListener('click', function () { if (!stale) window.print(); });
  $('email').addEventListener('click', function (e) {
    if (stale) { e.preventDefault(); return; }
    $('brief-status').textContent = 'Your email app may open a draft. Review and send it there. If nothing opens, copy or download the brief.';
  });

  Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (a) {
    a.addEventListener('click', function (e) {
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  addEventListener('hashchange', function () {
    if (location.hash.indexOf('#v=') !== 0) return;
    undoState = null;
    $('undo-panel').hidden = true;
    restore();
    markStale();
    $('share-status').textContent = 'Shared choices loaded. Notes were not included.';
  });

  restore();
  if (location.hash.indexOf('#v=') === 0) {
    $('share-status').textContent = 'Shared choices restored. Notes are never included in shared links.';
  }
})();

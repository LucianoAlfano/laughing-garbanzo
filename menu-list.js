(function () {
  "use strict";
  var config = window.HARBOR_MENU_CONFIG || {};
  var root = document.getElementById("menu-list");
  var status = document.getElementById("menu-status");
  if (!root || !status) return;

  function parseCSV(text) {
    var rows = [], row = [], field = "", quoted = false;
    text = String(text || "").replace(/^\uFEFF/, "");
    for (var i = 0; i < text.length; i++) {
      var ch = text[i], next = text[i + 1];
      if (ch === '"' && quoted && next === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) { row.push(field); field = ""; }
      else if ((ch === "\n" || ch === "\r") && !quoted) {
        if (ch === "\r" && next === "\n") i++;
        row.push(field); field = "";
        if (row.some(function (v) { return v.trim(); })) rows.push(row);
        row = [];
      } else field += ch;
    }
    row.push(field);
    if (row.some(function (v) { return v.trim(); })) rows.push(row);
    if (rows.length < 2) return [];
    var headers = rows.shift().map(function (v) { return v.trim().toLowerCase(); });
    return rows.map(function (values) {
      var item = {};
      headers.forEach(function (key, index) { item[key] = (values[index] || "").trim(); });
      return {
        category: item.category || "Menu",
        name: item.item || item.name || item.dish || "",
        description: item.description || item.details || "",
        price: item.price || "",
        priceNote: item["price note"] || item.note || "",
        available: item.available || "Yes",
        featured: item.featured || "No",
        dietary: item.dietary || "",
        order: Number(item["sort order"] || item.order || 9999)
      };
    }).filter(function (item) {
      return item.name && !/^(no|false|0|out|sold out)$/i.test(item.available);
    });
  }

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, function (ch) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }

  function render(items) {
    var groups = {};
    items.sort(function (a, b) { return a.order - b.order; }).forEach(function (item) {
      (groups[item.category] = groups[item.category] || []).push(item);
    });
    root.innerHTML = Object.keys(groups).map(function (category) {
      return '<section class="menu-col reveal in"><h3>' + esc(category) + '</h3><div class="rows">' +
        groups[category].map(function (item) {
          var tags = item.dietary ? '<span class="menu-dietary">' + esc(item.dietary) + '</span>' : '';
          var featured = /^(yes|true|1)$/i.test(item.featured) ? ' menu-row--featured' : '';
          return '<div class="row menu-row' + featured + '"><div><h4>' + esc(item.name) + '</h4><p>' + esc(item.description) + '</p>' + tags + '</div>' +
            '<span class="price">' + esc(item.price) + (item.priceNote ? '<span class="meta">' + esc(item.priceNote) + '</span>' : '') + '</span></div>';
        }).join('') + '</div></section>';
    }).join('');
    status.textContent = items.length + ' current menu items';
    root.setAttribute('aria-busy', 'false');
  }

  if (!config.csvUrl) {
    status.textContent = 'Menu inventory is not connected.';
    root.setAttribute('aria-busy', 'false');
    return;
  }
  var separator = config.csvUrl.indexOf('?') === -1 ? '?' : '&';
  fetch(config.csvUrl + separator + 'cache=' + Date.now(), { cache: 'no-store' })
    .then(function (response) { if (!response.ok) throw new Error('CSV request failed: ' + response.status); return response.text(); })
    .then(function (text) { var items = parseCSV(text); if (!items.length) throw new Error('No available menu rows found.'); render(items); })
    .catch(function (error) {
      console.error('Menu inventory error:', error);
      status.textContent = 'The live menu could not be loaded. Check the published Menu tab and refresh.';
      root.setAttribute('aria-busy', 'false');
    });
})();

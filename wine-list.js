(function () {
  "use strict";

  var config = window.HARBOR_WINE_CONFIG || {};
  var list = document.getElementById("wine-list");
  if (!list) return;

  var search = document.getElementById("wine-search");
  var type = document.getElementById("wine-type");
  var country = document.getElementById("wine-country");
  var stock = document.getElementById("wine-stock");
  var status = document.getElementById("wine-status");
  var updated = document.getElementById("wine-updated");
  var empty = document.getElementById("wine-empty");
  var reset = document.getElementById("wine-reset");
  var wines = [];

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
        name: item.name || item.wine || item["wine name"] || "",
        producer: item.producer || item.winery || "",
        vintage: item.vintage || item.year || "NV",
        type: item.type || item.style || "",
        country: item.country || "",
        region: item.region || item.appellation || "",
        grape: item.grape || item.varietal || "",
        bottle: item["bottle price"] || item.bottle || item.price || "",
        glass: item["glass price"] || item.glass || "",
        stock: item.stock || item.quantity || item.qty || "",
        featured: item.featured || "",
        notes: item.notes || item.description || item["tasting notes"] || ""
      };
    }).filter(function (wine) { return wine.name || wine.producer; });
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function isAvailable(wine) {
    if (wine.stock === "") return true;
    var amount = Number(wine.stock);
    return Number.isNaN(amount) ? !/^(no|out|sold out|false)$/i.test(wine.stock) : amount > 0;
  }

  function fillSelect(element, values) {
    Array.from(new Set(values.filter(Boolean))).sort().forEach(function (value) {
      var option = document.createElement("option");
      option.value = value; option.textContent = value; element.appendChild(option);
    });
  }

  function render() {
    var query = search.value.toLowerCase();
    var filtered = wines.filter(function (wine) {
      var haystack = [wine.name, wine.producer, wine.grape, wine.region, wine.country, wine.notes].join(" ").toLowerCase();
      return (!query || haystack.indexOf(query) !== -1) &&
        (!type.value || wine.type === type.value) &&
        (!country.value || wine.country === country.value) &&
        (!stock.value || (stock.value === "in-stock" && isAvailable(wine)) || (stock.value === "by-glass" && wine.glass));
    });

    list.innerHTML = filtered.map(function (wine) {
      return '<article class="wine-card">' +
        '<div class="wine-vintage">' + escapeHTML(wine.vintage) + '</div>' +
        '<div><h2>' + escapeHTML(wine.name) + '</h2><p>' + escapeHTML(wine.producer) + '</p>' +
        '<div class="wine-badges">' +
        (wine.type ? '<span class="wine-badge">' + escapeHTML(wine.type) + '</span>' : '') +
        (wine.grape ? '<span class="wine-badge">' + escapeHTML(wine.grape) + '</span>' : '') +
        (!isAvailable(wine) ? '<span class="wine-badge">Out of stock</span>' : '') +
        '</div></div>' +
        '<div class="wine-origin">' + escapeHTML([wine.region, wine.country].filter(Boolean).join(', ')) +
        '<p>' + escapeHTML(wine.notes) + '</p></div>' +
        '<div class="wine-price">' +
        (wine.bottle ? '<b>$' + escapeHTML(wine.bottle) + '</b><span>bottle</span>' : '') +
        (wine.glass ? '<p>$' + escapeHTML(wine.glass) + ' glass</p>' : '') +
        '</div></article>';
    }).join("");

    status.textContent = filtered.length + " of " + wines.length + " wines shown";
    empty.hidden = filtered.length !== 0;
    list.setAttribute("aria-busy", "false");
  }

  function loadInventory(items, message) {
    wines = items;
    type.innerHTML = '<option value="">All types</option>';
    country.innerHTML = '<option value="">All countries</option>';
    fillSelect(type, wines.map(function (wine) { return wine.type; }));
    fillSelect(country, wines.map(function (wine) { return wine.country; }));
    updated.textContent = message;
    render();
  }

  [search, type, country, stock].forEach(function (element) {
    element.addEventListener(element === search ? "input" : "change", render);
  });
  reset.addEventListener("click", function () {
    search.value = type.value = country.value = "";
    stock.value = "in-stock"; render(); search.focus();
  });

  if (!config.csvUrl) {
    status.textContent = "Wine inventory is not connected.";
    updated.textContent = "Add the published Google Sheets CSV URL to wine-config.js.";
    list.setAttribute("aria-busy", "false");
    return;
  }

  var separator = config.csvUrl.indexOf("?") === -1 ? "?" : "&";
  fetch(config.csvUrl + separator + "cache=" + Date.now(), { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("CSV request failed: " + response.status);
      return response.text();
    })
    .then(function (text) {
      var parsed = parseCSV(text);
      if (!parsed.length) throw new Error("The published CSV contains no wine rows.");
      loadInventory(parsed, "Live inventory loaded " + new Date().toLocaleString());
    })
    .catch(function (error) {
      console.error("Wine inventory error:", error);
      status.textContent = "The live wine list could not be loaded.";
      updated.textContent = "Check the published sheet and try refreshing the page.";
      list.setAttribute("aria-busy", "false");
    });
})();

/* Titan Home v0.1 - ES2017, nessuna dipendenza */
(function () {
  'use strict';

  // ---------- util ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function setText(e, t) { if (e.textContent !== t) e.textContent = t; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }

  var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var DAYS_S = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  var MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  function dateStr(d) { return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function timeStr(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // ---------- storage (sempre in try/catch) ----------
  var SKEY = 'titanHome.settings';
  var CITIES = [
    { name: 'Roma', lat: 41.89, lon: 12.48 }, { name: 'Milano', lat: 45.46, lon: 9.19 },
    { name: 'Napoli', lat: 40.85, lon: 14.27 }, { name: 'Torino', lat: 45.07, lon: 7.69 },
    { name: 'Firenze', lat: 43.77, lon: 11.26 }, { name: 'Bologna', lat: 44.49, lon: 11.34 },
    { name: 'Bari', lat: 41.12, lon: 16.87 }, { name: 'Palermo', lat: 38.12, lon: 13.36 },
    { name: 'Genova', lat: 44.41, lon: 8.93 }, { name: 'Venezia', lat: 45.44, lon: 12.32 },
    { name: 'Verona', lat: 45.44, lon: 10.99 }, { name: 'Cagliari', lat: 39.22, lon: 9.12 }
  ];
  var settings = { city: { name: 'Roma', lat: 41.89, lon: 12.48 }, name: '' };

  function loadSettings() {
    try {
      var raw = window.localStorage.getItem(SKEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        if (typeof o.name === 'string') settings.name = o.name.slice(0, 30);
        var c = o.city;
        if (c && typeof c.name === 'string' && typeof c.lat === 'number' && typeof c.lon === 'number' && isFinite(c.lat) && isFinite(c.lon)) {
          settings.city = { name: c.name, lat: c.lat, lon: c.lon };
        }
      }
    } catch (e) { /* storage non disponibile: si usano i default */ }
  }
  function saveSettings() {
    try { window.localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) { /* ignora */ }
  }

  // ---------- icone SVG inline (parse via DOMParser, niente innerHTML) ----------
  var CLOUD = '<path d="M18 48a10 10 0 0 1-1-20 15 15 0 0 1 29-3 11 11 0 0 1 1 23z"/>';
  function cloudG(tr, fill) { return '<g transform="' + tr + '"' + (fill ? ' fill="#000"' : '') + '>' + CLOUD + '</g>'; }
  var SUN = '<circle cx="32" cy="32" r="10"/><path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M49 15l-4 4M19 45l-4 4"/>';
  var MOON = '<path d="M42 10a22 22 0 1 0 12 36A18 18 0 0 1 42 10z"/>';
  var ICONS = {
    sun: SUN,
    moon: MOON,
    cloud: CLOUD,
    partly: '<circle cx="22" cy="22" r="8"/><path d="M22 6v4M6 22h4M10 10l3 3M34 10l-3 3"/>' + cloudG('translate(8 6) scale(.85)', true),
    partlyNight: '<g transform="translate(-6 -6) scale(.6)">' + MOON + '</g>' + cloudG('translate(8 6) scale(.85)', true),
    rain: cloudG('translate(0 -8)', false) + '<path d="M24 50l-3 8M34 50l-3 8M44 50l-3 8"/>',
    snow: cloudG('translate(0 -8)', false) + '<path d="M24 52h.1M34 58h.1M44 52h.1M29 55h.1M39 55h.1"/>',
    storm: cloudG('translate(0 -8)', false) + '<path d="M35 42l-7 9h9l-6 10"/>',
    fog: '<path d="M16 26a12 12 0 0 1 23-4 9 9 0 0 1 9 8"/><path d="M12 36h40M16 44h32M22 52h20"/>',
    clock: '<circle cx="32" cy="32" r="22"/><path d="M32 18v14l9 6"/>',
    calendar: '<rect x="10" y="14" width="44" height="40" rx="6"/><path d="M10 26h44M22 8v10M42 8v10M22 36h4M34 36h4M22 45h4M34 45h4"/>',
    timer: '<circle cx="32" cy="36" r="20"/><path d="M26 8h12M32 8v8M32 36V24M47 17l4-4"/>',
    settings: '<path d="M10 18h26M48 18h6M10 32h8M30 32h24M10 46h30M52 46h2"/><circle cx="42" cy="18" r="5"/><circle cx="24" cy="32" r="5"/><circle cx="46" cy="46" r="5"/>',
    weather: '<circle cx="24" cy="24" r="8"/><path d="M24 8v4M8 24h4M13 13l3 3M35 13l-3 3"/>' + cloudG('translate(8 6) scale(.85)', true)
  };
  var svgCache = {};
  function icon(name) {
    if (!svgCache[name]) {
      var src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
      var doc = new DOMParser().parseFromString(src, 'image/svg+xml');
      svgCache[name] = document.importNode(doc.documentElement, true);
    }
    return svgCache[name].cloneNode(true);
  }
  function putIcon(host, name) { clear(host); host.appendChild(icon(name)); }

  // ---------- meteo: mappa codici WMO ----------
  var WMO = {
    0: ['Soleggiato', 'clear'], 1: ['Prevalentemente sereno', 'clear'], 2: ['Parzialmente nuvoloso', 'partly'], 3: ['Coperto', 'cloud'],
    45: ['Nebbia', 'fog'], 48: ['Nebbia con brina', 'fog'],
    51: ['Pioviggine leggera', 'rain'], 53: ['Pioviggine moderata', 'rain'], 55: ['Pioviggine intensa', 'rain'],
    56: ['Pioviggine gelata leggera', 'rain'], 57: ['Pioviggine gelata intensa', 'rain'],
    61: ['Pioggia debole', 'rain'], 63: ['Pioggia moderata', 'rain'], 65: ['Pioggia forte', 'rain'],
    66: ['Pioggia gelata debole', 'rain'], 67: ['Pioggia gelata forte', 'rain'],
    71: ['Neve debole', 'snow'], 73: ['Neve moderata', 'snow'], 75: ['Neve forte', 'snow'], 77: ['Granelli di neve', 'snow'],
    80: ['Rovesci deboli', 'rain'], 81: ['Rovesci moderati', 'rain'], 82: ['Rovesci violenti', 'rain'],
    85: ['Rovesci di neve deboli', 'snow'], 86: ['Rovesci di neve forti', 'snow'],
    95: ['Temporale', 'storm'], 96: ['Temporale con grandine debole', 'storm'], 99: ['Temporale con grandine forte', 'storm']
  };
  function wmo(code) { return WMO[code] || ['Variabile', 'cloud']; }
  function condText(code, isDay) {
    if (code === 0 && !isDay) return 'Sereno';
    return wmo(code)[0];
  }
  function iconName(code, isDay) {
    var k = wmo(code)[1];
    if (k === 'clear') return isDay ? 'sun' : 'moon';
    if (k === 'partly') return isDay ? 'partly' : 'partlyNight';
    return k;
  }

  // ---------- stato meteo condiviso (unico fetch) ----------
  var REFRESH_MS = 15 * 60 * 1000;
  var RETRY_MS = 60 * 1000;
  var W = { data: null, key: '', at: 0, err: false, nextTry: 0, pending: false, seq: 0 };
  var weatherListeners = [];

  function cityKey() { return settings.city.lat + ',' + settings.city.lon; }
  function notifyWeather() { for (var i = 0; i < weatherListeners.length; i++) { try { weatherListeners[i](); } catch (e) { /* un listener non deve rompere gli altri */ } } }
  function fetchJson(url) {
    var t = new Promise(function (_, reject) { setTimeout(function () { reject(new Error('timeout')); }, 15000); });
    var f = fetch(url).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); });
    return Promise.race([f, t]);
  }
  function getWeather(force) {
    var key = cityKey();
    if (!force && W.key === key && W.data && Date.now() - W.at < REFRESH_MS) return;
    if (W.pending && W.key === key && !force) return;
    var seq = ++W.seq;
    W.pending = true;
    if (W.key !== key) { W.data = null; W.key = key; W.err = false; }
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(settings.city.lat) + '&longitude=' + encodeURIComponent(settings.city.lon) +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day' +
      '&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7';
    notifyWeather();
    fetchJson(url).then(function (d) {
      if (seq !== W.seq) return;
      if (!validWeather(d)) throw new Error('bad data');
      W.data = d; W.at = Date.now(); W.err = false; W.pending = false;
      notifyWeather();
    }).catch(function () {
      if (seq !== W.seq) return;
      W.err = true; W.pending = false; W.nextTry = Date.now() + RETRY_MS;
      notifyWeather();
    });
  }
  function isArr(a) { return Object.prototype.toString.call(a) === '[object Array]'; }
  function validWeather(d) {
    if (!d || !d.current || !d.hourly || !d.daily) return false;
    var h = d.hourly, dl = d.daily;
    if (!isArr(h.time) || !isArr(h.temperature_2m) || !isArr(h.weather_code)) return false;
    if (!isArr(dl.time) || !isArr(dl.weather_code) || !isArr(dl.temperature_2m_max) || !isArr(dl.temperature_2m_min)) return false;
    return typeof d.current.temperature_2m === 'number' && typeof d.current.time === 'string';
  }
  // Giorno/notte nel fuso della localita: confronto fra stringhe ISO "YYYY-MM-DDTHH:MM"
  function nowIso() {
    var off = W.data && typeof W.data.utc_offset_seconds === 'number' ? W.data.utc_offset_seconds : null;
    if (off === null) return null;
    return new Date(Date.now() + off * 1000).toISOString().slice(0, 16);
  }
  function isDayAt(iso) {
    var d = W.data;
    if (iso && d && d.daily && isArr(d.daily.sunrise) && isArr(d.daily.sunset)) {
      var day = String(iso).slice(0, 10);
      for (var i = 0; i < d.daily.time.length; i++) {
        if (d.daily.time[i] === day && d.daily.sunrise[i] && d.daily.sunset[i]) {
          var t = String(iso).slice(0, 16);
          return t >= d.daily.sunrise[i] && t < d.daily.sunset[i];
        }
      }
    }
    if (iso) { var hh = parseInt(String(iso).slice(11, 13), 10); return hh >= 6 && hh < 20; }
    return true;
  }
  function isDayNow() {
    var n = nowIso();
    if (n) return isDayAt(n);
    return W.data && W.data.current ? !!W.data.current.is_day : true;
  }
  function weatherLine() {
    if (W.data && W.data.current) {
      var c = W.data.current;
      return Math.round(c.temperature_2m) + '° · ' + condText(c.weather_code, isDayNow()) + ' · ' + settings.city.name + (W.err ? ' · non aggiornato' : '');
    }
    return W.err ? 'Meteo non disponibile' : 'Caricamento meteo…';
  }

  // ---------- schermate / focus manager ----------
  var current = 'home';
  var focused = null;
  var lastTile = null;
  var clockOpenedAt = 0;
  var lastActivity = Date.now();
  var IDLE_MS = 10 * 60 * 1000;

  function screenEl(name) { return $('scr-' + name); }
  function getFocusables() {
    var nodes = screenEl(current).querySelectorAll('.focusable');
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.disabled) continue;
      var r = n.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) out.push(n);
    }
    return out;
  }
  function isTextInput(e) { return !!e && e.tagName === 'INPUT' && (!e.type || e.type === 'text'); }
  function setFocus(e) {
    if (focused && focused !== e) focused.classList.remove('is-focused');
    focused = e;
    if (!e) return;
    e.classList.add('is-focused');
    if (isTextInput(e)) { try { e.focus({ preventScroll: true }); } catch (x) { /* ignora */ } }
    else if (isTextInput(document.activeElement)) { document.activeElement.blur(); }
    if (current === 'home' && e.classList.contains('tile')) updateHome(e);
  }
  function defaultFocus() {
    var list = getFocusables();
    if (current === 'home' && lastTile) return lastTile;
    var d = screenEl(current).querySelector('.focusable[data-default]');
    if (current === 'settings') { var a = screenEl('settings').querySelector('.city-grid .active'); if (a) return a; }
    return d || list[0] || null;
  }
  function gap(a1, a2, b1, b2) { return Math.max(0, b1 - a2, a1 - b2); }
  function navigate(dir) {
    var list = getFocusables();
    if (!focused || list.indexOf(focused) < 0) { setFocus(defaultFocus()); return; }
    var c = focused.getBoundingClientRect();
    var ccx = c.left + c.width / 2, ccy = c.top + c.height / 2;
    var best = null, bestScore = Infinity;
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (n === focused) continue;
      var r = n.getBoundingClientRect();
      var rcx = r.left + r.width / 2, rcy = r.top + r.height / 2;
      var prim, sec, cd;
      if (dir === 'right') { if (rcx <= ccx + 1) continue; prim = Math.max(0, r.left - c.right) + (rcx - ccx) * 0.2; sec = gap(c.top, c.bottom, r.top, r.bottom); cd = Math.abs(rcy - ccy); }
      else if (dir === 'left') { if (rcx >= ccx - 1) continue; prim = Math.max(0, c.left - r.right) + (ccx - rcx) * 0.2; sec = gap(c.top, c.bottom, r.top, r.bottom); cd = Math.abs(rcy - ccy); }
      else if (dir === 'down') { if (rcy <= ccy + 1) continue; prim = Math.max(0, r.top - c.bottom) + (rcy - ccy) * 0.2; sec = gap(c.left, c.right, r.left, r.right); cd = Math.abs(rcx - ccx); }
      else { if (rcy >= ccy - 1) continue; prim = Math.max(0, c.top - r.bottom) + (ccy - rcy) * 0.2; sec = gap(c.left, c.right, r.left, r.right); cd = Math.abs(rcx - ccx); }
      var score = prim + sec * 3 + cd * 0.5;
      if (score < bestScore) { bestScore = score; best = n; }
    }
    if (best) setFocus(best);
  }

  var clockMoveTimer = null;
  var geoSeq = 0;
  function showScreen(name) {
    if (name === current) return;
    if (current === 'home' && focused && focused.classList.contains('tile')) lastTile = focused;
    screenEl(current).classList.remove('active');
    if (current === 'clock' && clockMoveTimer) { clearInterval(clockMoveTimer); clockMoveTimer = null; }
    current = name;
    screenEl(name).classList.add('active');
    if (name === 'clock') {
      clockOpenedAt = Date.now();
      if (isTextInput(document.activeElement)) document.activeElement.blur();
      $('cBlock').style.transform = 'none';
      clockMoveTimer = setInterval(moveClockBlock, 60000);
      renderClock(true);
      if (focused) focused.classList.remove('is-focused');
      focused = null;
      return;
    }
    try {
      if (name === 'calendar') { calView = new Date(); renderCalendar(); }
      if (name === 'timer') renderTimer(true);
      if (name === 'settings') { markCities(); $('nameInput').value = settings.name; $('setStatus').textContent = ''; $('nameStatus').textContent = ''; geoSeq++; clear($('geoResults')); }
      if (name === 'weather') renderWeather();
    } catch (e) { /* un renderer difettoso non deve bloccare il focus */ }
    setFocus(defaultFocus());
  }
  function goHome() { showScreen('home'); }
  function moveClockBlock() {
    var b = $('cBlock');
    var mx = Math.max(0, (window.innerWidth * 0.9 - b.offsetWidth) / 2);
    var my = Math.max(0, (window.innerHeight * 0.9 - b.offsetHeight) / 2);
    var dx = Math.round((Math.random() * 2 - 1) * mx), dy = Math.round((Math.random() * 2 - 1) * my);
    b.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
  }

  // ---------- HOME ----------
  var TILES = [
    { id: 'weather', name: 'Meteo', c1: '#3a8dff', c2: '#00cfff', glow: '58,141,255', ic: 'weather' },
    { id: 'clock', name: 'Orologio', c1: '#ff9a5a', c2: '#ff4e62', glow: '255,110,90', ic: 'clock' },
    { id: 'calendar', name: 'Calendario', c1: '#ff4d8d', c2: '#c21a4a', glow: '255,77,120', ic: 'calendar' },
    { id: 'timer', name: 'Timer', c1: '#f7c948', c2: '#fb8c4a', glow: '250,170,80', ic: 'timer' },
    { id: 'settings', name: 'Impostazioni', c1: '#95a3b0', c2: '#4a5563', glow: '140,155,170', ic: 'settings' }
  ];
  var tileEls = {};
  var glowIdx = 0, glowId = '';

  function buildDock() {
    var dock = $('dock');
    TILES.forEach(function (t) {
      var b = el('button', 'tile focusable');
      b.style.background = 'linear-gradient(145deg,' + t.c1 + ',' + t.c2 + ')';
      b.setAttribute('data-tile', t.id);
      b.setAttribute('aria-label', t.name);
      b.appendChild(icon(t.ic));
      b.appendChild(el('span', 'tile-name', t.name));
      b.addEventListener('click', function () { lastTile = b; showScreen(t.id); });
      dock.appendChild(b);
      tileEls[t.id] = b;
    });
    lastTile = tileEls.weather;
  }
  function tileById(id) { for (var i = 0; i < TILES.length; i++) if (TILES[i].id === id) return TILES[i]; return TILES[0]; }
  function infoFor(id) {
    if (id === 'weather') return weatherLine();
    if (id === 'clock') return 'Salvaschermo';
    if (id === 'calendar') return dateStr(new Date());
    if (id === 'timer') return timerInfo();
    return settings.city.name;
  }
  function currentTileId() { return focused && current === 'home' && focused.getAttribute('data-tile') || (lastTile && lastTile.getAttribute('data-tile')) || 'weather'; }
  function updateHome(tileEl) {
    var id = tileEl ? tileEl.getAttribute('data-tile') : currentTileId();
    var t = tileById(id);
    setText($('shelfTitle'), t.name);
    setText($('shelfInfo'), infoFor(id));
    if (glowId !== id) {
      glowId = id;
      var next = glowIdx ? $('glowA') : $('glowB');
      var prev = glowIdx ? $('glowB') : $('glowA');
      next.style.background = 'radial-gradient(ellipse at 50% 100%, rgba(' + t.glow + ',.6) 0%, rgba(' + t.glow + ',.22) 40%, rgba(0,0,0,0) 75%)';
      next.classList.add('on');
      prev.classList.remove('on');
      glowIdx = glowIdx ? 0 : 1;
    }
  }
  function updateGreeting() {
    var h = new Date().getHours();
    var g = h >= 5 && h < 12 ? 'Buongiorno' : h >= 12 && h < 18 ? 'Buon pomeriggio' : h >= 18 && h < 23 ? 'Buonasera' : 'Buonanotte';
    setText($('greeting'), settings.name ? g + ', ' + settings.name : g);
  }

  // ---------- METEO panel ----------
  function renderWeather() {
    var d = W.data;
    setText($('wCity'), settings.city.name);
    var status = $('wStatus');
    if (!d) {
      setText($('wTemp'), '--°');
      setText($('wCond'), W.err ? 'Meteo non disponibile' : 'Caricamento…');
      setText($('wFeels'), ''); setText($('wHum'), ''); setText($('wWind'), '');
      setText(status, W.err ? 'Nuovo tentativo tra poco.' : '');
      clear($('wIcon')); clear($('wHours')); clear($('wDays'));
      return;
    }
    var c = d.current;
    var dayNow = isDayNow();
    putIcon($('wIcon'), iconName(c.weather_code, dayNow));
    setText($('wTemp'), Math.round(c.temperature_2m) + '°');
    setText($('wCond'), condText(c.weather_code, dayNow));
    setText($('wFeels'), 'Percepita ' + Math.round(c.apparent_temperature) + '°');
    setText($('wHum'), 'Umidità ' + Math.round(c.relative_humidity_2m) + '%');
    setText($('wWind'), 'Vento ' + Math.round(c.wind_speed_10m) + ' km/h');
    setText(status, W.err ? 'Meteo non disponibile: dati non aggiornati' : '');

    var hours = $('wHours'); clear(hours);
    var times = d.hourly.time || [];
    var nowKey = String(c.time).slice(0, 13) + ':00';
    var start = 0;
    while (start < times.length && times[start] < nowKey) start++;
    if (start >= times.length) start = 0;
    for (var i = start; i < Math.min(times.length, start + 8); i++) {
      var hh = parseInt(String(times[i]).slice(11, 13), 10);
      var cell = el('div', 'hr');
      cell.appendChild(el('div', 'hr-t', i === start ? 'Ora' : pad(hh) + ':00'));
      var ic = el('div', 'hr-i'); putIcon(ic, iconName(d.hourly.weather_code[i], isDayAt(times[i])));
      cell.appendChild(ic);
      cell.appendChild(el('div', 'hr-v', Math.round(d.hourly.temperature_2m[i]) + '°'));
      hours.appendChild(cell);
    }
    var days = $('wDays'); clear(days);
    var dt = d.daily.time || [];
    for (var j = 0; j < dt.length && j < 7; j++) {
      var p = String(dt[j]).split('-');
      var dd = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      var row = el('div', 'day');
      row.appendChild(el('div', 'day-n', j === 0 ? 'Oggi' : DAYS_S[dd.getDay()]));
      var di = el('div', 'day-i'); putIcon(di, iconName(d.daily.weather_code[j], true));
      row.appendChild(di);
      var pp = d.daily.precipitation_probability_max ? d.daily.precipitation_probability_max[j] : null;
      row.appendChild(el('div', 'day-p', pp === null || pp === undefined ? '' : Math.round(pp) + '%'));
      var tt = el('div', 'day-t', Math.round(d.daily.temperature_2m_max[j]) + '°');
      tt.appendChild(el('span', '', Math.round(d.daily.temperature_2m_min[j]) + '°'));
      row.appendChild(tt);
      days.appendChild(row);
    }
  }

  // ---------- OROLOGIO ----------
  var lastClockMin = '';
  function renderClock(force) {
    var now = new Date();
    var ts = timeStr(now);
    if (!force && ts === lastClockMin) return;
    lastClockMin = ts;
    setText($('hClock'), ts);
    setText($('hDate'), dateStr(now));
    setText($('cTime'), ts);
    setText($('cDate'), dateStr(now));
    updateGreeting();
    renderClockWeather();
  }
  function renderClockWeather() {
    var before = $('cText').textContent;
    setText($('cText'), weatherLine());
    if (current === 'clock' && before !== $('cText').textContent) {
      var cb = $('cBlock');
      if (cb.style.transform && cb.style.transform !== 'none') moveClockBlock();
    }
    var host = $('cIcon');
    if (W.data && W.data.current) putIcon(host, iconName(W.data.current.weather_code, isDayNow())); else clear(host);
  }

  // ---------- CALENDARIO ----------
  var calView = new Date();
  var calCells = [];
  function buildCalendar() {
    var head = $('calHead'), grid = $('calGrid');
    ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'].forEach(function (d) { head.appendChild(el('div', '', d)); });
    for (var i = 0; i < 42; i++) { var c = el('div', 'cal-cell'); grid.appendChild(c); calCells.push(c); }
    $('calPrev').addEventListener('click', function () { calView = new Date(calView.getFullYear(), calView.getMonth() - 1, 1); renderCalendar(); });
    $('calNext').addEventListener('click', function () { calView = new Date(calView.getFullYear(), calView.getMonth() + 1, 1); renderCalendar(); });
    $('calToday').addEventListener('click', function () { calView = new Date(); renderCalendar(); });
  }
  function renderCalendar() {
    var y = calView.getFullYear(), m = calView.getMonth();
    setText($('calTitle'), MONTHS[m] + ' ' + y);
    var off = (new Date(y, m, 1).getDay() + 6) % 7;
    var t = new Date();
    for (var i = 0; i < 42; i++) {
      var d = new Date(y, m, 1 - off + i);
      var c = calCells[i];
      c.textContent = String(d.getDate());
      var cls = 'cal-cell';
      if (d.getMonth() !== m) cls += ' other';
      if (d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()) cls += ' today';
      c.className = cls;
    }
  }

  // ---------- TIMER ----------
  var T = { total: 300000, rem: 300000, running: false, endAt: 0, done: false };
  var alarmActive = false;
  var audioCtx = null;
  var lastTimerText = '';

  function timerRemaining() { return T.running ? Math.max(0, T.endAt - Date.now()) : T.rem; }
  function fmtMs(ms) {
    var s = Math.ceil(ms / 1000);
    return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  }
  function timerInfo() {
    if (T.done) return 'Tempo scaduto';
    if (T.running) return fmtMs(timerRemaining()) + ' in corso';
    if (T.rem < T.total) return fmtMs(T.rem) + ' in pausa';
    return 'Pronto';
  }
  function renderTimer(force) {
    var txt = fmtMs(timerRemaining());
    if (force || txt !== lastTimerText) { lastTimerText = txt; setText($('tDisplay'), txt); }
    setText($('tToggle'), T.running ? 'Pausa' : 'Avvia');
    var disp = $('tDisplay');
    disp.className = alarmActive ? 't-display blink' : 't-display';
    var ps = $('tPresets').children;
    for (var i = 0; i < ps.length; i++) {
      ps[i].classList.toggle('active', parseInt(ps[i].getAttribute('data-min'), 10) * 60000 === T.total);
    }
  }
  function ensureAudio() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
    } catch (e) { audioCtx = null; }
  }
  function beep3() {
    try {
      ensureAudio();
      if (!audioCtx) return;
      for (var i = 0; i < 3; i++) {
        var t0 = audioCtx.currentTime + i * 0.6;
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(t0); o.stop(t0 + 0.4);
      }
    } catch (e) { /* audio non disponibile */ }
  }
  function startAlarm() {
    alarmActive = true;
    $('banner').classList.add('show');
    beep3();
    renderTimer(true);
  }
  function dismissAlarm() {
    if (!alarmActive) return;
    alarmActive = false;
    T.done = false; T.rem = T.total;
    $('banner').classList.remove('show');
    renderTimer(true);
  }
  function tickTimer() {
    if (T.running && T.endAt <= Date.now()) {
      T.running = false; T.rem = 0; T.done = true;
      startAlarm();
    }
    if (current === 'timer') renderTimer(false);
    if (current === 'home') updateHome(null);
  }
  function buildTimer() {
    var ps = $('tPresets').children;
    for (var i = 0; i < ps.length; i++) {
      (function (b) {
        b.addEventListener('click', function () {
          T.total = parseInt(b.getAttribute('data-min'), 10) * 60000;
          T.rem = T.total; T.running = false; T.done = false;
          dismissAlarm(); renderTimer(true);
        });
      })(ps[i]);
    }
    $('tToggle').addEventListener('click', function () {
      ensureAudio();
      var wasRunning = T.running;
      tickTimer();
      if (wasRunning && !T.running) { renderTimer(true); return; }
      if (T.running) { T.rem = timerRemaining(); T.running = false; }
      else {
        if (T.done || T.rem <= 0) { T.rem = T.total; T.done = false; }
        T.endAt = Date.now() + T.rem; T.running = true;
      }
      renderTimer(true);
    });
    $('tReset').addEventListener('click', function () {
      T.rem = T.total; T.running = false; T.done = false;
      dismissAlarm(); renderTimer(true);
    });
  }

  // ---------- IMPOSTAZIONI ----------
  function sameCity(c) { return c.name === settings.city.name && c.lat === settings.city.lat && c.lon === settings.city.lon; }
  function markCities() {
    var kids = $('cityGrid').children;
    for (var i = 0; i < kids.length; i++) kids[i].classList.toggle('active', sameCity(CITIES[i]));
  }
  function setCity(c, label) {
    settings.city = { name: c.name, lat: c.lat, lon: c.lon };
    saveSettings();
    markCities();
    setText($('setStatus'), label || '');
    getWeather(true);
    renderWeather(); renderClockWeather();
    if (current === 'home') updateHome(null);
  }
  function buildSettings() {
    var grid = $('cityGrid');
    CITIES.forEach(function (c) {
      var b = el('button', 'btn focusable', c.name);
      b.addEventListener('click', function () { setCity(c, 'Città impostata: ' + c.name); });
      grid.appendChild(b);
    });
    $('nameBtn').addEventListener('click', function () {
      settings.name = $('nameInput').value.replace(/^\s+|\s+$/g, '').slice(0, 30);
      saveSettings();
      updateGreeting();
      setText($('nameStatus'), settings.name ? 'Nome salvato' : 'Nome rimosso');
    });
    $('geoBtn').addEventListener('click', function () {
      var q = $('geoInput').value.replace(/^\s+|\s+$/g, '');
      var res = $('geoResults');
      if (!q) { setText($('setStatus'), 'Scrivi il nome di una città'); return; }
      setText($('setStatus'), 'Ricerca in corso…');
      clear(res);
      var mySeq = ++geoSeq;
      fetchJson('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=it&format=json').then(function (d) {
        if (mySeq !== geoSeq) return;
        var list = d && d.results ? d.results : [];
        if (!list.length) { setText($('setStatus'), 'Nessun risultato'); return; }
        setText($('setStatus'), 'Scegli una città');
        var first = null;
        list.forEach(function (r) {
          if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number') return;
          var label = [r.name, r.admin1, r.country].filter(function (x) { return !!x; }).join(', ');
          var b = el('button', 'btn focusable', label);
          b.addEventListener('click', function () {
            setCity({ name: r.name || q, lat: r.latitude, lon: r.longitude }, 'Città impostata: ' + (r.name || q));
            geoSeq++;
            clear(res);
            setFocus($('geoBtn'));
          });
          res.appendChild(b);
          if (!first) first = b;
        });
        if (first && current === 'settings' && (focused === $('geoBtn') || focused === $('geoInput'))) setFocus(first);
      }).catch(function () { if (mySeq === geoSeq) setText($('setStatus'), 'Ricerca non disponibile, riprova'); });
    });
  }

  // ---------- input ----------
  var BACK_KEYS = ['Escape', 'Backspace', 'GoBack', 'BrowserBack'];
  var BACK_CODES = [8, 27, 461, 10009, 166];
  var debugOn = false;

  function activity() { lastActivity = Date.now(); }
  function arrowDir(k, c) {
    if (k === 'ArrowRight' || c === 39) return 'right';
    if (k === 'ArrowLeft' || c === 37) return 'left';
    if (k === 'ArrowDown' || c === 40) return 'down';
    if (k === 'ArrowUp' || c === 38) return 'up';
    return null;
  }
  function onKey(e) {
    var k = e.key, c = e.keyCode;
    if (debugOn) setText($('debug'), 'key: ' + k + '  keyCode: ' + c);
    activity();
    if (alarmActive) { dismissAlarm(); e.preventDefault(); return; }
    if (current === 'clock') {
      if (!e.repeat && Date.now() - clockOpenedAt > 500) goHome();
      e.preventDefault();
      return;
    }
    var ae = document.activeElement;
    var inInput = isTextInput(ae);
    var isBack = BACK_KEYS.indexOf(k) >= 0 || BACK_CODES.indexOf(c) >= 0;
    if (isBack) {
      if (inInput && (k === 'Backspace' || c === 8)) return; // si cancella il testo
      e.preventDefault();
      if (current !== 'home') goHome();
      return;
    }
    var dir = arrowDir(k, c);
    if (dir) {
      if (inInput && (dir === 'left' || dir === 'right')) {
        var len = ae.value.length;
        if (dir === 'left' && ae.selectionStart > 0) return;
        if (dir === 'right' && ae.selectionEnd < len) return;
      }
      e.preventDefault();
      navigate(dir);
      return;
    }
    if (k === 'Enter' || c === 13) {
      e.preventDefault();
      if (e.repeat) return;
      if (inInput) {
        var sid = ae.getAttribute('data-submit');
        if (sid) $(sid).click();
        return;
      }
      if (!focused || !document.body.contains(focused) || !screenEl(current).contains(focused)) { setFocus(defaultFocus()); return; }
      focused.click();
    }
  }

  // ---------- tick principale ----------
  function tick() {
    renderClock(false);
    tickTimer();
    if (!W.pending) {
      if (W.err ? Date.now() >= W.nextTry : (!W.data || Date.now() - W.at >= REFRESH_MS)) getWeather(true);
    }
    if (current === 'home' && Date.now() - lastActivity > IDLE_MS && !alarmActive) showScreen('clock');
  }

  // ---------- avvio ----------
  function init() {
    try { debugOn = /[?&]debug=1(&|$)/.test(window.location.search); } catch (e) { debugOn = false; }
    if (debugOn) { $('debug').classList.add('on'); setText($('debug'), 'key: -  keyCode: -'); }
    loadSettings();
    buildDock();
    buildCalendar();
    buildTimer();
    buildSettings();
    $('nameInput').value = settings.name;

    $('wRefresh').addEventListener('click', function () { getWeather(true); });
    weatherListeners.push(function () {
      renderWeather();
      renderClockWeather();
      if (current === 'home') updateHome(null);
    });

    document.addEventListener('keydown', onKey, false);
    document.addEventListener('click', function (e) {
      activity();
      if (alarmActive) { dismissAlarm(); e.stopPropagation(); e.preventDefault(); return; }
      if (current === 'clock') { if (Date.now() - clockOpenedAt > 500) goHome(); e.stopPropagation(); e.preventDefault(); return; }
      var t = e.target && e.target.closest ? e.target.closest('.focusable') : null;
      if (t && screenEl(current).contains(t)) setFocus(t);
    }, true);
    document.addEventListener('mousemove', activity, false);

    renderClock(true);
    renderTimer(true);
    renderCalendar();
    setFocus(lastTile);
    getWeather(true);
    setInterval(tick, 500);
  }

  init();
})();

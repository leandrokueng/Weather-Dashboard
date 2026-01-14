const els = {
  form: document.getElementById("searchForm"),
  input: document.getElementById("cityInput"),
  geoBtn: document.getElementById("geoBtn"),
  unitBtn: document.getElementById("unitBtn"),
  themeBtn: document.getElementById("themeBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  status: document.getElementById("status"),

  heroIcon: document.getElementById("heroIcon"),
  heroPlace: document.getElementById("heroPlace"),
  heroTz: document.getElementById("heroTz"),
  heroUpdated: document.getElementById("heroUpdated"),

  favBtn: document.getElementById("favBtn"),
  favList: document.getElementById("favList"),

  insightsList: document.getElementById("insightsList"),

  curTemp: document.getElementById("curTemp"),
  curDesc: document.getElementById("curDesc"),
  curFeels: document.getElementById("curFeels"),
  curWind: document.getElementById("curWind"),
  curRain: document.getElementById("curRain"),

  kpiHum: document.getElementById("kpiHum"),
  kpiPress: document.getElementById("kpiPress"),
  kpiVis: document.getElementById("kpiVis"),
  kpiCloud: document.getElementById("kpiCloud"),
  kpiUv: document.getElementById("kpiUv"),
  kpiCoords: document.getElementById("kpiCoords"),

  dailyBody: document.querySelector("#dailyTable tbody"),

  tempChart: document.getElementById("tempChart"),
  rainChart: document.getElementById("rainChart"),
  windChart: document.getElementById("windChart"),
  humChart: document.getElementById("humChart"),
  pressChart: document.getElementById("pressChart"),
};

let charts = { temp: null, rain: null, wind: null, hum: null, press: null };

const STORE = {
  unit: "wetter.unit",      // "C" | "F"
  favorites: "wetter.favs", // array
  theme: "wetter.theme"     // "dark" | "light"
};

let state = {
  unit: localStorage.getItem(STORE.unit) || "C",
  theme: localStorage.getItem(STORE.theme) || "dark",
  lastPlace: null,
  lastMeteo: null,
};

function setStatus(msg) { els.status.textContent = msg || ""; }
function fmtCoord(n) { return `${n.toFixed(3)}`; }
function fmtDateTime(iso) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString("de-CH");
}
function dayLabel(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("de-CH", { weekday: "short", day: "2-digit", month: "2-digit" });
}
function hourLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleString("de-CH", { weekday: "short", hour: "2-digit" });
}

function cToF(c) { return (c * 9) / 5 + 32; }
function tempDisplay(vC) {
  if (vC == null || Number.isNaN(vC)) return "–";
  const v = state.unit === "F" ? cToF(vC) : vC;
  const u = state.unit === "F" ? "°F" : "°C";
  return `${Math.round(v)}${u}`;
}
function speedDisplay(kmh) { return (kmh == null || Number.isNaN(kmh)) ? "–" : `${Math.round(kmh)} km/h`; }
function mmDisplay(mm) { return (mm == null || Number.isNaN(mm)) ? "–" : `${mm} mm`; }
function pctDisplay(p) { return (p == null || Number.isNaN(p)) ? "–" : `${Math.round(p)}%`; }
function pressDisplay(hPa) { return (hPa == null || Number.isNaN(hPa)) ? "–" : `${Math.round(hPa)} hPa`; }
function visDisplay(m) {
  if (m == null || Number.isNaN(m)) return "–";
  const km = m / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
function uvLabel(uv) {
  if (uv == null || Number.isNaN(uv)) return "–";
  const v = Math.round(uv);
  if (v <= 2) return `${v} (niedrig)`;
  if (v <= 5) return `${v} (mittel)`;
  if (v <= 7) return `${v} (hoch)`;
  if (v <= 10) return `${v} (sehr hoch)`;
  return `${v} (extrem)`;
}

function weatherText(code) {
  const map = new Map([
    [0, "Klar"], [1, "Überwiegend klar"], [2, "Teilweise bewölkt"], [3, "Bewölkt"],
    [45, "Nebel"], [48, "Reif-Nebel"],
    [51, "Niesel (leicht)"], [53, "Niesel (mäßig)"], [55, "Niesel (stark)"],
    [61, "Regen (leicht)"], [63, "Regen (mäßig)"], [65, "Regen (stark)"],
    [71, "Schnee (leicht)"], [73, "Schnee (mäßig)"], [75, "Schnee (stark)"],
    [80, "Schauer (leicht)"], [81, "Schauer (mäßig)"], [82, "Schauer (stark)"],
    [95, "Gewitter"], [96, "Gewitter (Hagel)"], [99, "Gewitter (starker Hagel)"],
  ]);
  return map.get(code) ?? `Wettercode ${code}`;
}
function weatherIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if ([51, 53, 55].includes(code)) return "🌦️";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

function applyTheme() {
  document.body.classList.toggle("light", state.theme === "light");
  els.themeBtn.textContent = state.theme === "light" ? "☀️" : "🌙";
  document.documentElement.style.colorScheme = state.theme === "light" ? "light" : "dark";
}

function setUnit(unit) {
  state.unit = unit;
  localStorage.setItem(STORE.unit, unit);
  els.unitBtn.textContent = unit === "F" ? "°F" : "°C";
  if (state.lastPlace && state.lastMeteo) renderAll(state.lastPlace, state.lastMeteo);
}

function getFavs() {
  try { return JSON.parse(localStorage.getItem(STORE.favorites) || "[]"); }
  catch { return []; }
}
function setFavs(favs) {
  localStorage.setItem(STORE.favorites, JSON.stringify(favs));
  renderFavs();
}
function placeLabel(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}
function renderFavs() {
  const favs = getFavs();
  els.favList.innerHTML = "";

  if (favs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted small";
    empty.textContent = "Noch keine Favoriten. Suche einen Ort und klick ⭐ Zu Favoriten.";
    els.favList.appendChild(empty);
    return;
  }

  favs.forEach((p, idx) => {
    const item = document.createElement("div");
    item.className = "favItem";
    item.title = "Klicken zum Laden";

    const t = document.createElement("div");
    t.textContent = placeLabel(p);

    const x = document.createElement("button");
    x.className = "favItem__x";
    x.type = "button";
    x.title = "Entfernen";
    x.textContent = "✕";

    item.addEventListener("click", () => loadByCoords(p.latitude, p.longitude, p));
    x.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = favs.filter((_, i) => i !== idx);
      setFavs(next);
    });

    item.appendChild(t);
    item.appendChild(x);
    els.favList.appendChild(item);
  });
}

async function geocode(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "de");
  url.searchParams.set("format", "json");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding fehlgeschlagen.");
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error("Kein Ort gefunden.");

  const ch = data.results.find((r) => r.country_code === "CH");
  return ch ?? data.results[0];
}

async function forecast(lat, lon, tz = "auto") {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("timezone", tz);

  url.searchParams.set("current",
    ["temperature_2m","apparent_temperature","precipitation","weather_code","wind_speed_10m"].join(",")
  );

  url.searchParams.set("hourly",
    ["temperature_2m","precipitation","wind_speed_10m","relative_humidity_2m","pressure_msl","cloud_cover","visibility","uv_index"].join(",")
  );

  url.searchParams.set("daily",
    ["temperature_2m_min","temperature_2m_max","precipitation_sum","wind_speed_10m_max","sunrise","sunset","uv_index_max"].join(",")
  );

  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Wetterdaten konnten nicht geladen werden.");
  return await res.json();
}

function pickCurrentHourly(meteo) {
  const t = meteo?.current?.time;
  const h = meteo?.hourly?.time;
  if (!t || !Array.isArray(h)) return 0;

  const idx = h.indexOf(t);
  if (idx !== -1) return idx;

  const ct = new Date(t).getTime();
  let best = 0, bestDiff = Infinity;
  for (let i = 0; i < Math.min(h.length, 96); i++) {
    const diff = Math.abs(new Date(h[i]).getTime() - ct);
    if (diff < bestDiff) { best = i; bestDiff = diff; }
  }
  return best;
}

function renderHero(place, meteo) {
  els.heroPlace.textContent = place?.name ? placeLabel(place) : "Aktueller Standort";
  els.heroTz.textContent = meteo.timezone || "–";
  els.heroUpdated.textContent = meteo.current?.time ? fmtDateTime(meteo.current.time) : "–";
  els.heroIcon.textContent = weatherIcon(meteo.current?.weather_code ?? 2);
}

function renderCurrent(place, meteo) {
  const c = meteo.current;
  if (!c) return;

  els.curTemp.textContent = tempDisplay(c.temperature_2m);
  els.curDesc.textContent = weatherText(c.weather_code);
  els.curFeels.textContent = tempDisplay(c.apparent_temperature);
  els.curWind.textContent = speedDisplay(c.wind_speed_10m);
  els.curRain.textContent = mmDisplay(c.precipitation);

  els.kpiCoords.textContent = `${fmtCoord(place.latitude)} / ${fmtCoord(place.longitude)}`;

  const i = pickCurrentHourly(meteo);
  const h = meteo.hourly;

  els.kpiHum.textContent = pctDisplay(h?.relative_humidity_2m?.[i]);
  els.kpiPress.textContent = pressDisplay(h?.pressure_msl?.[i]);
  els.kpiVis.textContent = visDisplay(h?.visibility?.[i]);
  els.kpiCloud.textContent = pctDisplay(h?.cloud_cover?.[i]);
  els.kpiUv.textContent = uvLabel(h?.uv_index?.[i]);
}

function renderDaily(meteo) {
  const d = meteo.daily;
  if (!d) return;

  els.dailyBody.innerHTML = "";
  for (let i = 0; i < d.time.length; i++) {
    const sunrise = d.sunrise?.[i] ? new Date(d.sunrise[i]).toLocaleTimeString("de-CH", { hour:"2-digit", minute:"2-digit" }) : "–";
    const sunset  = d.sunset?.[i]  ? new Date(d.sunset[i]).toLocaleTimeString("de-CH", { hour:"2-digit", minute:"2-digit" }) : "–";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dayLabel(d.time[i])}</td>
      <td>${tempDisplay(d.temperature_2m_min[i])}</td>
      <td>${tempDisplay(d.temperature_2m_max[i])}</td>
      <td>${mmDisplay(d.precipitation_sum[i])}</td>
      <td>${speedDisplay(d.wind_speed_10m_max[i])}</td>
      <td>${sunrise}</td>
      <td>${sunset}</td>
    `;
    els.dailyBody.appendChild(tr);
  }
}

function destroyChart(k) {
  if (charts[k]) { charts[k].destroy(); charts[k] = null; }
}

function baseChartOptions() {
  const tick = state.theme === "light" ? "rgba(16,20,35,.65)" : "rgba(234,240,255,.65)";
  const grid = state.theme === "light" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.06)";
  const legend = state.theme === "light" ? "rgba(16,20,35,.75)" : "rgba(234,240,255,.82)";
  return {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { labels: { color: legend } } },
    scales: {
      x: { ticks: { color: tick }, grid: { color: grid } },
      y: { ticks: { color: tick }, grid: { color: grid } }
    }
  };
}

function renderTempChart(meteo) {
  const h = meteo.hourly;
  const labels = h.time.slice(0, 48).map(hourLabel);
  const tempC = h.temperature_2m.slice(0, 48);
  const temp = state.unit === "F" ? tempC.map(cToF) : tempC;

  destroyChart("temp");
  charts.temp = new Chart(els.tempChart, {
    type: "line",
    data: { labels, datasets: [{ label: state.unit === "F" ? "Temperatur (°F)" : "Temperatur (°C)", data: temp, tension: .35, borderWidth: 2, pointRadius: 0 }] },
    options: baseChartOptions()
  });
}

function renderRainChart(meteo) {
  const h = meteo.hourly;
  const labels = h.time.slice(0, 48).map(hourLabel);
  const rain = h.precipitation.slice(0, 48);

  destroyChart("rain");
  charts.rain = new Chart(els.rainChart, {
    type: "bar",
    data: { labels, datasets: [{ label: "Niederschlag (mm)", data: rain, borderWidth: 0 }] },
    options: baseChartOptions()
  });
}

function renderWindChart(meteo) {
  const h = meteo.hourly;
  const labels = h.time.slice(0, 48).map(hourLabel);
  const wind = h.wind_speed_10m.slice(0, 48);

  destroyChart("wind");
  charts.wind = new Chart(els.windChart, {
    type: "line",
    data: { labels, datasets: [{ label: "Wind (km/h)", data: wind, tension: .35, borderWidth: 2, pointRadius: 0 }] },
    options: baseChartOptions()
  });
}

function renderHumChart(meteo) {
  const h = meteo.hourly;
  const labels = h.time.slice(0, 48).map(hourLabel);
  const hum = (h.relative_humidity_2m || []).slice(0, 48);

  destroyChart("hum");
  charts.hum = new Chart(els.humChart, {
    type: "line",
    data: { labels, datasets: [{ label: "Luftfeuchte (%)", data: hum, tension: .35, borderWidth: 2, pointRadius: 0 }] },
    options: baseChartOptions()
  });
}

function renderPressChart(meteo) {
  const h = meteo.hourly;
  const labels = h.time.slice(0, 48).map(hourLabel);
  const press = (h.pressure_msl || []).slice(0, 48);

  destroyChart("press");
  charts.press = new Chart(els.pressChart, {
    type: "line",
    data: { labels, datasets: [{ label: "Luftdruck (hPa)", data: press, tension: .35, borderWidth: 2, pointRadius: 0 }] },
    options: baseChartOptions()
  });
}

function renderInsights(meteo) {
  const h = meteo.hourly;
  const d = meteo.daily;
  els.insightsList.innerHTML = "";

  const items = [];

  if (h?.precipitation?.length) {
    const next = h.precipitation.slice(0, 12).map(x => Number(x) || 0);
    const sum = next.reduce((a,b)=>a+b,0);
    const max = Math.max(...next);
    items.push(sum >= 2 || max >= 1
      ? { t:"🌧️ Regen in Sicht", d:`Nächste 12h: ~${sum.toFixed(1)} mm (Peak ${max.toFixed(1)} mm/h).` }
      : { t:"🌤️ Eher trocken", d:"Nächste 12h: wenig Niederschlag erwartet." }
    );
  }

  if (h?.wind_speed_10m?.length) {
    const next = h.wind_speed_10m.slice(0, 24).map(x => Number(x) || 0);
    const wMax = Math.max(...next);
    items.push(wMax >= 35
      ? { t:"💨 Windwarnung", d:`Max. Wind in 24h: ~${Math.round(wMax)} km/h.` }
      : { t:"🍃 Ruhig", d:`Max. Wind in 24h: ~${Math.round(wMax)} km/h.` }
    );
  }

  if (d?.uv_index_max?.length) {
    const uv = Number(d.uv_index_max[0]);
    items.push(uv >= 6
      ? { t:"🧴 UV Hinweis", d:`Heute UV-Max: ${uvLabel(uv)}. Sonnenschutz empfohlen.` }
      : { t:"🕶️ UV ok", d:`Heute UV-Max: ${uvLabel(uv)}.` }
    );
  }

  items.slice(0, 6).forEach(it => {
    const div = document.createElement("div");
    div.className = "insight";
    div.innerHTML = `<div class="insight__t">${it.t}</div><div class="insight__d">${it.d}</div>`;
    els.insightsList.appendChild(div);
  });
}

function renderAll(place, meteo) {
  state.lastPlace = place;
  state.lastMeteo = meteo;

  renderHero(place, meteo);
  renderCurrent(place, meteo);
  renderDaily(meteo);
  renderInsights(meteo);

  renderTempChart(meteo);
  renderRainChart(meteo);
  renderWindChart(meteo);
  renderHumChart(meteo);
  renderPressChart(meteo);
}

async function loadByPlaceName(name) {
  setStatus("Suche Ort …");
  const place = await geocode(name);

  setStatus("Lade Wetterdaten …");
  const meteo = await forecast(place.latitude, place.longitude, "auto");

  renderAll(place, meteo);
  setStatus("");
}

async function loadByCoords(lat, lon, placeOverride = null) {
  setStatus("Lade Wetterdaten …");
  const meteo = await forecast(lat, lon, "auto");

  const place = placeOverride ?? { name:"Aktueller Standort", admin1:"", country:"", latitude: lat, longitude: lon };
  renderAll(place, meteo);
  setStatus("");
}

async function loadByGeolocation() {
  if (!navigator.geolocation) return setStatus("Geolocation nicht unterstützt.");
  setStatus("Hole Standort …");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try { await loadByCoords(pos.coords.latitude, pos.coords.longitude); }
      catch (e) { setStatus(e.message || "Fehler beim Laden."); }
    },
    () => setStatus("Standortzugriff abgelehnt."),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function addCurrentToFavs() {
  const p = state.lastPlace;
  if (!p) return;

  const favs = getFavs();
  const key = `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`;
  const exists = favs.some(f => `${f.latitude.toFixed(4)},${f.longitude.toFixed(4)}` === key);

  if (exists) { setStatus("⭐ Ist schon in Favoriten."); setTimeout(()=>setStatus(""),1200); return; }

  favs.unshift({ name: p.name, admin1: p.admin1, country: p.country, latitude: p.latitude, longitude: p.longitude });
  setFavs(favs.slice(0, 10));

  setStatus("⭐ Favorit gespeichert.");
  setTimeout(()=>setStatus(""),1200);
}


els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = els.input.value.trim();
  if (!q) return;
  try { await loadByPlaceName(q); }
  catch (err) { setStatus(err.message || "Fehler."); }
});

els.geoBtn.addEventListener("click", () => loadByGeolocation());

els.unitBtn.addEventListener("click", () => setUnit(state.unit === "C" ? "F" : "C"));

els.themeBtn.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem(STORE.theme, state.theme);
  applyTheme();
  if (state.lastPlace && state.lastMeteo) renderAll(state.lastPlace, state.lastMeteo);
});

els.refreshBtn.addEventListener("click", async () => {
  try {
    if (state.lastPlace) await loadByCoords(state.lastPlace.latitude, state.lastPlace.longitude, state.lastPlace);
    else await loadByPlaceName("Baden, Aargau, Switzerland");
  } catch (e) { setStatus(e.message || "Fehler."); }
});

els.favBtn.addEventListener("click", () => addCurrentToFavs());


(function init(){
  applyTheme();
  renderFavs();
  setUnit(state.unit);

  loadByPlaceName("Baden, Aargau, Switzerland").catch(err =>
    setStatus(err.message || "Fehler beim Start.")
  );
})();

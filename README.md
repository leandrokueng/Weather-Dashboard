# Weather-Dashboard

Ein modernes, schnelles Wetter-Dashboard im Browser: Ort suchen oder Standort verwenden, aktuelle Werte + 7-Tage-Vorhersage anzeigen und die nächsten 48h als Charts visualisieren. Mit Favoriten, Dark/Light Mode und °C/°F Umschaltung.

> Daten: **Open-Meteo** · Charts: **Chart.js** · Favoriten/Settings: **LocalStorage**

---

## Link zur Web-App

- Den Link zur Web-App finden sie hier: https://weatherdashboardlk.netlify.app/

- Viel spass beim ausprobieren!

- In den untenstehenden Kapitel, sehen sie noch weitere Informationen zum Projekt

## Features

- 🔎 **Ortssuche** (Geocoding) inkl. sinnvollem Default (Baden, Aargau) beim Start
- 📍 **Standort-Wetter** via Browser Geolocation (wenn erlaubt)
- 🌡️ **Aktuelle Werte**: Temperatur, Wetterzustand, gefühlt, Wind, Niederschlag
- 📊 **48h Charts**:
  - Temperatur (Linie)
  - Regen (Balken)
  - Wind (Linie)
  - Luftfeuchte (Linie)
  - Luftdruck (Linie)
- 🗓️ **7-Tage Tabelle**: Min/Max, Regen, Wind, Sunrise/Sunset
- 💡 **Insights** (kurze Hinweise): Regen in Sicht, Windwarnung, UV-Hinweis
- ⭐ **Favoriten** (max. 10) – klicken zum Laden, entfernen mit ✕
- 🎛️ **°C/°F Umschaltung**
- 🌙/☀️ **Dark/Light Theme** (mit `color-scheme` Support)

---

## Tech-Stack

- **HTML / CSS / Vanilla JavaScript**
- **Chart.js** via CDN
- **Open-Meteo**
  - Geocoding API: `https://geocoding-api.open-meteo.com/v1/search`
  - Forecast API: `https://api.open-meteo.com/v1/forecast`

---

## Projektstruktur

```txt
.
├─ index.html     # UI / Layout
├─ styles.css     # Styling (Dark/Light Theme)
└─ app.js         # Logik (API Calls, Rendering, Charts, Favoriten)

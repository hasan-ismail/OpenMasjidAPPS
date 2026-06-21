# Prayer Times Display

A calm, full-screen prayer-times display for the screens in your masjid. Part of the
[OpenMasjidAPPS](../../README.md) catalog for [OpenMasjidOS](https://github.com/hasan-ismail/OpenMasjidOS).

It shows a large live clock, the Hijri and Gregorian dates, the five daily prayers plus
sunrise, and a countdown to the next prayer — with the current prayer gently highlighted.
Prayer times are computed **on the device** from the location and method you choose, so it
keeps working with no internet connection.

## How it's built

- A small static site (`src/`) — vanilla HTML/CSS/ES modules, no framework, no external
  network calls.
- `src/js/prayer.js` is an original, standalone prayer-time calculation engine (sun
  declination + equation of time, then the hour-angle equation per prayer). Hijri dates come
  from the browser's built-in `Intl` Umm al-Qura calendar.
- Served by `nginx`. At container start, `docker-entrypoint.d/40-omos-config.sh` writes the
  masjid's install settings into `config.js`, which the page reads from `window.OMOS_CONFIG`.

## Settings

Collected by OpenMasjidOS at install time and injected as environment variables:

| Setting | Meaning |
|---|---|
| `MASJID_NAME` | Shown in the header. |
| `LATITUDE` / `LONGITUDE` | Location used for the calculation. |
| `CALC_METHOD` | MWL, ISNA, Egypt, Makkah, Karachi, Tehran, Jafari. |
| `ASR_MADHAB` | `Standard` (Shafi'i/Maliki/Hanbali) or `Hanafi`. |
| `TIMEZONE` | IANA zone (e.g. `America/New_York`); blank uses the screen's own zone. |
| `TIME_FORMAT` | `12h` or `24h`. |
| `SCREEN_ORIENTATION` | `landscape` or `portrait`. |
| `LANGUAGE` | `en`, `ar`, or `ur` (date formatting). |

## Local preview

Open `src/index.html` in a browser; it uses the development defaults in `src/config.js`
(fill in a latitude/longitude there to see live times).

## Image

Published by CI to `ghcr.io/hasan-ismail/openmasjid-prayer-times-display` and pinned by tag in
`docker-compose.yml`.

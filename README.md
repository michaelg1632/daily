# Tagwerk

Persönlicher Planer für Projekte, Ziele, Aktivitäten und Daily Tasks.
Dieses Repository enthält nur den Programmcode. Persönliche Daten liegen ausschließlich in Firebase und sind durch Anmeldung und Zugriffsregeln geschützt.

## Änderungen veröffentlichen

    npm install
    python3 src/build.py
    git add -A && git commit -m "Kurze Beschreibung" && git push

GitHub Pages veröffentlicht den Ordner `docs/`. Die installierte App erkennt die neue Version über `docs/version.json` und lädt sich beim nächsten Öffnen selbst neu.
Niemals direkt in `docs/` ändern, immer in `src/`, sonst geht es beim nächsten Bau verloren.

## Aufbau

- `src/data.js`: Vorlagen, Werte-Katalog, Zitate
- `src/core.js`: Datum, Speicher, Berechnungen
- `src/views.js`, `src/sheets.js`, `src/actions.js`: Ansichten, Fenster, Bedienung
- `src/splash.js`: Startbild und Glückwünsche
- `src/platform-web.js`: Anmeldung, Firebase, Update-Prüfung
- `src/config.js`: öffentlicher Firebase-Zugang
- `src/sw.js`: Offline-Betrieb
- `firestore.rules`: Vorlage der Zugriffsregeln

Daten liegen unter `users/{uid}/{sammlung}/{dokument}`.

## Bilder

Neue Zitatbilder einzeln und in voller Größe verwenden, freistellen, auf höchstens 1300 Pixel Kantenlänge bringen und als WebP nach `src/img/` legen. Zu kleine Bilder vorher mit RealESRGAN_x4plus_anime_6B hochrechnen. Danach in `src/data.js` bei `QUOTES`, in `src/splash.js` bei `FX` und in `src/build.py` bei `NAMES` eintragen.

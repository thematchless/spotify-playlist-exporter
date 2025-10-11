# Spotify Playlist Exporter

Exportiere deine Spotify-Playlists als JSON-Dateien zur lokalen Weiterverarbeitung oder Archivierung.

## Features
- Exportiert alle privaten, kollaborativen und gespeicherten Playlists deines Spotify-Accounts
- Speichert jede Playlist als separate JSON-Datei im Verzeichnis `export/`
- Authentifizierung über den offiziellen Spotify PKCE OAuth2-Flow

## Voraussetzungen
- Node.js (empfohlen: >=18)
- Ein Spotify Developer Account und eine registrierte Anwendung ([Spotify Developer Dashboard](https://developer.spotify.com/dashboard))

## Installation
1. Repository klonen oder Quellcode herunterladen
2. Abhängigkeiten installieren:
   ```sh
   npm install
   ```

## Konfiguration
1. Lege im Projektverzeichnis die Umgebungsvariable `SPOTIFY_CLIENT_ID` an. Dies ist die Client-ID deiner Spotify-App.
   - Beispiel (macOS/Linux):
     ```sh
     export SPOTIFY_CLIENT_ID=deine_spotify_client_id
     ```
   - Alternativ kannst du die Variable in einer `.env`-Datei (z.B. mit dem Inhalt `SPOTIFY_CLIENT_ID=deine_spotify_client_id`) oder direkt im Terminal setzen.
2. Stelle sicher, dass im Spotify Developer Dashboard die Redirect-URI `http://127.0.0.1:8888/callback` eingetragen ist.

## Nutzung
Starte den Exportvorgang mit:
```sh
npm start
```

Es öffnet sich ein Browserfenster zur Spotify-Authentifizierung. Nach erfolgreichem Login werden die Playlists exportiert und als einzelne JSON-Dateien im Verzeichnis `export/` gespeichert.

## Hinweise
- Das Verzeichnis `export/` ist in `.gitignore` eingetragen und wird nicht versioniert.
- Jede Playlist wird als eigene Datei im JSON-Format gespeichert.
- Die exportierten Daten enthalten alle Metadaten und Tracklisten der jeweiligen Playlists.

## Lizenz
Sofern nicht anders angegeben, steht dieses Projekt unter einer MIT-ähnlichen Open-Source-Lizenz.

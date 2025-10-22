# Spotify Playlist Exporter

Export your Spotify playlists as JSON files for local processing or archiving.

## Features
- Exports all private, collaborative, and saved playlists from your Spotify account
- Saves each playlist as a separate JSON file in the `export/` directory
- Authentication via official Spotify PKCE OAuth2 flow

## Prerequisites
- Node.js (recommended: LTS 24 or newer)
- A Spotify Developer Account and a registered application ([Spotify Developer Dashboard](https://developer.spotify.com/dashboard))

## Installation
1. Clone the repository or download the source code
2. Install dependencies:
   ```sh
   npm install
   ```

## Configuration
1. Set the environment variable `SPOTIFY_CLIENT_ID` in your project directory. This is the client ID of your Spotify app.
   - Example (macOS/Linux):
     ```sh
     export SPOTIFY_CLIENT_ID=your_spotify_client_id
     ```
   - Alternatively, you can set the variable in a `.env` file or directly in your terminal.
2. Make sure the Redirect URI `http://127.0.0.1:8888/callback` is registered in the Spotify Developer Dashboard.

## Usage
Start the export process with:
```sh
npm start
```

A browser window will open for Spotify authentication. After successful login, your playlists will be exported and saved as individual JSON files in the `export/` directory.

## Notes
- The `export/` directory is listed in `.gitignore` and is not versioned.
- Each playlist is saved as a separate JSON file.
- The exported data includes all metadata (including the [ISRC](https://en.wikipedia.org/wiki/International_Standard_Recording_Code) codes for tracks) and track lists for each playlist.

## License
Unless otherwise stated, this project is released under an MIT-like open source license.

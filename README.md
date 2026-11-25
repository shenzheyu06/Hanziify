# Hanziify

Hanziify is a Spicetify extension in development for converting Traditional Chinese text to Simplified Chinese in Spotify Desktop. It automatically converts song titles and artist names in the bottom now-playing bar, playlist rows, and the right-hand Now Playing sidebar, including updates during track changes, scrolling, and navigation. Album links in playlist rows and lyric lines in the lyrics view and sidebar preview are also converted. Dedicated album pages also support album headings, artist links, and track titles. Full search results support song, artist, album, and playlist names. The typing preview also converts supported result names and creator subtitles. The left Your Library sidebar converts playlist, album, and artist titles in list and grid layouts. Credits and recommendation titles are not covered yet.

## Build locally

With Node.js 24 or newer and npm installed, run:

```powershell
npm ci
npm run typecheck
npm test
npm run build
```

The build creates `dist/hanziify.js`.

## Load in Spotify on Windows

For the installer, install Spotify Desktop from Spotify’s website, sign in, and leave it open for about a minute on a fresh install. Then double-click `HanziifySetup.exe`. Setup uses WinGet to install Spicetify if needed and installs the bundled Hanziify extension. The taskbar watcher is a separate option below.

To build the installer locally on Windows, run `npm ci` and `npm run build:installer`. The executable is written to `dist/HanziifySetup.exe`.

### Manual install

Set up [Spicetify](https://spicetify.app/docs/getting-started) for Spotify Desktop, then run:

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\spicetify\Extensions" | Out-Null
Copy-Item .\dist\hanziify.js "$env:APPDATA\spicetify\Extensions\hanziify.js"
spicetify config extensions hanziify.js
spicetify apply
```

## Optional Windows taskbar preview conversion

The Hanziify extension works without this watcher. To also simplify the artist and track names above Spotify’s Windows taskbar thumbnail, run this separate watcher from the project folder after installing the npm dependencies:

```powershell
npm run watch:taskbar
```

Keep that terminal open while using Spotify. The watcher checks Spotify’s Windows caption about twice a second and writes it back only when OpenCC changes the text. Press **Ctrl+C** to stop. Spotify writes its own caption again on the next title update.

The watcher runs separately from the extension because [Spicetify’s AppTitle API](https://spicetify.app/docs/development/api-wrapper/methods/app-title) controls the default title and its listener misses playback title changes.

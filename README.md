# Hanziify

Hanziify is a Spicetify extension in development for converting Traditional Chinese text to Simplified Chinese in Spotify Desktop. It converts song titles and artist names in the bottom now-playing bar and watches for track changes. Playlist, album, search, and sidebar text are not covered yet.

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

Set up [Spicetify](https://spicetify.app/docs/getting-started) for Spotify Desktop, then run:

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\spicetify\Extensions" | Out-Null
Copy-Item .\dist\hanziify.js "$env:APPDATA\spicetify\Extensions\hanziify.js"
spicetify config extensions hanziify.js
spicetify apply
```

With Spotify DevTools enabled, press `Ctrl+Shift+I` and look for `Hanziify loaded successfully!` in the console.

## Check conversion in Spotify

After each build, copy `dist/hanziify.js` into the Spicetify Extensions folder again and run `spicetify apply`.

1. Play a track whose title or artist contains Traditional Chinese, such as `愛` or `樂`. Check that the bottom now-playing bar displays `爱` or `乐`.
2. Switch to another Traditional Chinese track and check that conversion updates automatically.
3. Try English and already-Simplified titles; they should stay unchanged.
4. Click the title and artist links, navigate between pages, and use playback controls. Confirm that links and playback still work and that DevTools shows no Hanziify errors.

Conversion edits displayed text only, not Spotify metadata. Spotify's internal markup may change between versions; the now-playing selectors may then need updating. OpenCC performs script conversion, not translation or language detection.

# Hanziify

Hanziify is a Spicetify extension in development for converting Traditional Chinese text to Simplified Chinese in Spotify Desktop. It automatically converts song titles and artist names in the bottom now-playing bar, playlist rows, and the right-hand Now Playing sidebar, including updates during track changes, scrolling, and navigation. Album names, search, lyrics, credits, recommendations, and the left library sidebar are not covered yet.

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

## Check Now Playing sidebar conversion

Open the right-hand Now Playing sidebar while a Traditional Chinese track is selected. Its current title and artists should convert automatically (for example, `幻聽` and `許嵩` become `幻听` and `许嵩`). Switch tracks, close and reopen the sidebar, and check again. Title and artist links should still work. Lyrics, credits, and recommendations should remain unchanged.

Sidebar selectors are based on the installed Spotify client: `.main-nowPlayingView-contextItemInfo` contains `.main-trackInfo-name`. Other Spotify layouts may require additional selectors; the DOM tests do not replace checking the live app.

## Check automatic playlist conversion

1. Open a playlist containing Traditional Chinese titles or artists. For example, `愛情轉移` and `陳奕迅` should become `爱情转移` and `陈奕迅` automatically.
2. Scroll down to load more rows, then back up. Newly rendered titles and artists should convert too.
3. Navigate to a different playlist and back. Check conversion after each page loads.
4. Check that title and artist links still work, and album names stay unchanged. English names remain English; this extension does not translate them into Chinese.

For troubleshooting, this manual command remains available in the Spotify DevTools Console:

```js
Hanziify.convertVisiblePlaylist()
```

The command returns the number of matching rows processed, including rows already in Simplified Chinese. A result of `0` means no supported playlist rows were found.

The playlist observer watches for added rows, replaced pages, and changes to existing text or relevant selector attributes. Changes are batched into an animation frame; unchanged text is skipped by the shared conversion cache. Only rows currently in the DOM are processed (Spotify may render some just outside the viewport).

Conversion edits displayed text only, not Spotify metadata. Spotify's internal markup may change between versions; the selectors may then need updating. OpenCC performs script conversion, not translation or language detection.

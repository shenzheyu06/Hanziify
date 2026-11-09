# Hanziify

Hanziify is a Spicetify extension in development for converting Traditional Chinese text to Simplified Chinese in Spotify Desktop. The first milestone is to load the extension and confirm that it runs. The next milestone is to convert song titles and artist names as Spotify displays them.

## Build locally

With Node.js and npm installed, run:

```powershell
npm ci
npm run typecheck
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

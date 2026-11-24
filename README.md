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

Open the right-hand Now Playing sidebar while a Traditional Chinese track is selected. Its current title and artists should convert automatically (for example, `幻聽` and `許嵩` become `幻听` and `许嵩`). Switch tracks, close and reopen the sidebar, and check again. Title and artist links should still work. Credits and recommendations should remain unchanged. Lyrics are converted separately.

Sidebar selectors are based on the installed Spotify client: `.main-nowPlayingView-contextItemInfo` contains `.main-trackInfo-name`. Other Spotify layouts may require additional selectors; the DOM tests do not replace checking the live app.

## Check lyric conversion

Open the lyrics view and the sidebar lyrics preview for a track with Traditional Chinese lyrics. Check that lines convert, including after switching tracks or closing and reopening the view. Verify synchronized highlighting and click-to-seek still work where Spotify supports them. Provider credits and controls should stay unchanged. English text stays English; any Chinese translation text within a lyric line is also simplified.

The lyric selector supports `data-testid="lyrics-line"` and the installed client's generated line class `J4_kkGYm5hjbZlztykxr`. That class may change after a Spotify update; live verification is needed for other client versions. Conversion only processes lyrics Spotify has already displayed.

## Check album-page conversion

Open a Traditional Chinese album. Check its main heading, artist links, and track titles, including after navigating to another album and back or scrolling to load more tracks. Click artist and track links to verify navigation still works. English text stays English; controls, copyright text, and other section headings are unchanged.

Album conversion is scoped to `[data-testid="album-page"]`, using the main `h1`, `/artist/` links, and title cells in track rows. Artist links anywhere within that page are converted; recommendation titles are not. Other Spotify layouts may require selector updates. Verify in the live app after installing the build.

## Check artist-page conversion

Open an artist whose name or Popular tracks contain Traditional Chinese. Check that the artist heading and track titles simplify. Use Show more to reveal additional tracks, then open another artist and check again. The Popular section uses a generated class from the installed Spotify client, so verify it on each client version you use.

In Discography, try the release filters, then open See all and switch between grid and list. Release titles should simplify, including more releases loaded as you scroll. Click a release title to verify navigation. The overview shelf uses generated classes from the installed Spotify client.

Check the playlist card titles and descriptions in the artist’s Featuring section. Both should simplify, including text in any inline description links. Click a title to verify that it still opens the playlist.

In Artist Pick, check the pinned item title and artist comment when present. Click the pick to verify it still opens the item. Some variants use generated CSS classes from the installed client.

In Appears On, check release titles on the artist overview and in See all when Spotify shows that link. Click a title to verify that it opens the release. Both shelf layouts use generated CSS classes from the installed client.

Open About and check the biography in the preview and expanded dialog. Try a biography with Chinese and English text, multiple paragraphs, and an inline link. Verify that the link still works and the dialog can be closed and reopened.

## Check full search-results conversion

Enter a query and open the full results page. Check song titles, artist names, album titles, and playlist titles in the results and their category filters. Change the query, load more results, and navigate away and back. Links should still work; the search input, descriptions, and interface labels should stay unchanged. English names remain English.

Search conversion is scoped to Spotify's `#searchPage` container. It matches song, artist, album, and playlist links, plus unlinked track-row titles in cells containing artist links. This includes album links in song rows as well as title links in cards. For example, `測試專輯` and `測試歌單` should become `测试专辑` and `测试歌单`. As with other areas, different client markup may need selector updates; verify the installed build in Spotify.

## Check search preview conversion

Type a query without pressing Enter. Song, artist, album, and playlist result names in the dropdown should simplify, along with their creator subtitles. Change the query, close and reopen the dropdown, and check newly loaded results. Verify clicking a result and selecting it with the arrow keys and Enter still work. The typed query, query-suggestion text, type labels, and buttons should stay unchanged. This changes display text only, not Spotify's search matching.

The preview uses `#search-dropdown` and entity links. Creator subtitles use the installed client's generated class `kLNNFB6XpG6NJxfzpgre`, which may need updating after a Spotify update. Separate recent-search dropdown layouts are not covered by this selector.

## Check automatic playlist conversion

1. Open a playlist containing Traditional Chinese titles or artists. For example, `愛情轉移` and `陳奕迅` should become `爱情转移` and `陈奕迅` automatically.
2. Scroll down to load more rows, then back up. Newly rendered titles, artists, and album names should convert too.
3. Navigate to a different playlist and back. Check conversion after each page loads.
4. Check that album names also convert (for example, `認了吧` becomes `认了吧`) and that title, artist, and album links still work. English names remain English; this extension does not translate them into Chinese. Rows without an album link are supported, but unlinked album text is not converted.

For troubleshooting, this manual command remains available in the Spotify DevTools Console:

```js
Hanziify.convertVisiblePlaylist()
```

The command returns the number of matching rows processed, including rows already in Simplified Chinese. A result of `0` means no supported playlist rows were found.

The playlist observer watches for added rows, replaced pages, and changes to existing text or relevant selector attributes. Changes are batched into an animation frame; unchanged text is skipped by the shared conversion cache. Only rows currently in the DOM are processed (Spotify may render some just outside the viewport).

Conversion edits displayed text only, not Spotify metadata. Spotify's internal markup may change between versions; the selectors may then need updating. OpenCC performs script conversion, not translation or language detection.

## Check Your Library conversion

In the left Your Library sidebar, check playlist, album, and artist names containing Traditional Chinese. Switch between list and grid layouts, filter or sort the library, and scroll to load more items. Names should simplify while links and selection still work. Creator subtitles, folder names, search input, and interface labels are outside this feature's scope.

Library conversion uses `.main-yourLibraryX-libraryItemContainer`, list-title IDs containing Spotify entity URIs, and grid-title links with `role="gridcell"`. These selectors come from the installed client; other Spotify versions need live verification. This changes displayed names only, not library search matching or saved metadata.

## Search a playlist in either Chinese script

Open a playlist and type `爱情转移` into Spotify’s existing playlist search bar. A track titled `愛情轉移` should appear in the normal results. Searching for `陈奕迅` should also find tracks that credit `陳奕迅` as a lead or featured artist. Try a match farther down a long playlist, then clear the search to restore the full list.

Hanziify adds track title and artist name matches to Spotify’s native search results. This integration uses internal Spicetify playlist APIs and may need a compatibility update after Spotify changes them.

## Future work

- Convert the artist and track title shown above Spotify’s Windows taskbar thumbnail preview. Check whether Spicetify can update that window title.

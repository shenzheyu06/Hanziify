import { createTextConverter } from "./text-conversion.ts";

const PLAYLIST_SELECTOR = '.playlist-playlist-page';
const TITLE_CELL_SELECTOR = '[role="gridcell"][aria-colindex="2"]';

// One pass over the rows currently rendered by Spotify. Reuse this function
// to keep the text cache between manual passes; automatic updates come later.
export function createPlaylistConverter(doc: Document): () => number {
  const convertElementText = createTextConverter(doc);

  return function convertVisiblePlaylist(): number {
    let rowsConverted = 0;
    for (const playlist of doc.querySelectorAll(PLAYLIST_SELECTOR)) {
      for (const row of playlist.querySelectorAll('[role="row"]')) {
        const cell = row.querySelector(TITLE_CELL_SELECTOR);
        if (!cell) continue;

        // Spotify's title component uses this class even without a track link.
        const title = cell.querySelector('div.standalone-ellipsis-one-line');
        if (!title) continue;

        convertElementText(title);
        for (const artist of cell.querySelectorAll('a[href^="/artist/"]')) {
          convertElementText(artist);
        }
        rowsConverted++;
      }
    }
    return rowsConverted;
  };
}

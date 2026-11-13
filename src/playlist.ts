import { createTextConverter } from "./text-conversion.ts";

const PLAYLIST_SELECTOR = '.playlist-playlist-page';
const TITLE_CELL_SELECTOR = '[role="gridcell"][aria-colindex="2"]';

// One pass over the rows currently rendered by Spotify. Reuse this function
// to keep the text cache between passes.
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

export function startPlaylistConversion(
  doc: Document,
  convertVisiblePlaylist = createPlaylistConverter(doc),
): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};
  let frame: number | undefined;

  function affectsPlaylist(record: MutationRecord): boolean {
    const element = record.target.nodeType === win!.Node.ELEMENT_NODE
      ? record.target as Element
      : record.target.parentElement;
    if (element?.closest(PLAYLIST_SELECTOR)) return true;

    // Navigation may mount a whole playlist inside a newly added container.
    return Array.from(record.addedNodes).some((node) => {
      if (node.nodeType !== win!.Node.ELEMENT_NODE) return false;
      const added = node as Element;
      return added.matches(PLAYLIST_SELECTOR) || !!added.querySelector(PLAYLIST_SELECTOR);
    });
  }

  const observer = new win.MutationObserver((records) => {
    if (frame === undefined && records.some(affectsPlaylist)) {
      // Several row changes during scrolling share a single conversion pass.
      frame = win.requestAnimationFrame(() => {
        frame = undefined;
        convertVisiblePlaylist();
      });
    }
  });

  observer.observe(doc.documentElement, {
    childList: true,
    characterData: true,
    subtree: true,
    // Reused elements may acquire their selectors after their text is set.
    attributes: true,
    attributeFilter: ["class", "role", "aria-colindex", "href"],
  });
  convertVisiblePlaylist();

  return () => {
    observer.disconnect();
    if (frame !== undefined) win.cancelAnimationFrame(frame);
  };
}

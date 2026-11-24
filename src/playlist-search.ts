import { Converter } from "opencc-js/t2cn";

interface ContentsOptions {
  filter?: string | { value: string };
  offset?: number;
  limit?: number;
}

interface Row {
  uid: string;
  uri: string;
  name?: string;
  artists?: readonly { name?: string }[];
}
interface Contents { items: (Row | null)[]; totalLength: number; offset: number; limit: number }
interface ListContents { data: Row[]; totalLength: number; offset: number; limit: number }
interface Playlist { contents: Contents; metadata: { totalLength: number } }
interface List { items: ListContents }
interface Platform {
  PlaylistAPI?: {
    getContents(uri: string, options?: ContentsOptions): Promise<Contents>;
    getPlaylist(uri: string, metadata?: unknown, options?: ContentsOptions): Promise<Playlist>;
  };
  ListPlatformAPI?: {
    getList(uri: string, metadata?: unknown, options?: ContentsOptions): Promise<List>;
    getListContents(uri: string, options?: ContentsOptions): Promise<ListContents>;
  };
}

function page<T>(rows: T[], options: ContentsOptions) {
  const offset = options.offset ?? 0;
  const limit = options.limit;
  return { rows: rows.slice(offset, limit === undefined || limit < 0 ? undefined : offset + limit), offset, totalLength: rows.length };
}

export function installPlaylistSearch(platform: Platform): () => void {
  const playlistApi = platform.PlaylistAPI;
  if (!playlistApi || typeof playlistApi.getContents !== "function" || typeof playlistApi.getPlaylist !== "function") return () => {};
  const originalContents = playlistApi.getContents;
  const originalPlaylist = playlistApi.getPlaylist;
  const convert = Converter({ from: "t", to: "cn" });

  function queryFor(uri: string, options?: ContentsOptions): string | undefined {
    const filter = options?.filter;
    const query = (typeof filter === "string" ? filter : filter?.value)?.trim();
    if (!uri.startsWith("spotify:playlist:") || !query || !/\p{Script=Han}/u.test(query)) return;
    // Let Spotify handle Traditional-only searches as it does by default.
    if (convert(query) === query) return query.toLowerCase();
  }

  function trackMatches(item: Row, query: string) {
    if (!item.uri.startsWith("spotify:track:")) return false;
    const matches = (name?: string) => typeof name === "string" && convert(name).toLowerCase().includes(query);
    return matches(item.name) || item.artists?.some(artist => matches(artist.name)) === true;
  }

  async function readAll<T>(
    read: (options: ContentsOptions) => Promise<T>,
    extract: (result: T) => { rows: (Row | null)[]; totalLength: number },
    options: ContentsOptions,
  ) {
    const first = await read({ ...options, offset: 0, limit: 10001 });
    const { rows, totalLength } = extract(first);
    const all = rows.slice();
    while (all.length < totalLength) {
      const next = extract(await read({ ...options, offset: all.length, limit: 500 }));
      if (!next.rows.length || next.totalLength !== totalLength) throw new Error("Playlist changed while searching");
      all.push(...next.rows);
    }
    return { first, all };
  }

  const extractContents = (contents: Contents) => ({ rows: contents.items, totalLength: contents.totalLength });
  const readContents = (uri: string, options: ContentsOptions) =>
    readAll(range => originalContents.call(playlistApi, uri, range), extractContents, options);

  const getContents: typeof originalContents = async function (uri, options) {
    const query = queryFor(uri, options);
    if (!query || !options) return originalContents.call(playlistApi, uri, options);
    try {
      const [native, unfiltered] = await Promise.all([
        readContents(uri, options),
        readContents(uri, { ...options, filter: undefined }),
      ]);
      const nativeIds = new Set(native.all.map(item => item?.uid).filter(Boolean));
      const matches = unfiltered.all.filter(item => item && (nativeIds.delete(item.uid) || trackMatches(item, query)));
      if (nativeIds.size) throw new Error("Native match missing from the full playlist");
      const result = page(matches, options);
      return { ...native.first, items: result.rows, offset: result.offset, limit: result.rows.length, totalLength: result.totalLength };
    } catch {
      return originalContents.call(playlistApi, uri, options);
    }
  };

  const getPlaylist: typeof originalPlaylist = async function (uri, metadata, options) {
    const native = originalPlaylist.call(playlistApi, uri, metadata, options);
    if (!queryFor(uri, options)) return native;
    const [playlist, contents] = await Promise.all([native, getContents(uri, options)]);
    return { ...playlist, contents, metadata: { ...playlist.metadata, totalLength: contents.totalLength } };
  };

  playlistApi.getContents = getContents;
  playlistApi.getPlaylist = getPlaylist;

  // On the newer track list, Spotify fetches rows and track metadata separately.
  // Use native rows and their IDs so Spotify still renders and handles each result.
  const listApi = platform.ListPlatformAPI;
  const originalList = listApi?.getList;
  const originalListContents = listApi?.getListContents;
  let restoreList = () => {};
  if (listApi && typeof originalList === "function" && typeof originalListContents === "function") {
    const extractList = (list: List) => ({ rows: list.items.data, totalLength: list.items.totalLength });
    const getList: typeof originalList = async function (uri, metadata, options) {
      const query = queryFor(uri, options);
      if (!query || !options) return originalList.call(listApi, uri, metadata, options);
      try {
        const read = (range: ContentsOptions) => originalList.call(listApi, uri, metadata, range);
        const unfilteredOptions = { ...options, filter: undefined };
        const [native, unfiltered, tracks] = await Promise.all([
          readAll(read, extractList, options),
          readAll(read, extractList, unfilteredOptions),
          readContents(uri, unfilteredOptions),
        ]);
        const nativeIds = new Set(native.all.map(item => item?.uid).filter(Boolean));
        const matchingTrackIds = new Set<string>();
        for (const track of tracks.all) {
          if (track?.uid && trackMatches(track, query)) matchingTrackIds.add(track.uid);
        }
        const matches = unfiltered.all.filter((item): item is Row =>
          !!item && (nativeIds.delete(item.uid) || matchingTrackIds.has(item.uid)));
        if (nativeIds.size) throw new Error("Native match missing from the full playlist");
        const result = page(matches, options);
        return { ...native.first, items: { ...native.first.items, data: result.rows, offset: result.offset, limit: result.rows.length, totalLength: result.totalLength } };
      } catch {
        return originalList.call(listApi, uri, metadata, options);
      }
    };
    const getListContents: typeof originalListContents = async function (uri, options) {
      if (!queryFor(uri, options)) return originalListContents.call(listApi, uri, options);
      return (await getList(uri, undefined, options)).items;
    };
    listApi.getList = getList;
    listApi.getListContents = getListContents;
    restoreList = () => {
      if (listApi.getList === getList) listApi.getList = originalList;
      if (listApi.getListContents === getListContents) listApi.getListContents = originalListContents;
    };
  }

  return () => {
    restoreList();
    if (playlistApi.getContents === getContents) playlistApi.getContents = originalContents;
    if (playlistApi.getPlaylist === getPlaylist) playlistApi.getPlaylist = originalPlaylist;
  };
}

export function startPlaylistSearch(doc: Document): void {
  const win = doc.defaultView as (Window & { Spicetify?: { Platform?: Platform } }) | null;
  if (!win) return;
  function start(attempt: number) {
    const platform = win?.Spicetify?.Platform;
    if (platform?.PlaylistAPI?.getContents) installPlaylistSearch(platform);
    else if (attempt < 100) win?.setTimeout(() => start(attempt + 1), 100);
  }
  start(0);
}

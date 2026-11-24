import assert from "node:assert/strict";
import { test } from "node:test";
import { installPlaylistSearch } from "../src/playlist-search.ts";

const playlist = "spotify:playlist:one";
const first = { uid: "one", uri: "spotify:track:target", name: "愛情轉移", artists: [{ name: "陳奕迅" }] };
const duplicate = { ...first, uid: "two" };
const native = { uid: "three", uri: "spotify:track:other", name: "Other title" };
const collaboration = {
  uid: "four", uri: "spotify:track:collaboration", name: "Collaboration",
  artists: [{ name: "Lead Artist" }, { name: "張學友" }],
};

function setup() {
  const calls = [];
  const rows = [first, duplicate, native, collaboration];
  function read(options = {}) {
    calls.push(options);
    const all = options.filter ? [native] : rows;
    const offset = options.offset ?? 0;
    // Simulate a service that caps each page, regardless of the requested limit.
    const items = all.slice(offset, offset + Math.min(options.limit ?? 1, 1));
    return { items, offset, limit: items.length, totalLength: all.length };
  }
  function readList(options) {
    const { items, ...range } = read(options);
    return { ...range, data: items.map(({ uid, uri }) => ({ uid, uri })) };
  }
  const platform = {
    PlaylistAPI: {
      async getContents(uri, options) { return read(options); },
      async getPlaylist(uri, metadata, options) {
        const contents = read(options);
        return { contents, metadata: { totalLength: contents.totalLength, owner: "owner" } };
      },
    },
    ListPlatformAPI: {
      async getList(uri, metadata, options) { return { items: readList(options), name: "My playlist" }; },
      async getListContents(uri, options) { return readList(options); },
    },
  };
  return { platform, calls };
}

test("adds matching titles to the native results in playlist order and retains duplicate rows", async t => {
  const { platform, calls } = setup();
  t.after(installPlaylistSearch(platform));
  const options = { filter: "爱情转移", offset: 0, limit: 2, sort: { field: "title" } };
  const result = await platform.PlaylistAPI.getPlaylist(playlist, {}, options);
  assert.deepEqual(result.contents.items, [first, duplicate]);
  assert.deepEqual(result.metadata, { totalLength: 3, owner: "owner" });
  const last = await platform.PlaylistAPI.getContents(playlist, { ...options, offset: 2 });
  assert.deepEqual(last.items, [native]);
  assert.equal(last.totalLength, 3);
  assert.ok(calls.every(call => call.sort === options.sort));
  assert.equal(options.filter, "爱情转移");
});

test("uses Spotify's native list rows and updates the total for later pages", async t => {
  const { platform } = setup();
  t.after(installPlaylistSearch(platform));
  const options = { filter: "爱情转移", offset: 0, limit: 1 };
  const result = await platform.ListPlatformAPI.getList(playlist, {}, options);
  assert.equal(result.name, "My playlist");
  assert.deepEqual(result.items, { data: [{ uid: first.uid, uri: first.uri }], offset: 0, limit: 1, totalLength: 3 });
  const next = await platform.ListPlatformAPI.getListContents(playlist, { ...options, offset: 1 });
  assert.deepEqual(next, { data: [{ uid: duplicate.uid, uri: duplicate.uri }], offset: 1, limit: 1, totalLength: 3 });
});

test("finds tracks by Simplified Chinese names for both lead and featured artists", async t => {
  const { platform } = setup();
  t.after(installPlaylistSearch(platform));
  for (const [filter, expected] of [["陈奕迅", first], ["张学友", collaboration]]) {
    const options = { filter, offset: 0, limit: 10 };
    const legacy = await platform.PlaylistAPI.getContents(playlist, options);
    assert.ok(legacy.items.includes(expected));
    const modern = await platform.ListPlatformAPI.getListContents(playlist, options);
    assert.ok(modern.data.some(row => row.uid === expected.uid));
  }
});

test("passes other queries through and falls back to native search if extra reads fail", async t => {
  const { platform, calls } = setup();
  const original = platform.PlaylistAPI.getContents;
  platform.PlaylistAPI.getContents = async function (uri, options) {
    if (!options.filter && options.limit > 100) throw new Error("Unavailable");
    return original.call(this, uri, options);
  };
  t.after(installPlaylistSearch(platform));
  for (const filter of ["English", "愛情轉移"]) {
    const before = calls.length;
    const options = { filter, offset: 0, limit: 1 };
    await platform.PlaylistAPI.getContents(playlist, options);
    assert.deepEqual(calls.slice(before), [options]);
  }
  const options = { filter: "爱情转移", offset: 0, limit: 1 };
  const contents = await platform.PlaylistAPI.getContents(playlist, options);
  assert.deepEqual(contents.items, [native]);
  assert.equal(contents.totalLength, 1);
});

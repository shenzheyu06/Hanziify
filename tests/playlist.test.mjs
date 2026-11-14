import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createPlaylistConverter, startPlaylistConversion } from "../src/playlist.ts";

// Semantic row/cell markup and the title class used by Spotify's track list.
const row = `
  <div role="row">
    <div role="gridcell" aria-colindex="1">1</div>
    <div role="gridcell" aria-colindex="2">
      <a href="/track/1"><div class="standalone-ellipsis-one-line">愛情轉移</div></a>
      <a href="/artist/1"><span>陳奕迅</span></a>,
      <a href="/artist/2">張學友</a>
      <span class="badge">音樂影片</span>
    </div>
    <div role="gridcell" aria-colindex="3">
      <a href="/album/1"><div class="standalone-ellipsis-one-line">認了吧</div></a>
    </div>
  </div>`;

function setup(t, html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  return { doc, convert: createPlaylistConverter(doc) };
}

const settle = () => new Promise(resolve => setTimeout(resolve, 80));

function startAutomatic(t, html) {
  const context = setup(t, html);
  const stop = startPlaylistConversion(context.doc, context.convert);
  t.after(stop);
  return { ...context, stop };
}

test("automatically converts initial rows and rows added by scrolling", async (t) => {
  const { doc } = startAutomatic(t, `<section class="playlist-playlist-page">${row}</section>`);
  assert.equal(doc.querySelector('a[href^="/track/"]').textContent, "爱情转移");
  doc.querySelector("section").insertAdjacentHTML("beforeend", row);
  await settle();
  assert.deepEqual([...doc.querySelectorAll('a[href^="/track/"]')].map(a => a.textContent), ["爱情转移", "爱情转移"]);
  assert.deepEqual([...doc.querySelectorAll('a[href^="/album/"]')].map(a => a.textContent), ["认了吧", "认了吧"]);
});

test("handles delayed playlist loading and navigation away and back", async (t) => {
  const { doc } = startAutomatic(t, "<main></main>");
  const main = doc.querySelector("main");
  main.innerHTML = `<div><section class="playlist-playlist-page">${row}</section></div>`;
  await settle();
  assert.equal(main.querySelector('a[href^="/artist/"]').textContent, "陈奕迅");
  main.innerHTML = `<section class="album-page">${row}</section>`;
  await settle();
  assert.equal(main.querySelector('a[href^="/track/"]').textContent, "愛情轉移");
  main.innerHTML = `<section class="playlist-playlist-page">${row}</section>`;
  await settle();
  assert.equal(main.querySelector('a[href^="/track/"]').textContent, "爱情转移");
});

test("converts reused text nodes and delayed artist names without an update loop", async (t) => {
  const { doc } = startAutomatic(t, `<section class="playlist-playlist-page">${row}</section>`);
  const title = doc.querySelector('a[href^="/track/"] div');
  const artist = doc.querySelector('a[href^="/artist/"] span');
  title.firstChild.data = "幻聽";
  artist.textContent = "English Artist";
  await settle();
  assert.equal(title.textContent, "幻听");
  assert.equal(artist.textContent, "English Artist");
  artist.textContent = "許嵩";
  await settle();
  assert.equal(artist.textContent, "许嵩");

  let mutations = 0;
  const observer = new doc.defaultView.MutationObserver(records => { mutations += records.length; });
  observer.observe(doc.body, { childList: true, characterData: true, subtree: true });
  t.after(() => observer.disconnect());
  await settle();
  assert.equal(mutations, 0);
});

test("handles selectors assigned after content is rendered", async (t) => {
  const { doc } = startAutomatic(t, `<section>${row}</section>`);
  doc.querySelector("section").className = "playlist-playlist-page";
  await settle();
  assert.equal(doc.querySelector('a[href^="/track/"]').textContent, "爱情转移");
});

test("ignores unrelated changes and cancels pending conversion on cleanup", async (t) => {
  const { doc, convert } = setup(t, `<aside></aside><section class="playlist-playlist-page">${row}</section>`);
  let passes = 0;
  const stop = startPlaylistConversion(doc, () => { passes++; return convert(); });
  t.after(stop);
  await settle();
  const before = passes;
  doc.querySelector("aside").textContent = "音樂";
  await settle();
  assert.equal(passes, before);
  const title = doc.querySelector('a[href^="/track/"] div');
  title.textContent = "幻聽";
  // Deliver the mutation so a frame is pending, then cancel it.
  await Promise.resolve();
  stop();
  await settle();
  assert.equal(title.textContent, "幻聽");
  assert.equal(passes, before);
  title.textContent = "愛我別走";
  await settle();
  assert.equal(title.textContent, "愛我別走");
});

test("converts playlist titles, artists, and albums, preserving links and other content", (t) => {
  const { doc, convert } = setup(t, `<section class="playlist-playlist-page">${row}</section><aside>${row}</aside>`);
  const title = doc.querySelector('a[href="/track/1"]');
  let clicks = 0;
  title.addEventListener("click", (event) => { event.preventDefault(); clicks++; });
  assert.equal(convert(), 1);
  assert.equal(title.textContent, "爱情转移");
  assert.deepEqual([...doc.querySelectorAll('section a[href^="/artist/"]')].map(a => a.textContent), ["陈奕迅", "张学友"]);
  assert.equal(doc.querySelector('section a[href^="/album/"]').textContent, "认了吧");
  assert.equal(doc.querySelector('aside a[href^="/album/"]').textContent, "認了吧");
  assert.equal(doc.querySelector(".badge").textContent, "音樂影片");
  assert.equal(doc.querySelector('aside a[href^="/track/"]').textContent, "愛情轉移");
  assert.equal(doc.querySelector('a[href="/track/1"]'), title);
  title.click();
  assert.equal(clicks, 1);
});

test("converts reused album text and preserves album links in a different column", async (t) => {
  const { doc } = startAutomatic(t, `<section class="playlist-playlist-page">${row.replace('aria-colindex="3"', 'aria-colindex="4"')}</section>`);
  const album = doc.querySelector('a[href^="/album/"]');
  let clicks = 0;
  album.addEventListener("click", event => { event.preventDefault(); clicks++; });
  assert.equal(album.textContent, "认了吧");
  album.firstChild.firstChild.data = "夢遊計";
  await settle();
  assert.equal(album.textContent, "梦游计");
  assert.equal(doc.querySelector('a[href^="/album/"]'), album);
  assert.equal(album.getAttribute("href"), "/album/1");
  album.click();
  assert.equal(clicks, 1);
  album.textContent = "English Album";
  await settle();
  assert.equal(album.textContent, "English Album");
  album.textContent = "音乐";
  await settle();
  assert.equal(album.textContent, "音乐");
});

test("handles unlinked titles, headers, English text, and repeated manual passes", (t) => {
  const { doc, convert } = setup(t, `<section class="playlist-playlist-page">
    <div role="row"><div role="columnheader">標題</div></div>
    <div role="row"><div role="gridcell" aria-colindex="2">
      <div class="standalone-ellipsis-one-line">幻聽</div>
      <a href="/artist/1">English Artist</a>
    </div></div></section>`);
  const observer = new doc.defaultView.MutationObserver(() => {});
  observer.observe(doc.body, { childList: true, characterData: true, subtree: true });
  t.after(() => observer.disconnect());
  assert.equal(convert(), 1);
  assert.equal(doc.querySelector('.standalone-ellipsis-one-line').textContent, "幻听");
  assert.equal(doc.querySelector("a").textContent, "English Artist");
  assert.equal(doc.querySelector('[role="columnheader"]').textContent, "標題");
  observer.takeRecords();
  convert();
  assert.equal(observer.takeRecords().length, 0);
});

test("waits for a manual call and only processes rows present at that time", (t) => {
  const { doc, convert } = setup(t, '<section class="playlist-playlist-page"></section>');
  assert.equal(convert(), 0);
  doc.querySelector("section").innerHTML = row;
  assert.equal(doc.querySelector('a[href^="/track/"]').textContent, "愛情轉移");
  assert.equal(convert(), 1);
  assert.equal(doc.querySelector('a[href^="/track/"]').textContent, "爱情转移");
});

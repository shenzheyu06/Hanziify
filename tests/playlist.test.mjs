import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createPlaylistConverter } from "../src/playlist.ts";

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
  const dom = new JSDOM(html);
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  return { doc, convert: createPlaylistConverter(doc) };
}

test("converts playlist titles and all artists, preserving links and other content", (t) => {
  const { doc, convert } = setup(t, `<section class="playlist-playlist-page">${row}</section><aside>${row}</aside>`);
  const title = doc.querySelector('a[href="/track/1"]');
  let clicks = 0;
  title.addEventListener("click", (event) => { event.preventDefault(); clicks++; });
  assert.equal(convert(), 1);
  assert.equal(title.textContent, "爱情转移");
  assert.deepEqual([...doc.querySelectorAll('section a[href^="/artist/"]')].map(a => a.textContent), ["陈奕迅", "张学友"]);
  assert.equal(doc.querySelector('section a[href^="/album/"]').textContent, "認了吧");
  assert.equal(doc.querySelector(".badge").textContent, "音樂影片");
  assert.equal(doc.querySelector('aside a[href^="/track/"]').textContent, "愛情轉移");
  assert.equal(doc.querySelector('a[href="/track/1"]'), title);
  title.click();
  assert.equal(clicks, 1);
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

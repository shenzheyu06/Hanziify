import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startNowPlayingConversion } from "../src/now-playing.ts";

const bar = (title = "愛與夢", artist = "張學友") => `
  <footer data-testid="now-playing-bar">
    <div data-testid="context-item-info-title"><a href="/track/1"><span>${title}</span></a></div>
    <a data-testid="context-item-info-artist" href="/artist/1">${artist}</a>
  </footer>`;

function setup(t, html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const stop = startNowPlayingConversion(dom.window.document);
  t.after(() => { stop(); dom.window.close(); });
  return dom.window.document;
}

// Allow MutationObserver delivery and the scheduled animation frame to finish.
const settle = () => new Promise((resolve) => setTimeout(resolve, 80));

test("converts playback links without title or artist test IDs", async (t) => {
  // This Spotify layout uses an album link for the currently playing title.
  const doc = setup(t, `
    <main><a href="/album/other">愛情轉移</a></main>
    <footer data-testid="now-playing-bar">
      <a draggable="true" href="/album/2CKvwKuHcZvnt4mC9DB6Fk"><span data-encore-id="text" dir="auto">愛情轉移</span></a>
      <a draggable="true" href="/artist/2QcZxAgcs2I1q7CtCkl6MI"><span dir="auto">Eason Chan</span></a>
      <a href="/queue">播放佇列</a>
    </footer>`);
  const title = doc.querySelector('footer a[href^="/album/"]');
  const artist = doc.querySelector('footer a[href^="/artist/"]');
  assert.equal(title.textContent, "爱情转移");
  assert.equal(title.getAttribute("href"), "/album/2CKvwKuHcZvnt4mC9DB6Fk");
  assert.equal(artist.textContent, "Eason Chan");
  assert.equal(doc.querySelector("main a").textContent, "愛情轉移");
  assert.equal(doc.querySelector('a[href="/queue"]').textContent, "播放佇列");

  title.firstChild.firstChild.data = "愛我別走";
  artist.firstChild.firstChild.data = "張學友";
  await settle();
  assert.equal(title.textContent, "爱我别走");
  assert.equal(artist.textContent, "张学友");
});

test("converts title and artist while preserving links and unrelated content", (t) => {
  const doc = setup(t, `<main>愛與夢</main>${bar()}`);
  assert.equal(doc.querySelector("span").textContent, "爱与梦");
  const artist = doc.querySelector('[data-testid="context-item-info-artist"]');
  assert.equal(artist.textContent, "张学友");
  assert.equal(artist.getAttribute("href"), "/artist/1");
  assert.equal(doc.querySelector("main").textContent, "愛與夢");
});

test("converts track updates and keeps existing elements and handlers", async (t) => {
  const doc = setup(t, bar());
  const link = doc.querySelector('a[href="/track/1"]');
  const span = link.firstElementChild;
  let clicks = 0;
  link.addEventListener("click", (event) => { event.preventDefault(); clicks++; });
  span.firstChild.data = "音樂";
  await settle();
  assert.equal(span.textContent, "音乐");
  assert.equal(doc.querySelector('a[href="/track/1"]'), link);
  link.click();
  assert.equal(clicks, 1);
  // Replacing children is another way Spotify can render the next track.
  span.textContent = "夢想";
  await settle();
  assert.equal(span.textContent, "梦想");
});

test("handles a late-mounted bar and a replacement bar", async (t) => {
  const doc = setup(t, "<main></main>");
  doc.body.insertAdjacentHTML("beforeend", bar());
  await settle();
  assert.equal(doc.querySelector("span").textContent, "爱与梦");
  doc.querySelector("footer").outerHTML = bar("音樂");
  await settle();
  assert.equal(doc.querySelector("span").textContent, "音乐");
});

test("leaves English and Simplified text unchanged and settles without a mutation loop", async (t) => {
  const doc = setup(t, bar("Hello 世界", "音乐"));
  let mutations = 0;
  const observer = new doc.defaultView.MutationObserver((records) => { mutations += records.length; });
  observer.observe(doc.body, { subtree: true, characterData: true, childList: true });
  t.after(() => observer.disconnect());
  await settle();
  assert.equal(doc.querySelector("span").textContent, "Hello 世界");
  assert.equal(mutations, 0);
  doc.querySelector("span").firstChild.data = "愛";
  await settle();
  assert.equal(doc.querySelector("span").textContent, "爱");
  const count = mutations;
  await settle();
  assert.equal(mutations, count);
});

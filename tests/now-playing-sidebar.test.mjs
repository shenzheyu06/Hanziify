import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startNowPlayingSidebarConversion } from "../src/now-playing-sidebar.ts";

// Structure from the installed Spotify sidebar's ContextItemInfo component.
const info = `
  <div class="main-nowPlayingView-contextItemInfo">
    <div class="main-trackInfo-name">
      <a href="/track/1"><span dir="auto">愛情轉移</span></a>
      <div class="main-trackInfo-artists">
        <a href="/artist/1">陳奕迅</a>, <a href="/artist/2">張學友</a>
      </div>
    </div>
    <div class="main-nowPlayingWidget-plusButtonWrapper"><button>加入歌單</button></div>
  </div>`;

const settle = () => new Promise(resolve => setTimeout(resolve, 80));

function setup(t, html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startNowPlayingSidebarConversion(doc);
  t.after(() => { stop(); dom.window.close(); });
  return { doc, stop };
}

test("converts current sidebar title and artists without changing other sections", (t) => {
  const { doc } = setup(t, `<aside>${info}
    <section class="lyrics">愛與夢</section>
    <section class="credits"><a href="/artist/3">許嵩</a></section>
    <section class="recommendations"><a href="/track/2">愛我別走</a></section>
    </aside><main><div class="main-trackInfo-name">夢想</div></main>`);
  const title = doc.querySelector('a[href="/track/1"]');
  assert.equal(title.textContent, "爱情转移");
  assert.equal(title.getAttribute("href"), "/track/1");
  assert.deepEqual([...doc.querySelectorAll('.main-trackInfo-artists a')].map(a => a.textContent), ["陈奕迅", "张学友"]);
  assert.equal(doc.querySelector("button").textContent, "加入歌單");
  assert.equal(doc.querySelector(".lyrics").textContent, "愛與夢");
  assert.equal(doc.querySelector(".credits").textContent, "許嵩");
  assert.equal(doc.querySelector(".recommendations").textContent, "愛我別走");
  assert.equal(doc.querySelector("main").textContent, "夢想");
});

test("converts the sidebar when opened, reopened, and its content replaced", async (t) => {
  const { doc } = setup(t, "<aside></aside>");
  const sidebar = doc.querySelector("aside");
  sidebar.innerHTML = `<div>${info}</div>`;
  await settle();
  assert.equal(sidebar.querySelector('a[href^="/track/"]').textContent, "爱情转移");
  sidebar.innerHTML = "";
  await settle();
  sidebar.innerHTML = info.replace("愛情轉移", "幻聽");
  await settle();
  assert.equal(sidebar.querySelector('a[href^="/track/"]').textContent, "幻听");
});

test("handles track changes and delayed artists while preserving existing links", async (t) => {
  const { doc } = setup(t, info);
  const title = doc.querySelector('a[href^="/track/"]');
  let clicks = 0;
  title.addEventListener("click", e => { e.preventDefault(); clicks++; });
  title.firstChild.firstChild.data = "夢想";
  const artist = doc.querySelector('a[href^="/artist/"]');
  artist.textContent = "English Artist";
  await settle();
  assert.equal(title.textContent, "梦想");
  assert.equal(artist.textContent, "English Artist");
  artist.textContent = "許嵩";
  await settle();
  assert.equal(artist.textContent, "许嵩");
  assert.equal(doc.querySelector('a[href^="/track/"]'), title);
  title.click();
  assert.equal(clicks, 1);
});

test("supports unlinked names, skips unchanged text, and stops on cleanup", async (t) => {
  const { doc, stop } = setup(t, `<div class="main-nowPlayingView-contextItemInfo">
    <div class="main-trackInfo-name"><span>幻聽</span><div class="main-trackInfo-artists">許嵩</div></div></div>`);
  assert.equal(doc.querySelector("span").textContent, "幻听");
  assert.equal(doc.querySelector(".main-trackInfo-artists").textContent, "许嵩");
  let mutations = 0;
  const observer = new doc.defaultView.MutationObserver(records => { mutations += records.length; });
  observer.observe(doc.body, { childList: true, characterData: true, subtree: true });
  t.after(() => observer.disconnect());
  await settle();
  assert.equal(mutations, 0);
  doc.querySelector("span").textContent = "愛";
  await Promise.resolve();
  stop();
  await settle();
  assert.equal(doc.querySelector("span").textContent, "愛");
});

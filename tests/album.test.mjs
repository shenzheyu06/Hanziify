import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startAlbumConversion } from "../src/album.ts";

const page = `<section data-testid="album-page">
  <h1><span>測試專輯</span></h1><a href="/artist/1">測試歌手</a>
  <div role="row"><div role="gridcell" aria-colindex="2">
    <a href="/track/1"><div class="standalone-ellipsis-one-line">測試歌曲</div></a>
    <a href="/artist/2">另一位歌手</a><span>音樂影片</span>
  </div><div role="gridcell" aria-colindex="3">3:00</div></div>
  <p>版權聲明</p><button>儲存專輯</button><h2>更多專輯</h2>
</section>`;
const settle = () => new Promise(resolve => setTimeout(resolve, 80));
function setup(t, html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startAlbumConversion(doc);
  t.after(() => { stop(); dom.window.close(); });
  return { doc, stop };
}

test("converts album heading, artists and tracks while preserving other content", (t) => {
  const { doc } = setup(t, `${page}<aside><h1>外部標題</h1><a href="/artist/3">外部藝術家</a></aside>`);
  assert.equal(doc.querySelector('h1').textContent, "测试专辑");
  assert.equal(doc.querySelector('a[href="/artist/1"]').textContent, "测试歌手");
  assert.equal(doc.querySelector('a[href="/track/1"]').textContent, "测试歌曲");
  assert.equal(doc.querySelector('p').textContent, "版權聲明");
  assert.equal(doc.querySelector('button').textContent, "儲存專輯");
  assert.equal(doc.querySelector('h2').textContent, "更多專輯");
  assert.equal(doc.querySelector('aside h1').textContent, "外部標題");
  assert.equal(doc.querySelector('aside a').textContent, "外部藝術家");
});

test("handles late loading, navigation and appended track rows", async (t) => {
  const { doc } = setup(t, '<main></main>');
  const main = doc.querySelector('main');
  main.innerHTML = `<div>${page}</div>`;
  await settle();
  assert.equal(main.querySelector('h1').textContent, "测试专辑");
  main.querySelector('section').insertAdjacentHTML('beforeend', '<div role="row"><div role="gridcell" aria-colindex="2"><div class="standalone-ellipsis-one-line">新載入歌曲</div></div></div>');
  await settle();
  assert.equal(main.querySelector('section').lastChild.textContent, "新载入歌曲");
  main.innerHTML = '<section><h1>其他頁面</h1></section>';
  await settle();
  assert.equal(main.querySelector('h1').textContent, "其他頁面");
  main.innerHTML = page;
  await settle();
  assert.equal(main.querySelector('h1').textContent, "测试专辑");
});

test("handles metadata updates and preserves links, then stops on cleanup", async (t) => {
  const { doc, stop } = setup(t, page);
  const link = doc.querySelector('a[href="/track/1"]');
  let clicks = 0;
  link.addEventListener('click', event => { event.preventDefault(); clicks++; });
  link.firstChild.firstChild.data = "新測試";
  const artist = doc.querySelector('a[href="/artist/1"]');
  artist.textContent = "English Artist";
  await settle();
  assert.equal(link.textContent, "新测试");
  assert.equal(artist.textContent, "English Artist");
  artist.textContent = "繁體歌手";
  await settle();
  assert.equal(artist.textContent, "繁体歌手");
  assert.equal(doc.querySelector('a[href="/track/1"]'), link);
  link.click();
  assert.equal(clicks, 1);
  let changes = 0;
  const observer = new doc.defaultView.MutationObserver(records => { changes += records.length; });
  observer.observe(doc.body, { childList: true, characterData: true, subtree: true });
  t.after(() => observer.disconnect());
  await settle();
  assert.equal(changes, 0);
  artist.textContent = "停止轉換";
  await Promise.resolve();
  stop();
  await settle();
  assert.equal(artist.textContent, "停止轉換");
});

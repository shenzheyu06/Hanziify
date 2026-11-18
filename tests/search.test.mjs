import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startSearchConversion } from "../src/search.ts";

const results = `<div id="searchPage">
  <section data-testid="search-tracks-result"><div role="row">
    <div role="gridcell" aria-colindex="1">
      <div class="standalone-ellipsis-one-line">測試歌曲</div>
      <a href="/artist/1">測試歌手</a><span>音樂影片</span>
    </div>
    <div role="gridcell" aria-colindex="2"><a href="/album/1"><div class="standalone-ellipsis-one-line">測試專輯</div></a></div>
  </div></section>
  <div data-testid="top-result-card"><a href="/track/1"><span>另一首測試</span></a></div>
  <a href="/artist/2">另一位藝術家</a>
  <a href="/playlist/1">測試歌單</a><h2>搜尋結果</h2>
</div>`;
const settle = () => new Promise(resolve => setTimeout(resolve, 80));
function setup(t, html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startSearchConversion(doc);
  t.after(() => { stop(); dom.window.close(); });
  return { doc, stop };
}

test("converts full search songs and artists but excludes preview and other titles", (t) => {
  const { doc } = setup(t, `${results}<div role="listbox"><a href="/track/2">預覽歌曲</a><a href="/artist/3">預覽藝術家</a></div><input value="原始搜尋">`);
  assert.equal(doc.querySelector('[role="gridcell"] > div').textContent, "测试歌曲");
  assert.equal(doc.querySelector('a[href="/artist/1"]').textContent, "测试歌手");
  assert.equal(doc.querySelector('a[href="/artist/2"]').textContent, "另一位艺术家");
  assert.equal(doc.querySelector('a[href="/track/1"]').textContent, "另一首测试");
  assert.equal(doc.querySelector('a[href="/album/1"]').textContent, "測試專輯");
  assert.equal(doc.querySelector('a[href="/playlist/1"]').textContent, "測試歌單");
  assert.equal(doc.querySelector('h2').textContent, "搜尋結果");
  assert.equal(doc.querySelector('[role="listbox"]').textContent, "預覽歌曲預覽藝術家");
  assert.equal(doc.querySelector('input').value, "原始搜尋");
});

test("handles late results, changed queries, more rows, and returning to search", async (t) => {
  const { doc } = setup(t, '<main></main>');
  const main = doc.querySelector('main');
  main.innerHTML = results;
  await settle();
  const title = main.querySelector('[role="gridcell"] > div');
  assert.equal(title.textContent, "测试歌曲");
  title.firstChild.data = "新的搜尋";
  main.querySelector('#searchPage').insertAdjacentHTML('beforeend', '<a href="/track/4">新增結果</a>');
  await settle();
  assert.equal(title.textContent, "新的搜寻");
  assert.equal(main.querySelector('a[href="/track/4"]').textContent, "新增结果");
  main.innerHTML = '<section><a href="/track/5">其他頁面</a></section>';
  await settle();
  assert.equal(main.textContent, "其他頁面");
  main.innerHTML = results;
  await settle();
  assert.equal(main.querySelector('[role="gridcell"] > div').textContent, "测试歌曲");
});

test("preserves links and English text, and cancels updates on cleanup", async (t) => {
  const { doc, stop } = setup(t, results);
  const link = doc.querySelector('a[href="/track/1"]');
  let clicks = 0;
  link.addEventListener('click', e => { e.preventDefault(); clicks++; });
  link.firstChild.textContent = "English Song";
  await settle();
  assert.equal(link.textContent, "English Song");
  assert.equal(doc.querySelector('a[href="/track/1"]'), link);
  link.click();
  assert.equal(clicks, 1);
  link.firstChild.textContent = "停止轉換";
  await Promise.resolve();
  stop();
  await settle();
  assert.equal(link.textContent, "停止轉換");
});

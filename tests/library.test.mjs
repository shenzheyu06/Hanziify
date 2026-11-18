import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startLibraryConversion } from "../src/library.ts";

const settle = () => new Promise(resolve => setTimeout(resolve, 80));
const listTitles = ['playlist', 'album', 'artist'].map(type =>
  `<span id="listrow-title-spotify:${type}:1"><span>測試名稱</span></span>`).join('');
const gridTitles = ['playlist', 'album', 'artist'].map(type =>
  `<a role="gridcell" href="/${type}/1"><span>測試名稱</span></a>`).join('');
function setup(t, html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startLibraryConversion(doc);
  t.after(() => { stop(); dom.window.close(); });
  return { doc, stop };
}

test("converts library list and grid titles without changing subtitles or controls", t => {
  const { doc } = setup(t, `<aside>
    <h2>音樂庫</h2><input value="搜尋內容">
    <div class="main-yourLibraryX-libraryItemContainer">${listTitles}${gridTitles}
      <span id="listrow-subtitle-spotify:album:1">專輯・創作者</span>
      <span id="listrow-title-spotify:folder:1">資料夾</span>
      <button>儲存</button>
    </div></aside><a role="gridcell" href="/album/2">外部專輯</a>`);
  assert.deepEqual([...doc.querySelectorAll('[id^="listrow-title-"] > span, .main-yourLibraryX-libraryItemContainer a')]
    .map(e => e.textContent), Array(6).fill('测试名称'));
  assert.equal(doc.querySelector('[id^="listrow-subtitle-"]').textContent, '專輯・創作者');
  assert.equal(doc.getElementById('listrow-title-spotify:folder:1').textContent, '資料夾');
  assert.equal(doc.querySelector('h2').textContent, '音樂庫');
  assert.equal(doc.querySelector('input').value, '搜尋內容');
  assert.equal(doc.querySelector('button').textContent, '儲存');
  assert.equal(doc.querySelector('a[href="/album/2"]').textContent, '外部專輯');
});

test("handles late library loading, scrolling, reused rows, and layout replacement", async t => {
  const { doc } = setup(t, '<aside></aside>');
  const aside = doc.querySelector('aside');
  aside.innerHTML = `<div class="main-yourLibraryX-libraryItemContainer">${listTitles}</div>`;
  await settle();
  const root = aside.firstChild;
  const title = root.querySelector('span > span');
  assert.equal(title.textContent, '测试名称');
  title.firstChild.data = '新的專輯';
  root.insertAdjacentHTML('beforeend', '<span id="listrow-title-spotify:playlist:2">新增歌單</span>');
  await settle();
  assert.equal(title.textContent, '新的专辑');
  assert.equal(root.lastChild.textContent, '新增歌单');
  root.innerHTML = gridTitles;
  await settle();
  assert.equal(root.querySelector('a').textContent, '测试名称');
  root.innerHTML = '<span id="pending">載入名稱</span>';
  await settle();
  root.firstChild.id = 'listrow-title-spotify:artist:2';
  await settle();
  assert.equal(root.firstChild.textContent, '载入名称');
});

test("preserves title elements and handlers and stops converting after cleanup", async t => {
  const { doc, stop } = setup(t, `<div class="main-yourLibraryX-libraryItemContainer">${gridTitles}</div>`);
  const link = doc.querySelector('a');
  const span = link.firstChild;
  let clicks = 0;
  link.addEventListener('click', e => { e.preventDefault(); clicks++; });
  span.firstChild.data = '傳統音樂';
  await settle();
  assert.equal(link.textContent, '传统音乐');
  assert.equal(link.firstChild, span);
  assert.equal(doc.querySelector('a'), link);
  assert.equal(link.getAttribute('href'), '/playlist/1');
  link.click();
  assert.equal(clicks, 1);
  stop();
  span.firstChild.data = '停止轉換';
  await settle();
  assert.equal(link.textContent, '停止轉換');
});

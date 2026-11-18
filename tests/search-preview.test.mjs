import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startSearchPreviewConversion } from "../src/search-preview.ts";

const rows = ['track', 'artist', 'album', 'playlist'].map(type => `
  <div role="row" aria-selected="false">
    <div role="gridcell" id="${type}-title"><a href="/${type}/1"><span>測試名稱</span></a></div>
    <span class="type-label">類型</span><span class="kLNNFB6XpG6NJxfzpgre">測試創作者</span>
    <button>儲存</button>
  </div>`).join('');
const settle = () => new Promise(resolve => setTimeout(resolve, 80));
function setup(t, html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startSearchPreviewConversion(doc);
  t.after(() => { stop(); dom.window.close(); });
  return { doc, stop };
}

test("converts entity titles and creators but preserves query suggestions and controls", (t) => {
  const { doc } = setup(t, `<input value="搜尋內容"><div id="search-dropdown" role="listbox">${rows}
    <div role="row"><a href="/search/query">搜尋建議</a><span class="kLNNFB6XpG6NJxfzpgre">建議內容</span></div>
    <button>查看所有結果</button></div><div id="searchPage"><a href="/album/2">完整結果</a></div>`);
  assert.deepEqual([...doc.querySelectorAll('[role="gridcell"] a')].map(a => a.textContent), Array(4).fill('测试名称'));
  assert.deepEqual([...doc.querySelectorAll('[role="gridcell"] + span + span')].map(e => e.textContent), Array(4).fill('测试创作者'));
  assert.equal(doc.querySelector('input').value, '搜尋內容');
  assert.equal(doc.querySelector('a[href^="/search/"]').textContent, '搜尋建議');
  assert.equal(doc.querySelector('a[href^="/search/"] + span').textContent, '建議內容');
  assert.equal(doc.querySelector('.type-label').textContent, '類型');
  assert.equal(doc.querySelector('button').textContent, '儲存');
  assert.equal(doc.querySelector('#searchPage').textContent, '完整結果');
});

test("handles opening, changed queries, added results, and reopening the dropdown", async (t) => {
  const { doc } = setup(t, '<main></main>');
  const main = doc.querySelector('main');
  main.innerHTML = `<div id="search-dropdown">${rows}</div>`;
  await settle();
  const title = main.querySelector('a span');
  assert.equal(title.textContent, '测试名称');
  title.firstChild.data = '新的結果';
  main.querySelector('#search-dropdown').insertAdjacentHTML('beforeend', '<a href="/album/3">新增專輯</a>');
  await settle();
  assert.equal(title.textContent, '新的结果');
  assert.equal(main.querySelector('a[href="/album/3"]').textContent, '新增专辑');
  main.innerHTML = '';
  await settle();
  main.innerHTML = `<div id="search-dropdown">${rows}</div>`;
  await settle();
  assert.equal(main.querySelector('a').textContent, '测试名称');
});

test("preserves navigation handlers and focus attributes, and stops on cleanup", async (t) => {
  const { doc, stop } = setup(t, `<div id="search-dropdown">${rows}</div>`);
  const link = doc.querySelector('a');
  let actions = 0;
  link.addEventListener('click', e => { e.preventDefault(); actions++; });
  link.addEventListener('keydown', e => { if (e.key === 'Enter') actions++; });
  link.firstChild.textContent = 'English Song';
  await settle();
  assert.equal(link.textContent, 'English Song');
  assert.equal(doc.querySelector('a[href="/track/1"]'), link);
  assert.equal(link.parentElement.id, 'track-title');
  assert.equal(link.closest('[role="row"]').getAttribute('aria-selected'), 'false');
  link.click();
  link.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key: 'Enter' }));
  assert.equal(actions, 2);
  let mutations = 0;
  const observer = new doc.defaultView.MutationObserver(records => { mutations += records.length; });
  observer.observe(doc.body, { childList: true, characterData: true, subtree: true });
  t.after(() => observer.disconnect());
  await settle();
  assert.equal(mutations, 0);
  link.firstChild.textContent = '停止轉換';
  await Promise.resolve();
  stop();
  await settle();
  assert.equal(link.textContent, '停止轉換');
});

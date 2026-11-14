import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startLyricsConversion } from "../src/lyrics.ts";

// Synthetic text, using the installed lyric-line component's structure.
const line = '<div class="J4_kkGYm5hjbZlztykxr" dir="auto"><div class="Dn2b5rh5_6c7YvX5uyak">測試音樂</div><div class="bYKUVT7r4f49BUfLyTHQ">English translation</div></div>';
const settle = () => new Promise(resolve => setTimeout(resolve, 80));

function setup(t, html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startLyricsConversion(doc);
  t.after(() => { stop(); dom.window.close(); });
  return { doc, stop };
}

test("converts lyric lines in main view and sidebar without touching other text", (t) => {
  const { doc } = setup(t, `<main>${line}<p>歌詞提供者</p></main><aside>${line}<button>顯示更多</button></aside><div data-testid="lyrics-line">測試文字</div>`);
  assert.deepEqual([...doc.querySelectorAll('.Dn2b5rh5_6c7YvX5uyak')].map(e => e.textContent), ["测试音乐", "测试音乐"]);
  assert.equal(doc.querySelector('[data-testid="lyrics-line"]').textContent, "测试文字");
  assert.equal(doc.querySelector('.bYKUVT7r4f49BUfLyTHQ').textContent, "English translation");
  assert.equal(doc.querySelector('p').textContent, "歌詞提供者");
  assert.equal(doc.querySelector('button').textContent, "顯示更多");
});

test("handles late loading, replaced tracks, and reopening lyrics", async (t) => {
  const { doc } = setup(t, '<main></main>');
  const main = doc.querySelector('main');
  main.innerHTML = line;
  await settle();
  assert.equal(main.firstChild.firstChild.textContent, "测试音乐");
  main.firstChild.firstChild.firstChild.data = "繁體文字";
  await settle();
  assert.equal(main.firstChild.firstChild.textContent, "繁体文字");
  main.innerHTML = '';
  await settle();
  main.innerHTML = `<section>${line}</section>`;
  await settle();
  assert.equal(main.querySelector('.Dn2b5rh5_6c7YvX5uyak').textContent, "测试音乐");
});

test("preserves line identity, seek handlers and highlighting, and stops cleanly", async (t) => {
  const { doc, stop } = setup(t, line);
  const lyric = doc.body.firstChild;
  let seeks = 0;
  lyric.addEventListener('click', () => { seeks++; });
  lyric.firstChild.textContent = "新的測試";
  await settle();
  assert.equal(lyric.firstChild.textContent, "新的测试");
  assert.equal(doc.body.firstChild, lyric);
  lyric.classList.add('active');
  lyric.click();
  assert.equal(seeks, 1);
  assert.equal(lyric.classList.contains('active'), true);
  let mutations = 0;
  const observer = new doc.defaultView.MutationObserver(records => { mutations += records.length; });
  observer.observe(lyric, { childList: true, characterData: true, subtree: true });
  t.after(() => observer.disconnect());
  await settle();
  assert.equal(mutations, 0);
  lyric.firstChild.textContent = "停止轉換";
  await Promise.resolve();
  stop();
  await settle();
  assert.equal(lyric.firstChild.textContent, "停止轉換");
});

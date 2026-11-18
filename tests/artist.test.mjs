import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startArtistConversion } from "../src/artist.ts";

test("converts both artist header variants and newly revealed Popular titles only", async t => {
  const dom = new JSDOM(`
    <section data-testid="artist-page">
      <div class="main-entityHeader-headerText">
        <span data-testid="entityTitle"><h1>陳奕迅</h1></span>
      </div>
      <div class="AN_Jg5L5weM0cDia6BJV" id="popular">
        <h2>熱門歌曲</h2>
        <div role="row"><div class="main-trackList-rowMainContentTitle">愛情轉移</div></div>
      </div>
      <a href="/album/1">測試專輯</a>
      <div role="row" id="other"><div class="main-trackList-rowMainContentTitle">其他歌曲</div></div>
    </section>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startArtistConversion(doc);
  t.after(() => { stop(); dom.window.close(); });

  assert.equal(doc.querySelector('h1').textContent, '陈奕迅');
  assert.equal(doc.querySelector('#popular [role="row"]').textContent, '爱情转移');
  assert.equal(doc.querySelector('#popular h2').textContent, '熱門歌曲');
  assert.equal(doc.querySelector('#other').textContent, '其他歌曲');
  assert.equal(doc.querySelector('a').textContent, '測試專輯');

  doc.querySelector('.main-entityHeader-headerText').innerHTML = '<span data-testid="adaptiveEntityTitle">張學友</span>';
  doc.querySelector('#popular').insertAdjacentHTML('beforeend',
    '<div role="row"><div class="main-trackList-rowMainContentTitle">聽海</div></div>');
  await new Promise(resolve => dom.window.requestAnimationFrame(() => dom.window.requestAnimationFrame(resolve)));

  assert.equal(doc.querySelector('[data-testid="adaptiveEntityTitle"]').textContent, '张学友');
  assert.equal(doc.querySelector('#popular [role="row"]:last-child').textContent, '听海');
});

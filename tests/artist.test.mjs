import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startArtistConversion } from "../src/artist.ts";

test("converts artist shelf playlist descriptions with inline links", t => {
  const dom = new JSDOM(`
    <section data-testid="artist-page">
      <section class="main-shelf-shelf">
        <a class="main-card-cardTitleLink" href="/playlist/1">最愛</a>
        <div class="zCXQkk3QnULi3ECXXoUh">
          <div class="OyzopagU_GLhvcT1lDa0">收錄 <a href="/artist/1">張學友</a> 的音樂</div>
        </div>
        <div class="OyzopagU_GLhvcT1lDa0">專輯資訊</div>
      </section>
    </section>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const link = doc.querySelector('a[href="/artist/1"]');
  const stop = startArtistConversion(doc);
  t.after(() => { stop(); dom.window.close(); });

  assert.equal(link.parentElement.textContent, '收录 张学友 的音乐');
  assert.equal(doc.querySelector('a[href="/artist/1"]'), link);
  assert.equal(doc.querySelector('a[href="/playlist/1"]').textContent, '最愛');
  assert.equal(doc.querySelector('.main-shelf-shelf > .OyzopagU_GLhvcT1lDa0').textContent, '專輯資訊');
});

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

test("converts Discography releases in the overview and in both See all layouts", async t => {
  const dom = new JSDOM(`
    <section data-testid="artist-page">
      <section class="p4Oms7ggaeACcjYs6bR3" id="discography">
        <div class="Uy5TsJiNi39iCvWp83Ws"><button>專輯</button></div>
        <a class="main-card-cardTitleLink" href="/album/1">認了吧</a>
        <span>專輯</span>
      </section>
      <section class="p4Oms7ggaeACcjYs6bR3" id="other-shelf">
        <a class="main-card-cardTitleLink" href="/album/2">推薦專輯</a>
      </section>
    </section>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startArtistConversion(doc);
  t.after(() => { stop(); dom.window.close(); });
  const nextUpdate = () => new Promise(resolve => {
    dom.window.requestAnimationFrame(() => dom.window.requestAnimationFrame(resolve));
  });

  const title = doc.querySelector('#discography a');
  assert.equal(title.textContent, '认了吧');
  assert.equal(doc.querySelector('#discography button').textContent, '專輯');
  assert.equal(doc.querySelector('#discography span').textContent, '專輯');
  assert.equal(doc.querySelector('#other-shelf a').textContent, '推薦專輯');

  title.textContent = '實驗單曲';
  await nextUpdate();
  assert.equal(title.textContent, '实验单曲');

  const page = doc.querySelector('[data-testid="artist-page"]');
  page.innerHTML = '<div class="artist-artistDiscography-cardGrid"><a class="main-card-cardTitleLink" href="/album/3">夢遊計</a></div>';
  await nextUpdate();
  assert.equal(page.querySelector('a[href="/album/3"]').textContent, '梦游计');

  page.innerHTML = `<div class="artist-artistDiscography-headerTitle"><a href="/album/4">華麗邂逅</a></div>
    <div role="row" class="main-trackList-rowMainContentTitle">專輯內歌曲</div>`;
  await nextUpdate();
  assert.equal(page.querySelector('a[href="/album/4"]').textContent, '华丽邂逅');
  assert.equal(page.querySelector('[role="row"]').textContent, '專輯內歌曲');
});

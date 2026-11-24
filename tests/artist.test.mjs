import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { startArtistConversion } from "../src/artist.ts";

test("converts the biography preview and a dialog mounted outside the artist page", async t => {
  const dom = new JSDOM(`
    <section data-testid="artist-page">
      <button><div class="eZM78YYSOCTE1FTK4tKC">香港音樂人</div></button>
    </section>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startArtistConversion(doc);
  t.after(() => { stop(); dom.window.close(); });
  assert.equal(doc.querySelector('button').textContent, '香港音乐人');

  doc.body.insertAdjacentHTML('beforeend', `
    <div role="dialog" class="YH4IQI_NEKM1UEiOOfBi">
      <div class="eZM78YYSOCTE1FTK4tKC">
        <p>香港音樂人 and producer.</p>
        <p>代表作是<a href="/album/1">測試專輯</a>。</p>
      </div>
      <button>關閉</button>
    </div>`);
  const link = doc.querySelector('[role="dialog"] a');
  await new Promise(resolve => dom.window.requestAnimationFrame(() => dom.window.requestAnimationFrame(resolve)));

  assert.deepEqual(Array.from(doc.querySelectorAll('[role="dialog"] p'), p => p.textContent), [
    '香港音乐人 and producer.', '代表作是测试专辑。',
  ]);
  assert.equal(doc.querySelector('[role="dialog"] a[href="/album/1"]'), link);
  assert.equal(doc.querySelector('[role="dialog"] button').textContent, '關閉');
});

test("converts Appears On release links on the overview and See all page", t => {
  const dom = new JSDOM(`
    <section data-testid="artist-page">
      <section class="main-shelf-shelf p4Oms7ggaeACcjYs6bR3">
        <a class="main-card-cardTitleLink" href="/album/1">愛的合輯</a>
        <a class="main-card-cardTitleLink" href="/artist/1">張學友</a>
      </section>
      <section class="main-shelf-shelf BNtmn81d3eXkOVoIhBmT">
        <a class="main-card-cardTitleLink" href="/album/2">經典樂章</a>
      </section>
      <a class="main-card-cardTitleLink" href="/album/3">推薦專輯</a>
    </section>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const stop = startArtistConversion(doc);
  t.after(() => { stop(); dom.window.close(); });

  assert.equal(doc.querySelector('a[href="/album/1"]').textContent, '爱的合辑');
  assert.equal(doc.querySelector('a[href="/album/2"]').textContent, '经典乐章');
  assert.equal(doc.querySelector('a[href="/album/3"]').textContent, '推薦專輯');
  assert.equal(doc.querySelector('a[href="/artist/1"]').textContent, '張學友');
});

test("converts Artist Pick text across its card layouts", t => {
  const dom = new JSDOM(`
    <section data-testid="artist-page">
      <div class="Ebw_qQ3HNrQQKUcwLtIA">
        <div class="Zzj1XTVI7gvpKjebKqTK"><span class="standalone-ellipsis-one-line" id="comment">我的最愛</span></div>
        <a data-testid="artist-pick-link" href="/track/1">愛情轉移</a>
        <section data-testid="artist-pick-with-background-container">
          <section class="_ZnH9lmh923t4tl8cMA3"><span class="standalone-ellipsis-one-line" id="background-comment">請聽這首</span></section>
        </section>
        <div data-testid="artist-pick-merch-container">
          <span data-testid="merch-artist-pick-comment">限量發售</span><h3>紀念專輯</h3>
        </div>
        <p class="SwSeQNOrS9ytJQAvgTK8" id="concert">演唱會</p>
      </div>
      <p class="SwSeQNOrS9ytJQAvgTK8" id="other-concert">其他演唱會</p>
    </section>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const title = doc.querySelector('a');
  const stop = startArtistConversion(doc);
  t.after(() => { stop(); dom.window.close(); });

  assert.equal(doc.querySelector('a[href="/track/1"]'), title);
  assert.equal(title.textContent, '爱情转移');
  assert.equal(doc.querySelector('#comment').textContent, '我的最爱');
  assert.equal(doc.querySelector('#background-comment').textContent, '请听这首');
  assert.equal(doc.querySelector('[data-testid="merch-artist-pick-comment"]').textContent, '限量发售');
  assert.equal(doc.querySelector('h3').textContent, '纪念专辑');
  assert.equal(doc.querySelector('#concert').textContent, '演唱会');
  assert.equal(doc.querySelector('#other-concert').textContent, '其他演唱會');
});

test("converts artist shelf playlist titles and descriptions with inline links", t => {
  const dom = new JSDOM(`
    <section data-testid="artist-page">
      <section class="main-shelf-shelf">
        <a class="main-card-cardTitleLink" href="/playlist/1">最愛...王力宏</a>
        <a class="main-card-cardTitleLink" href="/album/1">推薦專輯</a>
        <div class="zCXQkk3QnULi3ECXXoUh">
          <div class="OyzopagU_GLhvcT1lDa0">收錄 <a href="/artist/1">張學友</a> 的音樂</div>
        </div>
        <div class="OyzopagU_GLhvcT1lDa0">專輯資訊</div>
      </section>
    </section>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const link = doc.querySelector('a[href="/artist/1"]');
  const title = doc.querySelector('a[href="/playlist/1"]');
  const stop = startArtistConversion(doc);
  t.after(() => { stop(); dom.window.close(); });

  assert.equal(link.parentElement.textContent, '收录 张学友 的音乐');
  assert.equal(doc.querySelector('a[href="/artist/1"]'), link);
  assert.equal(title.textContent, '最爱...王力宏');
  assert.equal(doc.querySelector('a[href="/playlist/1"]'), title);
  assert.equal(doc.querySelector('a[href="/album/1"]').textContent, '推薦專輯');
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

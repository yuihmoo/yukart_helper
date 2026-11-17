// ---------- 테마 공통 (첫 화면·よん·れん): 색 정의 + 적용 + 선택 시트 + 버튼 UX ----------
// 저장: localStorage 'n2:theme' (세 화면 공유). null = 시스템 설정 따름.
// light / dim / dark 는 각 앱 CSS의 기본 색(よん=주황, れん=파랑)을 그대로 쓰고, 나머지는 여기서 색을 정의한다.
(function(){
  const S = '0 1px 2px rgba(0,0,0,.06),0 4px 14px rgba(0,0,0,.05)', SD = '0 1px 2px rgba(0,0,0,.25)';
  // v: bg card ink sub line accent accent-weak ok ok-weak ng ng-weak chip on-accent blue blue-weak shadow
  const P = (bg, card, ink, sub, line, accent, aw, ok, okw, ng, ngw, chip, on, blue, bw, sh) =>
    ({bg, card, ink, sub, line, accent, 'accent-weak': aw, ok, 'ok-weak': okw, ng, 'ng-weak': ngw, chip, 'on-accent': on, blue, 'blue-weak': bw, shadow: sh});
  const LIST = [
    {id: 'light',    ko: '라이트',            ja: 'ライト',              dark: false, sw: ['#f6f5f2', '#ffffff', '#c8553d']},
    {id: 'dim',      ko: '중간 톤',           ja: 'グレー',              dark: true,  sw: ['#3b3f47', '#474c55', '#f2a08a']},
    {id: 'dark',     ko: '다크',              ja: 'ダーク',              dark: true,  sw: ['#16181d', '#1f2229', '#e27a5f']},
    {id: 'comfort',  ko: '컴포트',            ja: 'コンフォート',        dark: false, d: '눈이 편한 크림·저대비', dj: '目にやさしいクリーム',
      v: P('#f3efe6', '#fbf8f1', '#3a3a36', '#6b685f', '#e3ddd0', '#467357', '#e2ece3', '#4f8a5f', '#dcebdd', '#b8664f', '#f2e0d8', '#ebe5d8', '#fff', '#5b7fa8', '#e1e8f1', S)},
    {id: 'comfort-dark', ko: '컴포트 다크',   ja: 'コンフォート・ダーク', dark: true, d: '밤에 눈이 편한 따뜻한 어둠', dj: '夜も目にやさしい',
      v: P('#262421', '#2f2c28', '#e8e2d6', '#a8a193', '#3d3934', '#8fbf9a', '#2f3d33', '#8fbf9a', '#2c3a30', '#e09a85', '#43302a', '#38342f', '#1f1d1a', '#9cb6d6', '#2c3440', SD)},
    {id: 'solarized', ko: '솔라라이즈드',     ja: 'ソラライズド',        dark: false, d: '개발자 인기 배색(밝게)', dj: '定番の配色（明）',
      v: P('#fdf6e3', '#fffbee', '#073642', '#586e75', '#eee8d5', '#1d6fa8', '#dcebf5', '#859900', '#eef1d3', '#dc322f', '#f9dedd', '#eee8d5', '#ffffff', '#6c71c4', '#e6e6f5', S)},
    {id: 'solarized-dark', ko: '솔라라이즈드 다크', ja: 'ソラライズド・ダーク', dark: true, d: '개발자 인기 배색(어둡게)', dj: '定番の配色（暗）',
      v: P('#002b36', '#073642', '#eee8d5', '#93a1a1', '#0f4552', '#35b3a9', '#0a4a4f', '#859900', '#24411c', '#dc322f', '#4a1f22', '#0d3f4b', '#002b36', '#268bd2', '#0b3c55', SD)},
    {id: 'cobalt',   ko: '코발트',            ja: 'コバルト',            dark: true,  d: '진한 파랑 + 노랑 강조', dj: '深い青＋黄色',
      v: P('#193549', '#1f4662', '#ffffff', '#a9c1d6', '#2a5778', '#ffc600', '#4a4422', '#3ad900', '#1f4a2e', '#ff628c', '#4b2a3f', '#234b68', '#193549', '#9effff', '#24505f', SD)},
    {id: 'nord',     ko: '노르드',            ja: 'ノルド',              dark: true,  d: '차분한 북유럽 블루그레이', dj: '北欧のブルーグレー',
      v: P('#2e3440', '#3b4252', '#eceff4', '#b4bccb', '#434c5e', '#88c0d0', '#36495a', '#a3be8c', '#3a4a3d', '#bf616a', '#4a3a42', '#434c5e', '#2e3440', '#81a1c1', '#3b4a5e', SD)},
    {id: 'sepia',    ko: '세피아(종이)',      ja: 'セピア（紙）',        dark: false, d: '오래 읽어도 편한 종이 색', dj: '紙のような色',
      v: P('#f4ecd8', '#fbf5e6', '#3b2f22', '#7d6b55', '#e2d5b8', '#9c5b2e', '#f0dcc8', '#5f7a3a', '#e4ead2', '#a8442f', '#f2d9cf', '#ebe0c6', '#fff', '#4f6f8f', '#dfe6ee', S)},
    {id: 'sakura',   ko: '사쿠라',            ja: 'さくら',              dark: false, d: '연한 벚꽃 핑크', dj: '淡い桜色',
      v: P('#fbf3f5', '#ffffff', '#3a2a30', '#8a6f78', '#f0dde3', '#bf4776', '#fae0ea', '#3f9a6b', '#dcf1e5', '#cf4b4b', '#f8dede', '#f6e7ec', '#fff', '#7a6fc0', '#ebe8f8', S)},
    {id: 'matcha',   ko: '말차',              ja: '抹茶',                dark: false, d: '차분한 녹차 그린', dj: '落ち着いた緑',
      v: P('#f2f4ec', '#fbfcf7', '#26301f', '#67725c', '#dfe5d2', '#4f6f24', '#e3ecd2', '#3f8a4f', '#dbeedd', '#b5523b', '#f3ddd5', '#e8ecdd', '#fff', '#4a7a8c', '#ddeaee', S)},
    {id: 'contrast', ko: '고대비',            ja: 'ハイコントラスト',    dark: true,  d: '글자가 가장 또렷하게', dj: '文字がいちばん見やすい',
      v: P('#000000', '#0d0d0d', '#ffffff', '#d0d0d0', '#5a5a5a', '#ffd400', '#3a3200', '#3cff8f', '#0d3a22', '#ff5c5c', '#3d1212', '#1e1e1e', '#000', '#6cc5ff', '#0f2d40', 'none')},
  ];
  LIST.forEach(t => { if (t.v) t.sw = [t.v.bg, t.v.card, t.v.accent]; });
  const IDS = LIST.map(t => t.id);

  // 색 변수 + 버튼 UX + 선택 시트 스타일 (앱 CSS 뒤에 붙여 우선 적용)
  const css = LIST.filter(t => t.v).map(t => `:root[data-theme="${t.id}"]{${Object.entries(t.v).map(([k, v]) => `--${k}:${v}`).join(';')}}`).join('\n') + `
/* 버튼 UX: 누를 때 살짝 눌리는 느낌, 키보드 포커스 표시, 비활성 상태 구분, 터치 영역 확보 */
.btn,.pill,.choice,.iconbtn,.tts,.gtts,.xtts,.days button,.card.row,.chk,a.pick,.wchip{transition:transform .08s ease,background-color .15s,border-color .15s,box-shadow .15s,opacity .15s,filter .15s}
.btn:active:not(:disabled),.pill:active,.choice:active,.iconbtn:active,.tts:active,.gtts:active,.xtts:active,.days button:active,.card.row:active,a.pick:active,.wchip:active{transform:scale(.96)}
.btn{min-height:48px;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--line)}
.btn.primary{border-color:transparent;box-shadow:0 6px 16px -8px var(--accent)}
.btn:disabled{opacity:.38;cursor:default;box-shadow:none}
.pill{border:1px solid transparent;min-height:34px}
.pill.on{box-shadow:0 4px 12px -6px var(--accent)}
.iconbtn{border:1px solid var(--line)}
.iconbtn.txt.on{border-color:transparent;box-shadow:0 4px 12px -6px var(--accent)}
.choice{min-height:54px}
.tts,.gtts,.xtts{border:1px solid var(--line)}
:focus{outline:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:12px}
@media (hover:hover){
  .btn:hover:not(:disabled){filter:brightness(1.06)}
  .choice:hover:not(.ok):not(.ng),.card.row:hover,a.pick:hover{border-color:var(--accent)}
  .pill:hover:not(.on),.iconbtn:hover,.tts:hover,.gtts:hover,.xtts:hover{border-color:var(--accent)}
}
@media (prefers-reduced-motion:reduce){.btn,.pill,.choice,.iconbtn,.tts,.gtts,.xtts,.days button,.card.row,.chk,a.pick,.wchip{transition:none}.thsheet .panel{animation:none}}
/* ---- 모션: 화면 전환·정답/오답·발음 재생 중·테마 전환 (동작 줄이기 설정 시 전부 끔) ---- */
@keyframes anUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes anNext{from{opacity:.2;transform:translateX(28px)}to{opacity:1;transform:none}}
@keyframes anPrev{from{opacity:.2;transform:translateX(-28px)}to{opacity:1;transform:none}}
@keyframes anBack{from{opacity:.35;transform:translateX(-12px)}to{opacity:1;transform:none}}
@keyframes anPop{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}
@keyframes anShake{0%,100%{transform:none}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
@keyframes anRing{0%{box-shadow:0 0 0 0 var(--accent)}100%{box-shadow:0 0 0 9px transparent}}
@keyframes anFade{from{opacity:0}to{opacity:1}}
@keyframes anFadeOut{from{opacity:1}to{opacity:0}}
@keyframes anDown{from{transform:none;opacity:1}to{transform:translateY(28px);opacity:.4}}
.an-fwd>*{animation:anUp .28s cubic-bezier(.2,.8,.2,1) backwards}
.an-fwd>:nth-child(2){animation-delay:.035s}.an-fwd>:nth-child(3){animation-delay:.07s}.an-fwd>:nth-child(4){animation-delay:.105s}
.an-fwd>:nth-child(5){animation-delay:.14s}.an-fwd>:nth-child(6){animation-delay:.175s}.an-fwd>:nth-child(n+7){animation-delay:.2s}
.an-next{animation:anNext .22s cubic-bezier(.2,.8,.2,1)}
.an-prev{animation:anPrev .22s cubic-bezier(.2,.8,.2,1)}
.an-back{animation:anBack .2s ease-out}
.choice.ok{animation:anPop .34s ease-out}
.fb{animation:anUp .24s cubic-bezier(.2,.8,.2,1) backwards}
.choice.ng{animation:anShake .38s ease-out}
.speaking{animation:anRing 1s ease-out infinite;border-color:var(--accent)!important}
a.pick{animation:anUp .32s cubic-bezier(.2,.8,.2,1) backwards}a.pick+a.pick{animation-delay:.06s}
.th-anim,.th-anim *{transition:background-color .3s ease,color .3s ease,border-color .3s ease,fill .3s ease!important}
.thsheet{animation:anFade .18s ease-out}
.thsheet.out{animation:anFadeOut .16s ease-in forwards}.thsheet.out .panel{animation:anDown .16s ease-in forwards}
@media (prefers-reduced-motion:reduce){.an-fwd>*,.fb,.an-next,.an-prev,.an-back,.choice.ok,.choice.ng,.speaking,a.pick,.thsheet,.thsheet.out,.thsheet.out .panel{animation:none!important}.th-anim,.th-anim *{transition:none!important}}
/* 테마 선택 시트 */
.thsheet{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
.thsheet .panel{width:100%;max-width:560px;max-height:82vh;overflow:auto;background:var(--bg);color:var(--ink);border-radius:20px 20px 0 0;
  padding:16px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -8px 30px rgba(0,0,0,.25);animation:thUp .18s ease-out}
@keyframes thUp{from{transform:translateY(24px);opacity:.6}to{transform:none;opacity:1}}
.thsheet .hd{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.thsheet .hd h2{flex:1;margin:0;font-size:18px}
.thsheet .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.thsheet .tile{display:block;width:100%;text-align:left;padding:10px;border-radius:14px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;font:inherit}
.thsheet .tile.on{border-color:var(--accent)}
.thsheet .pv{height:54px;border-radius:10px;padding:8px;display:flex;gap:6px;align-items:flex-end;margin-bottom:8px;border:1px solid rgba(127,127,127,.25)}
.thsheet .pv i{display:block;border-radius:6px}
.thsheet .nm{font-weight:700;font-size:14px;display:flex;justify-content:space-between;gap:6px}
.thsheet .ds{font-size:12px;color:var(--sub);margin-top:2px;min-height:16px}
.thsheet .sys{grid-column:1/-1}
`;
  const st = document.createElement('style'); st.id = 'themeCss'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  const KEY = 'n2:theme';
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return IDS.includes(v) ? v : null; } catch(e) { return null; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e) {} };
  const sysDark = () => { try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch(e) { return false; } };
  const current = () => { const t = document.documentElement.getAttribute('data-theme'); return IDS.includes(t) ? t : (sysDark() ? 'dark' : 'light'); };
  function apply(t){
    if (!IDS.includes(t)) t = null;   // 저장값이 깨졌으면 시스템 설정 따름
    if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    // 상단 상태바 색 = 실제 배경색
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) { const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(); if (bg) m.setAttribute('content', bg); }
  }
  apply(read());   // <head>에서 실행되면 첫 화면부터 깜빡임 없이 적용

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function open(lang, onChange){
    const ja = lang === 'ja', L = ja ? {t: 'テーマ', sys: '端末の設定に合わせる', sysd: 'ライト／ダークを自動で切り替え', close: '閉じる'}
                                    : {t: '테마', sys: '기기 설정 따르기', sysd: '라이트·다크 자동 전환', close: '닫기'};
    const saved = read();
    const prev = document.querySelector('.thsheet'); if (prev) prev.remove();
    const el = document.createElement('div'); el.className = 'thsheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', L.t);
    const tile = t => `<button class="tile ${saved === t.id ? 'on' : ''}" data-t="${t.id}" aria-pressed="${saved === t.id}">
        <div class="pv" style="background:${t.sw[0]}"><i style="flex:1;height:70%;background:${t.sw[1]}"></i><i style="width:22px;height:22px;background:${t.sw[2]}"></i></div>
        <div class="nm"><span>${esc(ja ? t.ja : t.ko)}</span><span>${saved === t.id ? '✓' : ''}</span></div>
        <div class="ds">${esc((ja ? t.dj : t.d) || (t.dark ? (ja ? '暗め' : '어두운 테마') : (ja ? '明るめ' : '밝은 테마')))}</div></button>`;
    el.innerHTML = `<div class="panel"><div class="hd"><h2>${L.t}</h2><button class="btn" data-x style="flex:0 0 auto;min-height:40px;padding:8px 14px">${L.close}</button></div>
      <div class="grid"><button class="tile sys ${saved === null ? 'on' : ''}" data-t="" aria-pressed="${saved === null}"><div class="nm"><span>${L.sys}</span><span>${saved === null ? '✓' : ''}</span></div><div class="ds">${L.sysd}</div></button>
      ${LIST.map(tile).join('')}</div></div>`;
    let closed = false;
    const close = () => {
      if (closed) return; closed = true; document.removeEventListener('keydown', onKey, true);
      if (reduced()) { el.remove(); return; }
      el.classList.add('out'); setTimeout(() => el.remove(), 170);   // 내려가며 닫힘 (animationend에 의존하지 않음)
    };
    // 시트가 열린 동안 앱 단축키(←/→/Enter/Backspace/숫자)가 뒤 화면에 작동하지 않게 막음. Enter는 포커스된 타일을 누름(기본 동작)
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; } if (e.key !== 'Tab') e.stopPropagation(); };
    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('[data-x]')) { close(); return; }
      const b = e.target.closest('[data-t]'); if (!b) return;
      const v = b.dataset.t || null; write(v); themeFade(); apply(v); close(); if (onChange) onChange(current());
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(el);
    const on = el.querySelector('.tile.on'); if (on) on.focus();
  }
  // ---------- 모션 ----------
  function reduced(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e) { return false; } }
  let thT = 0;
  function themeFade(){   // 테마를 바꿀 때 색이 0.3초 동안 부드럽게 바뀜
    if (reduced()) return;
    const r = document.documentElement; r.classList.add('th-anim'); clearTimeout(thT); thT = setTimeout(() => r.classList.remove('th-anim'), 450);
  }
  // 화면 전환: 앱의 go()/back()이 방향을 표시(mark) → #view 내용이 바뀌는 순간 그 방향으로 애니메이션.
  // 필터·암기 취소처럼 같은 화면을 다시 그리는 경우는 표시가 없으므로 움직이지 않음.
  const AN = ['an-fwd', 'an-next', 'an-prev', 'an-back'];
  let pend = null, pendT = 0, lastBar = null;
  function mark(dir, soft){
    if (soft && pend) return;                       // ‹ 이전 버튼에서 이미 'prev'로 표시한 경우 유지
    pend = dir; clearTimeout(pendT);
    pendT = setTimeout(() => { pend = null; }, 0);   // 화면이 안 바뀌었으면 다음 렌더에 남지 않게 폐기
  }
  function play(el, dir){
    el.classList.remove(...AN);
    if (!dir || reduced()) return;
    void el.offsetWidth;                            // 같은 방향 연속 전환에서도 다시 재생
    el.classList.add('an-' + dir);
    clearTimeout(el._anT); el._anT = setTimeout(() => el.classList.remove(...AN), 700);
  }
  function barGrow(v){   // 퀴즈 진행 막대: 이전 값에서 새 값으로 늘어나게
    const i = v.querySelector('.bar i'); if (!i) { lastBar = null; return; }
    const to = i.style.width, a = parseFloat(lastBar), b = parseFloat(to); lastBar = to;
    if (reduced() || !(a >= 0) || !(b > a)) return;
    i.style.width = a + '%'; void i.offsetWidth;
    requestAnimationFrame(() => { if (i.isConnected) i.style.width = to; });
  }
  function bindView(){
    const v = document.getElementById('view'); if (!v || v._anBound) return; v._anBound = true;
    try { new MutationObserver(() => { const d = pend; pend = null; play(v, d); barGrow(v); }).observe(v, {childList: true}); } catch(e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindView); else bindView();
  // ‹ 이전 / 다음 › (클릭·키보드·스와이프 모두 click으로 들어옴) → 좌우 슬라이드 방향
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('#prev,#next,#nx');
    if (b && !b.disabled) mark(b.id === 'prev' ? 'prev' : 'next');
  }, true);
  // 🔊 재생 중 표시: 누른 버튼에 파동 링, 읽기가 끝나면 사라짐
  let spEl = null, spT = 0;
  const spStop = () => { clearInterval(spT); if (spEl) spEl.classList.remove('speaking'); spEl = null; };
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('.tts,.gtts,.xtts');
    if (!b || !window.speechSynthesis) return;
    spStop(); spEl = b; b.classList.add('speaking');
    const t0 = Date.now();
    spT = setInterval(() => {
      let busy = true; try { busy = speechSynthesis.speaking || speechSynthesis.pending; } catch(err) { busy = false; }
      const dt = Date.now() - t0;
      if ((!busy && dt > 500) || dt > 20000 || !b.isConnected) spStop();   // 음성 준비 지연 0.5초 허용, 최대 20초
    }, 150);
  });
  window.ANIM = {mark, play};
  window.THEME = {list: LIST, apply, current, read, open};
})();

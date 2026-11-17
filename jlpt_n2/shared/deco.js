// ---------- 내 이미지 꾸미기 (첫 화면·よん·れん 공통) ----------
// 이미지: IndexedDB 'n2-deco'(기기 안에만 저장, 백업 파일에는 포함되지 않음). 설정값: localStorage 'n2:deco'.
// 1) 메뉴 아이콘 바꾸기  2) 배경 이미지(가림 정도·흐림)  3) 스티커(화면 구석 마스코트)  4) 정답 축하 이미지
(function(){
  if (window.DECO) return;
  const APP = ((location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/i, '') || 'index');
  const SKEY = 'n2:deco';
  const DEF = {veil: 0.35, blur: 0, stPos: 'br', stSize: 80, cheer: true, bgFit: 'cover', bgZoom: 100, bgPos: 'center', accentMode: 'theme', accent: '#e05a8a', autoAccent: '', glass: 0};
  const HEX = /^#[0-9a-f]{6}$/i;
  const FITS = ['cover', 'contain', 'zoom', 'tile'], BPOS = ['center', 'top', 'bottom', 'left', 'right'];
  const T = {
    ko: {t: '내 이미지 꾸미기', close: '닫기', bg: '배경 이미지', veil: '가림 정도 (글자 잘 보이게)', blur: '배경 흐림', st: '스티커 (화면 구석)', size: '크기',
      pos: '위치', br: '오른쪽 아래', bl: '왼쪽 아래', tr: '오른쪽 위', cheer: '정답 축하 이미지', cheerOn: '정답일 때 보여 주기', icons: '메뉴 아이콘',
      pick: '사진 선택', del: '삭제', none: '없음', reset: '꾸미기 전부 지우기', resetQ: '배경·스티커·아이콘 이미지를 모두 지울까요?',
      noMenu: '홈 화면(메뉴가 보이는 화면)에서 열면 메뉴 아이콘을 바꿀 수 있어요.', note: '이미지는 이 기기에만 저장되며 학습 기록 백업 파일에는 포함되지 않습니다.',
      fail: '이미지를 불러오지 못했습니다. 다른 사진으로 시도해 주세요.', big: '파일이 너무 큽니다(30MB 이하).', noDb: '이 브라우저에서는 이미지를 저장할 수 없습니다(개인정보 보호 모드 등).',
      saving: '저장 중…', test: '미리 보기', fit: '크기 맞춤', cover: '화면 꽉 채우기', contain: '전체 보이기', zoom: '직접 크기 조절', tile: '바둑판 반복',
      zoomL: '크기', bpos: '위치', center: '가운데', top: '위', bottom: '아래', left: '왼쪽', right: '오른쪽',
      color: '강조색', cTheme: '테마 기본', cAuto: '배경에서 자동', cCustom: '직접 고르기', cNote: '버튼·글자 대비가 충분하도록 밝기를 자동 보정합니다.', cNoBg: '배경 이미지를 넣으면 사용할 수 있어요',
      glass: '카드 투명도 (유리 효과)', bk: '꾸미기 백업', bkOut: '파일로 내보내기', bkIn: '파일에서 불러오기', bkNote: '이미지·설정·테마를 한 파일로 저장해 다른 기기로 옮길 수 있어요.',
      bkDone: '불러오기 완료', bkBad: '꾸미기 백업 파일이 아니거나 손상되었습니다.', bkOk: '파일을 만들었습니다.'},
    ja: {t: 'マイ画像でデコる', close: '閉じる', bg: '背景画像', veil: 'ぼかし幕の濃さ（文字を読みやすく）', blur: '背景のぼかし', st: 'ステッカー（画面のすみ）', size: '大きさ',
      pos: '位置', br: '右下', bl: '左下', tr: '右上', cheer: '正解のごほうび画像', cheerOn: '正解したときに表示', icons: 'メニューのアイコン',
      pick: '写真を選ぶ', del: '削除', none: 'なし', reset: 'デコをすべて消す', resetQ: '背景・ステッカー・アイコンの画像をすべて消しますか？',
      noMenu: 'ホーム画面（メニューが見える画面）で開くと、メニューのアイコンを変えられます。', note: '画像はこの端末にだけ保存され、学習記録のバックアップには含まれません。',
      fail: '画像を読み込めませんでした。別の写真でお試しください。', big: 'ファイルが大きすぎます（30MBまで）。', noDb: 'このブラウザでは画像を保存できません（プライベートモードなど）。',
      saving: '保存中…', test: 'プレビュー', fit: 'サイズの合わせ方', cover: '画面いっぱい', contain: '全体を表示', zoom: 'サイズを自分で調整', tile: 'タイル状にくり返す',
      zoomL: '大きさ', bpos: '位置', center: '中央', top: '上', bottom: '下', left: '左', right: '右',
      color: 'アクセントカラー', cTheme: 'テーマのまま', cAuto: '背景から自動', cCustom: '自分で選ぶ', cNote: 'ボタンや文字が読みやすいよう、明るさを自動で調整します。', cNoBg: '背景画像を入れると使えます',
      glass: 'カードの透明度（ガラス効果）', bk: 'デコのバックアップ', bkOut: 'ファイルに書き出す', bkIn: 'ファイルから読み込む', bkNote: '画像・設定・テーマを1つのファイルにまとめて、別の端末に移せます。',
      bkDone: '読み込みました', bkBad: 'デコのバックアップファイルではないか、壊れています。', bkOk: 'ファイルを作成しました。'}
  };

  // ---- 설정 ----
  const num = (v, lo, hi, d) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
  function readCfg(){
    let c = {}; try { c = JSON.parse(localStorage.getItem(SKEY) || '{}') || {}; } catch (e) { c = {}; }
    return {veil: num(c.veil, 0, 0.85, DEF.veil), blur: num(c.blur, 0, 12, DEF.blur), stSize: num(c.stSize, 48, 160, DEF.stSize),
      stPos: ['br', 'bl', 'tr'].includes(c.stPos) ? c.stPos : DEF.stPos, cheer: c.cheer !== false,
      bgFit: FITS.includes(c.bgFit) ? c.bgFit : DEF.bgFit, bgZoom: num(c.bgZoom, 20, 400, DEF.bgZoom), bgPos: BPOS.includes(c.bgPos) ? c.bgPos : DEF.bgPos,
      accentMode: ['theme', 'auto', 'custom'].includes(c.accentMode) ? c.accentMode : 'theme', accent: HEX.test(c.accent || '') ? c.accent : DEF.accent,
      autoAccent: HEX.test(c.autoAccent || '') ? c.autoAccent : '', glass: num(c.glass, 0, 0.5, 0)};
  }
  let cfg = readCfg();
  const saveCfg = () => { try { localStorage.setItem(SKEY, JSON.stringify(cfg)); } catch (e) {} };

  // ---- IndexedDB ----
  let dbp = null;
  function db(){
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      try {
        if (!window.indexedDB) return rej(new Error('noDb'));
        const r = indexedDB.open('n2-deco', 1);
        r.onupgradeneeded = () => { try { r.result.createObjectStore('img'); } catch (e) {} };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error || new Error('noDb'));
        r.onblocked = () => rej(new Error('noDb'));
      } catch (e) { rej(e); }
    });
    dbp.catch(() => { dbp = null; });   // 실패하면 다음에 다시 시도
    return dbp;
  }
  const tx = (mode, fn) => db().then(d => new Promise((res, rej) => {
    const t = d.transaction('img', mode), s = t.objectStore('img'); let out;
    const r = fn(s); if (r) r.onsuccess = () => { out = r.result; };
    t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  }));
  const idbGet = k => tx('readonly', s => s.get(k));
  const idbPut = (k, v) => tx('readwrite', s => s.put(v, k));
  const idbDel = k => tx('readwrite', s => s.delete(k));
  const idbKeys = () => tx('readonly', s => s.getAllKeys ? s.getAllKeys() : null).then(v => v || []);

  // ---- 이미지 캐시 (objectURL) ----
  const urls = new Map();
  function setUrl(k, blob){ const o = urls.get(k); if (o) URL.revokeObjectURL(o); if (blob) urls.set(k, URL.createObjectURL(blob)); else urls.delete(k); }
  const iconKey = id => `icon:${APP}:${id}`;

  // ---- 사진 → 축소·압축 (아이폰 사진도 수 MB → 수백 KB) ----
  function shrink(file, o){
    return new Promise((res, rej) => {
      if (!file) return rej(new Error('fail'));
      if (file.size > 30e6) return rej(new Error('big'));
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        try {
          let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
          if (!sw || !sh) throw new Error('fail');
          if (o.square) { const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
          const k = Math.min(1, o.max / Math.max(sw, sh)), w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const g = c.getContext('2d'); if (!g) throw new Error('fail');
          g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
          c.toBlob(b => { URL.revokeObjectURL(url); b ? res(b) : rej(new Error('fail')); }, o.type, o.q);
        } catch (e) { URL.revokeObjectURL(url); rej(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('fail')); };
      img.src = url;
    });
  }
  const KIND = {
    bg: {max: 1600, type: 'image/jpeg', q: 0.85},
    sticker: {max: 360, type: 'image/png'},         // PNG: 배경이 투명한 스티커 그대로
    cheer: {max: 560, type: 'image/png'},
    icon: {max: 192, type: 'image/png', square: true}
  };

  // ---- CSS ----
  const css = `
html.deco-bg,html.deco-bg body{background:transparent!important;background-image:none!important}
#decoBg{position:fixed;inset:0;z-index:-2;background-color:var(--bg);background-size:cover;background-position:center;background-repeat:no-repeat;pointer-events:none}
#decoVeil{position:fixed;inset:0;z-index:-1;background:var(--bg);pointer-events:none}
.decoIcon{width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block}
#decoSticker{position:fixed;z-index:6;pointer-events:none;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.18));animation:decoBob 3.2s ease-in-out infinite}
#decoSticker.br{right:calc(10px + env(safe-area-inset-right));bottom:calc(10px + env(safe-area-inset-bottom))}
#decoSticker.bl{left:calc(10px + env(safe-area-inset-left));bottom:calc(10px + env(safe-area-inset-bottom))}
#decoSticker.tr{right:calc(10px + env(safe-area-inset-right));top:calc(64px + env(safe-area-inset-top))}
@keyframes decoBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
#decoCheer{position:fixed;left:50%;top:40%;z-index:60;width:min(46vw,220px);pointer-events:none;transform:translate(-50%,-50%);animation:decoPop 1.1s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes decoPop{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}45%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-62%) scale(1)}}
@media (prefers-reduced-motion:reduce){#decoSticker{animation:none}#decoCheer{animation:decoFade 1.1s forwards}@keyframes decoFade{0%,80%{opacity:1}100%{opacity:0}}}
.dsec{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px}
.dsec h3{margin:0 0 8px;font-size:15px}
.drow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.drow+.drow{margin-top:8px}
.dthumb{width:56px;height:56px;border-radius:12px;border:1px solid var(--line);background:var(--chip) center/cover no-repeat;flex:0 0 auto;display:grid;place-items:center;font-size:22px;color:var(--sub);overflow:hidden}
.dthumb.wide{width:84px}
.dthumb.contain{background-size:contain}
.dlab{flex:1;min-width:120px;font-size:14px}
.dlab small{display:block;color:var(--sub);font-size:12px}
.dsec .btn{flex:0 0 auto;min-height:40px;padding:8px 12px;font-size:14px}
.dsec input[type=range]{flex:1;min-width:140px;accent-color:var(--accent)}
.dsec select{font:inherit;padding:6px 8px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
.dnote{font-size:12px;color:var(--sub);margin:6px 2px 10px}
.dmsg{font-size:13px;color:var(--ng);min-height:18px;margin:0 2px 6px}
.dmsg.ok{color:var(--ok)}
/* 상단 바: 직각 띠 대신 둥근 유리 바 (뒤 내용이 비치며 흐려짐) */
header.top{border-radius:0 0 18px 18px;margin:0 -10px;padding-left:10px!important;padding-right:10px!important}
@supports ((-webkit-backdrop-filter:blur(1px)) or (backdrop-filter:blur(1px))) and (background:color-mix(in srgb,red 50%,transparent)){
  header.top{background:color-mix(in srgb,var(--bg) 74%,transparent)!important;-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4)}
}
html.deco-bg header.top{box-shadow:0 8px 20px -14px rgba(0,0,0,.35)}
/* 유리 카드 */
@supports (background:color-mix(in srgb,red 50%,transparent)){
  html.deco-glass .card,html.deco-glass .choice,html.deco-glass .fb,html.deco-glass .dsec{background:color-mix(in srgb,var(--card) var(--dgp,80%),transparent)!important;-webkit-backdrop-filter:blur(10px) saturate(1.3);backdrop-filter:blur(10px) saturate(1.3)}
  html.deco-glass .choice.ok{background:color-mix(in srgb,var(--ok-weak) 92%,transparent)!important}
  html.deco-glass .choice.ng{background:color-mix(in srgb,var(--ng-weak) 92%,transparent)!important}
}
.dpills{display:flex;gap:6px;flex-wrap:wrap}
.dpills .pill{padding:6px 12px;border-radius:999px;background:var(--chip);border:1px solid var(--line);color:var(--ink);font:inherit;font-size:13px;cursor:pointer}
.dpills .pill.on{background:var(--accent);color:var(--on-accent);border-color:transparent}
.dpills .pill:disabled{opacity:.45}
.dsw{width:28px;height:28px;border-radius:50%;border:2px solid var(--card);box-shadow:0 0 0 1px var(--line);flex:0 0 auto}
.dsec input[type=color]{width:44px;height:34px;border:1px solid var(--line);border-radius:10px;background:var(--card);padding:2px}
`;
  const st = document.createElement('style'); st.id = 'decoCss'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  // ---- 적용 ----
  function applyBg(){
    const u = urls.get('bg'), root = document.documentElement;
    let bg = document.getElementById('decoBg'), veil = document.getElementById('decoVeil');
    if (!u) { root.classList.remove('deco-bg'); if (bg) bg.remove(); if (veil) veil.remove(); return; }
    if (!document.body) return;
    if (!bg) { bg = document.createElement('div'); bg.id = 'decoBg'; document.body.prepend(bg); }
    if (!veil) { veil = document.createElement('div'); veil.id = 'decoVeil'; bg.after(veil); }
    bg.style.backgroundImage = `url("${u}")`;
    // 크기: 꽉 채우기(cover) / 전체 보이기(contain) / 직접 크기(화면 너비 대비 %) / 바둑판(직접 크기로 반복)
    const z = cfg.bgZoom + '%';
    bg.style.backgroundSize = cfg.bgFit === 'zoom' || cfg.bgFit === 'tile' ? `${z} auto` : cfg.bgFit;
    bg.style.backgroundRepeat = cfg.bgFit === 'tile' ? 'repeat' : 'no-repeat';
    bg.style.backgroundPosition = cfg.bgPos;
    bg.style.filter = cfg.blur ? `blur(${cfg.blur}px)` : '';
    bg.style.inset = cfg.blur ? `-${cfg.blur * 2}px` : '0';   // 흐림 가장자리가 비치지 않게 살짝 크게
    veil.style.opacity = String(cfg.veil);
    root.classList.add('deco-bg');
  }
  function applySticker(){
    const u = urls.get('sticker'); let el = document.getElementById('decoSticker');
    if (!u) { if (el) el.remove(); return; }
    if (!document.body) return;
    if (!el) { el = document.createElement('img'); el.id = 'decoSticker'; el.alt = ''; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); }
    if (el.getAttribute('src') !== u) el.src = u;
    el.className = cfg.stPos; el.style.width = el.style.height = cfg.stSize + 'px';
  }
  // 메뉴 항목: よん·れん 홈 카드(.menu .card[id] .big), 첫 화면(a.pick .badge)
  function menuItems(){
    const out = [];
    document.querySelectorAll('.menu .card[id]').forEach(c => { const b = c.querySelector('.big'); if (b) out.push({id: c.id, el: b, label: (c.querySelector('h2') || c).textContent.trim()}); });
    document.querySelectorAll('a.pick').forEach(a => { const b = a.querySelector('.badge'); const id = 'pick-' + ((a.getAttribute('href') || '').replace(/\.html?$/i, '') || 'x');
      if (b) out.push({id, el: b, label: (a.querySelector('.name') || a).textContent.trim()}); });
    return out;
  }
  function applyIcons(){
    for (const m of menuItems()) {
      const u = urls.get(iconKey(m.id)), img = m.el.querySelector('img.decoIcon');
      if (u) {
        if (!img) { if (!m.el.hasAttribute('data-deco-orig')) m.el.setAttribute('data-deco-orig', m.el.innerHTML);
          m.el.innerHTML = ''; const i = document.createElement('img'); i.className = 'decoIcon'; i.alt = ''; i.src = u; m.el.appendChild(i); }
        else if (img.getAttribute('src') !== u) img.src = u;
      } else if (img || m.el.hasAttribute('data-deco-orig')) {
        m.el.innerHTML = m.el.getAttribute('data-deco-orig') || ''; m.el.removeAttribute('data-deco-orig');
      }
    }
  }
  let cheerT = 0;
  function cheer(){
    const u = urls.get('cheer'); if (!u || !cfg.cheer || !document.body) return;
    const old = document.getElementById('decoCheer'); if (old) old.remove();
    const el = document.createElement('img'); el.id = 'decoCheer'; el.alt = ''; el.src = u; document.body.appendChild(el);
    clearTimeout(cheerT); cheerT = setTimeout(() => el.remove(), 1200);
  }
  // ---- 색: 대비 보정된 강조색 (WCAG 4.5:1) ----
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb2hex = c => '#' + c.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
  const lum = c => { const a = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  function rgb2hsl([r, g, b]){ r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l]; }
  function hsl2rgb([h, s, l]){ if (!s) return [l * 255, l * 255, l * 255];
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; }
  function cssRgb(v){   // 'var(--card)' 계산값 → [r,g,b]
    const d = document.createElement('i'); d.style.color = v; d.style.display = 'none'; (document.body || document.documentElement).appendChild(d);
    const m = (getComputedStyle(d).color.match(/\d+(\.\d+)?/g) || ['255', '255', '255']).slice(0, 3).map(Number); d.remove(); return m;
  }
  function fitAccent(hex, card){
    const dark = lum(card) < .3; let [h, s, l] = rgb2hsl(hex2rgb(hex)); s = Math.max(s, .3);
    const on = dark ? [26, 26, 30] : [255, 255, 255];
    for (let i = 0; i < 60; i++) {
      const c = hsl2rgb([h, s, l]);
      if (contrast(c, card) >= 4.6 && contrast(on, c) >= 4.5) return {c, on};
      l = Math.min(.97, Math.max(.03, l + (dark ? .015 : -.015)));
    }
    return {c: dark ? [235, 235, 235] : [40, 40, 44], on};
  }
  function applyAccent(){
    let el = document.getElementById('decoAccent');
    const base = cfg.accentMode === 'auto' ? cfg.autoAccent : cfg.accentMode === 'custom' ? cfg.accent : '';
    if (!HEX.test(base || '')) { if (el) el.remove(); return; }
    if (el) el.textContent = '';                       // 원래 테마 카드색 기준으로 계산
    const card = cssRgb('var(--card)'), {c, on} = fitAccent(base, card);
    const weak = c.map((v, i) => v * .18 + card[i] * .82);
    if (!el) { el = document.createElement('style'); el.id = 'decoAccent'; document.head.appendChild(el); }
    el.textContent = `:root:root:root{--accent:${rgb2hex(c)};--accent-weak:${rgb2hex(weak)};--on-accent:${rgb2hex(on)}}`;
  }
  // 배경 사진에서 대표색 추출 (채도·밝기 높은 색상 구간 우선)
  function extractColor(blob){
    return new Promise(res => {
      const url = URL.createObjectURL(blob), img = new Image();
      img.onload = () => {
        try {
          const n = 48, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.drawImage(img, 0, 0, n, n);
          const d = g.getImageData(0, 0, n, n).data, bins = Array.from({length: 18}, () => ({w: 0, r: 0, g: 0, b: 0}));
          let all = [0, 0, 0, 0];
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 128) continue;
            const [h, s, l] = rgb2hsl([d[i], d[i + 1], d[i + 2]]); all = [all[0] + d[i], all[1] + d[i + 1], all[2] + d[i + 2], all[3] + 1];
            if (s < .2 || l < .12 || l > .92) continue;
            const w = s * (1 - Math.abs(l - .5) * 1.4), bn = bins[Math.floor(h * 18) % 18];
            bn.w += w; bn.r += d[i] * w; bn.g += d[i + 1] * w; bn.b += d[i + 2] * w;
          }
          const best = bins.reduce((a, b) => b.w > a.w ? b : a);
          res(best.w > 2 ? rgb2hex([best.r / best.w, best.g / best.w, best.b / best.w]) : all[3] ? rgb2hex([all[0] / all[3], all[1] / all[3], all[2] / all[3]]) : '');
        } catch (e) { res(''); } finally { URL.revokeObjectURL(url); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(''); };
      img.src = url;
    });
  }
  function applyGlass(){
    const on = !!urls.get('bg') && cfg.glass > 0, r = document.documentElement;
    r.classList.toggle('deco-glass', on);
    if (on) r.style.setProperty('--dgp', Math.round((1 - cfg.glass) * 100) + '%'); else r.style.removeProperty('--dgp');
  }
  const applyAll = () => { applyBg(); applySticker(); applyIcons(); applyAccent(); applyGlass(); };

  // 화면이 다시 그려질 때 아이콘 재적용 + 정답 피드백(.fb.ok)이 나타나면 축하 이미지
  let raf = 0;
  function watch(){
    try {
      new MutationObserver(ms => {
        for (const m of ms) for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if ((n.matches && n.matches('.fb.ok')) || (n.querySelector && n.querySelector('.fb.ok'))) { cheer(); break; }
        }
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; applyIcons(); });
      }).observe(document.body, {childList: true, subtree: true});
    } catch (e) {}
  }
  async function loadAll(){
    try {
      const keys = await idbKeys();
      for (const k of keys) {
        if (k === 'bg' || k === 'sticker' || k === 'cheer' || String(k).startsWith(`icon:${APP}:`)) {
          const b = await idbGet(k); if (b instanceof Blob) setUrl(k, b);
        }
      }
    } catch (e) {}
    applyAll();
  }
  function boot(){
    watch(); loadAll();
    try { new MutationObserver(() => applyAccent()).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']}); } catch (e) {}
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyAccent()); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  // ---- 꾸미기 백업: 이미지(dataURL)+설정+테마를 JSON 한 파일로 ----
  const KEY_OK = k => /^(bg|sticker|cheer|icon:[\w.-]{1,40}:[\w.-]{1,60})$/.test(k);
  const blob2url = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
  function url2blob(u){
    const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(u || ''); if (!m) throw new Error('bad');
    const bin = atob(m[2]), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new Blob([a], {type: m[1]});
  }
  async function exportDeco(){
    const images = {};
    for (const k of await idbKeys()) { if (!KEY_OK(String(k))) continue; const b = await idbGet(k); if (b instanceof Blob) images[k] = await blob2url(b); }
    let theme = null; try { theme = JSON.parse(localStorage.getItem('n2:theme') || 'null'); } catch (e) {}
    const data = JSON.stringify({app: 'kotoba-deco', v: 1, at: new Date().toISOString(), theme, cfg, images});
    const d = new Date(), name = `kotoba-deco-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
    const file = new File([data], name, {type: 'application/json'});
    try { if (navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: name}); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'), u = URL.createObjectURL(file); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }
  async function importDeco(f){
    if (!f || f.size > 60e6) throw new Error('bad');
    const j = JSON.parse(await f.text());
    if (!j || j.app !== 'kotoba-deco' || typeof j.images !== 'object' || !j.images) throw new Error('bad');
    const pairs = Object.entries(j.images).filter(([k]) => KEY_OK(k)).map(([k, u]) => [k, url2blob(u)]);   // 먼저 전부 검사 → 하나라도 깨졌으면 아무것도 안 바꿈
    await db();
    for (const k of await idbKeys()) await idbDel(k);
    for (const [k, b] of pairs) await idbPut(k, b);
    try { localStorage.setItem(SKEY, JSON.stringify(j.cfg || {})); } catch (e) {}
    cfg = readCfg();
    if (window.THEME && (j.theme === null || THEME.list.some(t => t.id === j.theme))) { try { localStorage.setItem('n2:theme', JSON.stringify(j.theme)); } catch (e) {} THEME.apply(j.theme); }
    for (const k of [...urls.keys()]) setUrl(k, null);
    await loadAll();
  }

  // ---- 설정 시트 ----
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function open(lang){
    const L = T[lang === 'ja' ? 'ja' : 'ko'];
    const prev = document.querySelector('.thsheet'); if (prev) prev.remove();
    const el = document.createElement('div'); el.className = 'thsheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', L.t);
    const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
    let target = null, msg = '', msgOk = false;
    const jf = document.createElement('input'); jf.type = 'file'; jf.accept = 'application/json,.json'; jf.hidden = true;
    const thumb = (k, cls) => { const u = urls.get(k); return `<div class="dthumb ${cls || ''}" ${u ? `style="background-image:url('${u}')"` : ''}>${u ? '' : '·'}</div>`; };
    const btns = k => `<button class="btn" data-pick="${esc(k)}">${L.pick}</button>${urls.get(k) ? `<button class="btn" data-del="${esc(k)}">${L.del}</button>` : ''}`;
    function render(){
      const menus = menuItems();
      el.innerHTML = `<div class="panel"><div class="hd"><h2>${L.t}</h2><button class="btn" data-x style="flex:0 0 auto;min-height:40px;padding:8px 14px">${L.close}</button></div>
        <div class="dmsg ${msgOk ? 'ok' : ''}" role="status">${esc(msg)}</div>
        <div class="dsec"><h3>${L.bg}</h3>
          <div class="drow">${thumb('bg', 'wide')}<div class="dlab"></div>${btns('bg')}</div>
          ${urls.get('bg') ? `<div class="drow"><span class="dlab">${L.veil}</span><input type="range" min="0" max="0.85" step="0.05" value="${cfg.veil}" data-cfg="veil"></div>
          <div class="drow"><span class="dlab">${L.blur}</span><input type="range" min="0" max="12" step="1" value="${cfg.blur}" data-cfg="blur"></div>
          <div class="drow"><span class="dlab">${L.fit}</span><select data-cfg="bgFit">${FITS.map(f => `<option value="${f}" ${cfg.bgFit === f ? 'selected' : ''}>${L[f]}</option>`).join('')}</select></div>
          ${cfg.bgFit === 'zoom' || cfg.bgFit === 'tile' ? `<div class="drow"><span class="dlab">${L.zoomL} <small data-zoomv>${cfg.bgZoom}%</small></span><input type="range" min="20" max="400" step="5" value="${cfg.bgZoom}" data-cfg="bgZoom"></div>` : ''}
          <div class="drow"><span class="dlab">${L.glass}</span><input type="range" min="0" max="0.5" step="0.05" value="${cfg.glass}" data-cfg="glass"></div>
          ${cfg.bgFit !== 'tile' ? `<div class="drow"><span class="dlab">${L.bpos}</span><select data-cfg="bgPos">${BPOS.map(q => `<option value="${q}" ${cfg.bgPos === q ? 'selected' : ''}>${L[q]}</option>`).join('')}</select></div>` : ''}` : ''}</div>
        <div class="dsec"><h3>${L.color}</h3>
          <div class="drow"><span class="dsw" style="background:var(--accent)"></span><div class="dpills">
            <button class="pill ${cfg.accentMode === 'theme' ? 'on' : ''}" data-am="theme">${L.cTheme}</button>
            <button class="pill ${cfg.accentMode === 'auto' ? 'on' : ''}" data-am="auto" ${cfg.autoAccent ? '' : `disabled title="${L.cNoBg}"`}>${L.cAuto}${cfg.autoAccent ? ` <span class="dsw" style="display:inline-block;width:12px;height:12px;vertical-align:-1px;background:${cfg.autoAccent}"></span>` : ''}</button>
            <button class="pill ${cfg.accentMode === 'custom' ? 'on' : ''}" data-am="custom">${L.cCustom}</button></div></div>
          ${cfg.accentMode === 'custom' ? `<div class="drow"><input type="color" value="${cfg.accent}" data-cfg="accent" aria-label="${L.cCustom}"><span class="dlab"><small>${L.cNote}</small></span></div>` : `<p class="dnote" style="margin-bottom:0">${cfg.autoAccent ? L.cNote : L.cNoBg}</p>`}</div>
        <div class="dsec"><h3>${L.st}</h3>
          <div class="drow">${thumb('sticker', 'contain')}<div class="dlab"></div>${btns('sticker')}</div>
          ${urls.get('sticker') ? `<div class="drow"><span class="dlab">${L.size}</span><input type="range" min="48" max="160" step="4" value="${cfg.stSize}" data-cfg="stSize"></div>
          <div class="drow"><span class="dlab">${L.pos}</span><select data-cfg="stPos">${['br', 'bl', 'tr'].map(p => `<option value="${p}" ${cfg.stPos === p ? 'selected' : ''}>${L[p]}</option>`).join('')}</select></div>` : ''}</div>
        <div class="dsec"><h3>${L.cheer}</h3>
          <div class="drow">${thumb('cheer', 'contain')}<div class="dlab"></div>${btns('cheer')}</div>
          ${urls.get('cheer') ? `<div class="drow"><label class="dlab"><input type="checkbox" data-cfg="cheer" ${cfg.cheer ? 'checked' : ''}> ${L.cheerOn}</label><button class="btn" data-test>${L.test}</button></div>` : ''}</div>
        <div class="dsec"><h3>${L.icons}</h3>
          ${menus.length ? menus.map(m => { const k = iconKey(m.id); return `<div class="drow">${urls.get(k) ? thumb(k) : `<div class="dthumb">${esc(m.el.getAttribute('data-deco-orig') ? '' : m.el.textContent.trim().slice(0, 2))}</div>`}<span class="dlab">${esc(m.label)}</span>${btns(k)}</div>`; }).join('')
            : `<p class="dnote">${L.noMenu}</p>`}</div>
        <div class="dsec"><h3>${L.bk}</h3><p class="dnote" style="margin-top:0">${L.bkNote}</p>
          <div class="drow"><button class="btn" data-bkout>${L.bkOut}</button><button class="btn" data-bkin>${L.bkIn}</button></div></div>
        <p class="dnote">${L.note}</p>
        <div class="drow" style="justify-content:center;margin-bottom:6px"><button class="btn" data-reset>${L.reset}</button></div></div>`;
    }
    const close = () => { document.removeEventListener('keydown', onKey, true); el.remove(); file.remove(); jf.remove(); };
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; } if (e.key !== 'Tab') e.stopPropagation(); };
    const kindOf = k => k.startsWith('icon:') ? 'icon' : k;
    file.onchange = async () => {
      const f = file.files && file.files[0]; file.value = ''; if (!f || !target) return;
      const k = target; msg = L.saving; msgOk = false; render();
      try {
        const b = await shrink(f, KIND[kindOf(k)]);
        await idbPut(k, b); setUrl(k, b); msg = '';
        if (k === 'bg') { const c = await extractColor(b); cfg.autoAccent = HEX.test(c) ? c : ''; saveCfg(); }
      } catch (e) { msg = e && e.message === 'big' ? L.big : (e && e.message === 'noDb') || !window.indexedDB ? L.noDb : L.fail; }
      applyAll(); render();
    };
    el.addEventListener('click', async e => {
      const t = e.target;
      if (t === el || t.closest('[data-x]')) { close(); return; }
      const p = t.closest('[data-pick]'); if (p) { target = p.dataset.pick; file.click(); return; }
      const d = t.closest('[data-del]');
      if (d) { const k = d.dataset.del; try { await idbDel(k); } catch (err) {} setUrl(k, null); applyAll(); render(); return; }
      if (t.closest('[data-test]')) { cheer(); return; }
      const am = t.closest('[data-am]');
      if (am && !am.disabled) { cfg.accentMode = am.dataset.am; saveCfg(); applyAccent(); render(); return; }
      if (t.closest('[data-bkout]')) { msg = L.saving; msgOk = false; render(); try { await exportDeco(); msg = L.bkOk; msgOk = true; } catch (err) { msg = L.fail; } render(); return; }
      if (t.closest('[data-bkin]')) { jf.click(); return; }
      if (t.closest('[data-reset]')) {
        if (!confirm(L.resetQ)) return;
        for (const k of [...urls.keys()]) { try { await idbDel(k); } catch (err) {} setUrl(k, null); }
        try { const keys = await idbKeys(); for (const k of keys) await idbDel(k); } catch (err) {}   // 다른 화면의 아이콘까지
        cfg = {...DEF}; saveCfg(); applyAll(); render();
      }
    });
    el.addEventListener('input', e => {
      const c = e.target.dataset && e.target.dataset.cfg; if (!c) return;
      if (c === 'veil') cfg.veil = num(e.target.value, 0, 0.85, DEF.veil);
      else if (c === 'blur') cfg.blur = num(e.target.value, 0, 12, 0);
      else if (c === 'stSize') cfg.stSize = num(e.target.value, 48, 160, DEF.stSize);
      else if (c === 'glass') { cfg.glass = num(e.target.value, 0, 0.5, 0); saveCfg(); applyGlass(); return; }
      else if (c === 'accent') { if (HEX.test(e.target.value)) { cfg.accent = e.target.value; saveCfg(); applyAccent(); } return; }
      else if (c === 'bgZoom') { cfg.bgZoom = num(e.target.value, 20, 400, DEF.bgZoom); const v = el.querySelector('[data-zoomv]'); if (v) v.textContent = cfg.bgZoom + '%'; }
      else return;
      saveCfg(); applyBg(); applySticker();
    });
    el.addEventListener('change', e => {
      const c = e.target.dataset && e.target.dataset.cfg;
      if (c === 'stPos') { cfg.stPos = ['br', 'bl', 'tr'].includes(e.target.value) ? e.target.value : 'br'; saveCfg(); applySticker(); }
      else if (c === 'cheer') { cfg.cheer = !!e.target.checked; saveCfg(); }
      else if (c === 'bgFit') { cfg.bgFit = FITS.includes(e.target.value) ? e.target.value : 'cover'; saveCfg(); applyBg(); render(); const f = el.querySelector('[data-cfg="bgFit"]'); if (f) f.focus(); }
      else if (c === 'bgPos') { cfg.bgPos = BPOS.includes(e.target.value) ? e.target.value : 'center'; saveCfg(); applyBg(); }
    });
    jf.onchange = async () => {
      const f = jf.files && jf.files[0]; jf.value = ''; if (!f) return;
      msg = L.saving; msgOk = false; render();
      try { await importDeco(f); msg = L.bkDone; msgOk = true; } catch (err) { msg = err && err.message === 'noDb' ? L.noDb : L.bkBad; }
      render();
    };
    document.addEventListener('keydown', onKey, true);
    render(); document.body.appendChild(el); document.body.appendChild(file); document.body.appendChild(jf);
    const first = el.querySelector('[data-pick]'); if (first) first.focus();
  }
  window.DECO = {open, apply: applyAll};
})();

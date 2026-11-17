// ---------- 내 이미지 꾸미기 (첫 화면·よん·れん 공통) ----------
// 이미지: IndexedDB 'n2-deco'(기기 안에만 저장, 백업 파일에는 포함되지 않음). 설정값: localStorage 'n2:deco'.
// 1) 메뉴 아이콘 바꾸기  2) 배경 이미지(가림 정도·흐림)  3) 스티커(화면 구석 마스코트)  4) 정답 축하 이미지
(function(){
  if (window.DECO) return;
  const APP = ((location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/i, '') || 'index');
  const SKEY = 'n2:deco';
  const DEF = {veil: 0.35, blur: 0, stPos: 'br', stSize: 80, cheer: true, bgFit: 'cover', bgZoom: 100, bgPos: 'center'};
  const FITS = ['cover', 'contain', 'zoom', 'tile'], BPOS = ['center', 'top', 'bottom', 'left', 'right'];
  const T = {
    ko: {t: '내 이미지 꾸미기', close: '닫기', bg: '배경 이미지', veil: '가림 정도 (글자 잘 보이게)', blur: '배경 흐림', st: '스티커 (화면 구석)', size: '크기',
      pos: '위치', br: '오른쪽 아래', bl: '왼쪽 아래', tr: '오른쪽 위', cheer: '정답 축하 이미지', cheerOn: '정답일 때 보여 주기', icons: '메뉴 아이콘',
      pick: '사진 선택', del: '삭제', none: '없음', reset: '꾸미기 전부 지우기', resetQ: '배경·스티커·아이콘 이미지를 모두 지울까요?',
      noMenu: '홈 화면(메뉴가 보이는 화면)에서 열면 메뉴 아이콘을 바꿀 수 있어요.', note: '이미지는 이 기기에만 저장되며 학습 기록 백업 파일에는 포함되지 않습니다.',
      fail: '이미지를 불러오지 못했습니다. 다른 사진으로 시도해 주세요.', big: '파일이 너무 큽니다(30MB 이하).', noDb: '이 브라우저에서는 이미지를 저장할 수 없습니다(개인정보 보호 모드 등).',
      saving: '저장 중…', test: '미리 보기', fit: '크기 맞춤', cover: '화면 꽉 채우기', contain: '전체 보이기', zoom: '직접 크기 조절', tile: '바둑판 반복',
      zoomL: '크기', bpos: '위치', center: '가운데', top: '위', bottom: '아래', left: '왼쪽', right: '오른쪽'},
    ja: {t: 'マイ画像でデコる', close: '閉じる', bg: '背景画像', veil: 'ぼかし幕の濃さ（文字を読みやすく）', blur: '背景のぼかし', st: 'ステッカー（画面のすみ）', size: '大きさ',
      pos: '位置', br: '右下', bl: '左下', tr: '右上', cheer: '正解のごほうび画像', cheerOn: '正解したときに表示', icons: 'メニューのアイコン',
      pick: '写真を選ぶ', del: '削除', none: 'なし', reset: 'デコをすべて消す', resetQ: '背景・ステッカー・アイコンの画像をすべて消しますか？',
      noMenu: 'ホーム画面（メニューが見える画面）で開くと、メニューのアイコンを変えられます。', note: '画像はこの端末にだけ保存され、学習記録のバックアップには含まれません。',
      fail: '画像を読み込めませんでした。別の写真でお試しください。', big: 'ファイルが大きすぎます（30MBまで）。', noDb: 'このブラウザでは画像を保存できません（プライベートモードなど）。',
      saving: '保存中…', test: 'プレビュー', fit: 'サイズの合わせ方', cover: '画面いっぱい', contain: '全体を表示', zoom: 'サイズを自分で調整', tile: 'タイル状にくり返す',
      zoomL: '大きさ', bpos: '位置', center: '中央', top: '上', bottom: '下', left: '左', right: '右'}
  };

  // ---- 설정 ----
  const num = (v, lo, hi, d) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
  function readCfg(){
    let c = {}; try { c = JSON.parse(localStorage.getItem(SKEY) || '{}') || {}; } catch (e) { c = {}; }
    return {veil: num(c.veil, 0, 0.85, DEF.veil), blur: num(c.blur, 0, 12, DEF.blur), stSize: num(c.stSize, 48, 160, DEF.stSize),
      stPos: ['br', 'bl', 'tr'].includes(c.stPos) ? c.stPos : DEF.stPos, cheer: c.cheer !== false,
      bgFit: FITS.includes(c.bgFit) ? c.bgFit : DEF.bgFit, bgZoom: num(c.bgZoom, 20, 400, DEF.bgZoom), bgPos: BPOS.includes(c.bgPos) ? c.bgPos : DEF.bgPos};
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
  const applyAll = () => { applyBg(); applySticker(); applyIcons(); };

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
  function boot(){ watch(); loadAll(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  // ---- 설정 시트 ----
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function open(lang){
    const L = T[lang === 'ja' ? 'ja' : 'ko'];
    const prev = document.querySelector('.thsheet'); if (prev) prev.remove();
    const el = document.createElement('div'); el.className = 'thsheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', L.t);
    const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
    let target = null, msg = '';
    const thumb = (k, cls) => { const u = urls.get(k); return `<div class="dthumb ${cls || ''}" ${u ? `style="background-image:url('${u}')"` : ''}>${u ? '' : '·'}</div>`; };
    const btns = k => `<button class="btn" data-pick="${esc(k)}">${L.pick}</button>${urls.get(k) ? `<button class="btn" data-del="${esc(k)}">${L.del}</button>` : ''}`;
    function render(){
      const menus = menuItems();
      el.innerHTML = `<div class="panel"><div class="hd"><h2>${L.t}</h2><button class="btn" data-x style="flex:0 0 auto;min-height:40px;padding:8px 14px">${L.close}</button></div>
        <div class="dmsg" role="status">${esc(msg)}</div>
        <div class="dsec"><h3>${L.bg}</h3>
          <div class="drow">${thumb('bg', 'wide')}<div class="dlab"></div>${btns('bg')}</div>
          ${urls.get('bg') ? `<div class="drow"><span class="dlab">${L.veil}</span><input type="range" min="0" max="0.85" step="0.05" value="${cfg.veil}" data-cfg="veil"></div>
          <div class="drow"><span class="dlab">${L.blur}</span><input type="range" min="0" max="12" step="1" value="${cfg.blur}" data-cfg="blur"></div>
          <div class="drow"><span class="dlab">${L.fit}</span><select data-cfg="bgFit">${FITS.map(f => `<option value="${f}" ${cfg.bgFit === f ? 'selected' : ''}>${L[f]}</option>`).join('')}</select></div>
          ${cfg.bgFit === 'zoom' || cfg.bgFit === 'tile' ? `<div class="drow"><span class="dlab">${L.zoomL} <small data-zoomv>${cfg.bgZoom}%</small></span><input type="range" min="20" max="400" step="5" value="${cfg.bgZoom}" data-cfg="bgZoom"></div>` : ''}
          ${cfg.bgFit !== 'tile' ? `<div class="drow"><span class="dlab">${L.bpos}</span><select data-cfg="bgPos">${BPOS.map(q => `<option value="${q}" ${cfg.bgPos === q ? 'selected' : ''}>${L[q]}</option>`).join('')}</select></div>` : ''}` : ''}</div>
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
        <p class="dnote">${L.note}</p>
        <div class="drow" style="justify-content:center;margin-bottom:6px"><button class="btn" data-reset>${L.reset}</button></div></div>`;
    }
    const close = () => { document.removeEventListener('keydown', onKey, true); el.remove(); file.remove(); };
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; } if (e.key !== 'Tab') e.stopPropagation(); };
    const kindOf = k => k.startsWith('icon:') ? 'icon' : k;
    file.onchange = async () => {
      const f = file.files && file.files[0]; file.value = ''; if (!f || !target) return;
      const k = target; msg = L.saving; render();
      try {
        const b = await shrink(f, KIND[kindOf(k)]);
        await idbPut(k, b); setUrl(k, b); msg = '';
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
    document.addEventListener('keydown', onKey, true);
    render(); document.body.appendChild(el); document.body.appendChild(file);
    const first = el.querySelector('[data-pick]'); if (first) first.focus();
  }
  window.DECO = {open, apply: applyAll};
})();

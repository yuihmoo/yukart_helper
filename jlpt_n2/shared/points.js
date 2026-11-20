// ---------- 포인트 · 포인트 상점 (よん·れん 공통) ----------
// 지갑은 앱별로 따로: よん(메인·기출 공통) 'n2m:pts', れん 'ren:pts' → 학습 기록 백업(backup.js)에 함께 포함됨.
// 적립: 외웠어요 +5(취소 시 -5) · 퀴즈 정답 +1 / 오답 -3 · 복습 퀴즈 30문제 완주 보너스 +10
// 상점: 상품은 사용자가 직접 추가·수정·삭제·순서 변경. 교환한 상품은 '쿠폰'으로 남고 사용 완료 표시 가능.
(function(){
  if (window.PTS) return;
  const RULE = {memo: 5, ok: 1, ng: -3, bonus: 10, bonusN: 30};
  const LOG_MAX = 300, ITEM_MAX = 60, BUY_MAX = 300, NAME_MAX = 40, COST_MAX = 1000000;
  const T = {
    ko: {pt: 'P', bal: '보유 포인트', shop: '포인트 상점', rules: '적립 규칙',
      ruleTxt: `외웠어요 체크 +${RULE.memo}P (체크 취소 시 -${RULE.memo}P)<br>퀴즈 정답 +${RULE.ok}P · 오답 ${RULE.ng}P<br>복습 퀴즈 ${RULE.bonusN}문제 완주 시 보너스 +${RULE.bonus}P`,
      items: '상품', empty: '아직 상품이 없어요. 아래 「상점 설정」에서 함께 정한 상품을 추가해 보세요.', buy: '교환', short: 'P 부족',
      buyQ: (n, c) => `「${n}」을(를) ${c}P로 교환할까요?`, bought: n => `「${n}」 교환 완료! 쿠폰함에 저장했어요.`,
      coupons: '내 쿠폰함', noCoupon: '교환한 쿠폰이 없어요.', use: '사용 완료', used: '사용함', unuse: '되돌리기', del: '삭제', delQ: '이 쿠폰을 삭제할까요? (포인트는 돌아오지 않아요)',
      log: '포인트 내역', noLog: '아직 내역이 없어요.', more: '더 보기',
      set: '상점 설정', setDone: '설정 닫기', add: '상품 추가', name: '상품 이름', cost: '필요 포인트', emoji: '아이콘', save: '저장',
      itemDelQ: n => `상품 「${n}」을(를) 삭제할까요? (이미 교환한 쿠폰은 그대로 남아요)`, up: '위로', down: '아래로', edit: '수정', cancel: '취소',
      bad: '상품 이름과 포인트(1 이상 숫자)를 입력해 주세요.', full: `상품은 최대 ${ITEM_MAX}개까지 만들 수 있어요.`,
      adj: '포인트 직접 조정', adjNote: '함께 정한 보너스·벌점을 직접 더하거나 뺄 수 있어요.', adjAmt: '+10 또는 -5', adjWhy: '사유 (선택)', adjBtn: '적용', adjBad: '0이 아닌 숫자를 입력해 주세요.',
      res: '이번 퀴즈', has: '보유',
      r: {memo: '외웠어요', unmemo: '외웠어요 취소', ok: '정답', ng: '오답', bonus: '복습 30문제 완주 보너스', buy: '교환', adj: '직접 조정'}},
    ja: {pt: 'P', bal: '所持ポイント', shop: 'ポイントショップ', rules: 'ポイントのルール',
      ruleTxt: `「覚えた」チェック +${RULE.memo}P（取り消すと -${RULE.memo}P）<br>クイズ正解 +${RULE.ok}P · 不正解 ${RULE.ng}P<br>復習クイズ ${RULE.bonusN}問を最後まで解くとボーナス +${RULE.bonus}P`,
      items: '商品', empty: 'まだ商品がありません。下の「ショップ設定」で、ふたりで決めた商品を追加しましょう。', buy: '交換', short: 'P不足',
      buyQ: (n, c) => `「${n}」を ${c}P で交換しますか？`, bought: n => `「${n}」を交換しました！クーポン箱に保存しました。`,
      coupons: 'マイクーポン箱', noCoupon: '交換したクーポンはありません。', use: '使用済みにする', used: '使用済み', unuse: '戻す', del: '削除', delQ: 'このクーポンを削除しますか？（ポイントは戻りません）',
      log: 'ポイント履歴', noLog: 'まだ履歴がありません。', more: 'もっと見る',
      set: 'ショップ設定', setDone: '設定を閉じる', add: '商品を追加', name: '商品名', cost: '必要ポイント', emoji: 'アイコン', save: '保存',
      itemDelQ: n => `商品「${n}」を削除しますか？（交換済みのクーポンはそのまま残ります）`, up: '上へ', down: '下へ', edit: '編集', cancel: 'キャンセル',
      bad: '商品名とポイント（1以上の数字）を入力してください。', full: `商品は最大 ${ITEM_MAX} 個まで作れます。`,
      adj: 'ポイントを直接調整', adjNote: 'ふたりで決めたボーナスやペナルティを直接足したり引いたりできます。', adjAmt: '+10 や -5', adjWhy: '理由（任意）', adjBtn: '適用', adjBad: '0以外の数字を入力してください。',
      res: '今回', has: '所持',
      r: {memo: '覚えた', unmemo: '覚えたを取り消し', ok: '正解', ng: '不正解', bonus: '復習30問クリアボーナス', buy: '交換', adj: '直接調整'}}
  };
  let NS = 'n2m', L = T.ko;
  const ls = {
    get(k, d){ try { const v = localStorage.getItem(NS + ':' + k); if (v == null) return d; const j = JSON.parse(v); return j == null ? d : j; } catch (e) { return d; } },
    set(k, v){ try { localStorage.setItem(NS + ':' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const int = v => { v = Math.round(+v); return isFinite(v) ? v : 0; };
  const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  // 저장값 검증 (백업 복원·직접 편집으로 깨진 값이 들어와도 화면이 죽지 않게)
  function wallet(){
    const w = ls.get('pts', {}); const log = Array.isArray(w.log) ? w.log.filter(x => x && typeof x === 'object').slice(-LOG_MAX) : [];
    return {bal: int(w.bal), log: log.map(x => ({t: int(x.t), d: int(x.d), r: str(x.r, 60)}))};
  }
  function items(){
    const a = ls.get('shop', []); if (!Array.isArray(a)) return [];
    const seen = new Set();
    return a.filter(x => x && typeof x === 'object').map(x => ({id: str(x.id, 20), name: str(x.name, NAME_MAX), cost: Math.min(COST_MAX, Math.max(1, int(x.cost))), emoji: str(x.emoji, 8)}))
      .filter(x => x.id && x.name && !seen.has(x.id) && seen.add(x.id)).slice(0, ITEM_MAX);
  }
  function buys(){
    const a = ls.get('buys', []); if (!Array.isArray(a)) return [];
    return a.filter(x => x && typeof x === 'object').map(x => ({id: str(x.id, 20), name: str(x.name, NAME_MAX), cost: int(x.cost), emoji: str(x.emoji, 8), t: int(x.t), used: int(x.used)}))
      .filter(x => x.id && x.name).slice(-BUY_MAX);
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---- 적립/차감 ----
  function add(d, reason){
    d = int(d); if (!d) return 0;
    const w = wallet(); w.bal += d; w.log.push({t: Date.now(), d, r: str(reason, 60)});
    if (w.log.length > LOG_MAX) w.log = w.log.slice(-LOG_MAX);
    ls.set('pts', w); toast(d); refresh();
    return d;
  }
  let tt = 0, acc = 0;
  function toast(d){
    if (!document.body) return;
    let el = document.getElementById('ptsToast');
    if (!el) { el = document.createElement('div'); el.id = 'ptsToast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); acc = 0; }
    acc += d;
    el.className = acc >= 0 ? 'up' : 'down';
    el.textContent = `${acc > 0 ? '+' : ''}${acc}${L.pt} · ${L.bal} ${wallet().bal}${L.pt}`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => { el.classList.remove('show'); acc = 0; }, 1600);
  }
  // 화면에 떠 있는 잔액 표시(data-pts-bal)를 갱신
  function refresh(){ const b = wallet().bal; document.querySelectorAll('[data-pts-bal]').forEach(e => { e.textContent = b; e.classList.toggle('neg', b < 0); }); }

  const api = {
    RULE,
    init(o){ NS = /^[\w-]{1,10}$/.test(o && o.ns) ? o.ns : 'n2m'; L = T[o && o.lang === 'ja' ? 'ja' : 'ko']; injectCss(); },
    bal: () => wallet().bal,
    add,
    // 외웠어요 체크/취소 (on=true: 체크)
    memo(on, what){ return add(on ? RULE.memo : -RULE.memo, (on ? L.r.memo : L.r.unmemo) + (what ? ' · ' + what : '')); },
    // 퀴즈 1문항 채점 결과
    quiz(ok, what){ return add(ok ? RULE.ok : RULE.ng, (ok ? L.r.ok : L.r.ng) + (what ? ' · ' + what : '')); },
    // 복습 퀴즈 완주: 30문제 이상 세트를 끝까지 풀었을 때만 보너스
    reviewDone(n){ return n >= RULE.bonusN ? add(RULE.bonus, L.r.bonus) : 0; },
    // 퀴즈 결과 화면용 한 줄: 이번 세트 증감 + 현재 잔액
    resLine(p){ p = int(p); const b = wallet().bal; return `<div class="ptsres">${L.res} <b class="${p < 0 ? 'neg' : 'pos'}">${p > 0 ? '+' : ''}${p}${L.pt}</b> · ${L.has} <b data-pts-bal class="${b < 0 ? 'neg' : ''}">${b}</b>${L.pt}</div>`; },
    screen
  };

  // ---- 상점 화면 ----
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function fmtT(t){ const d = new Date(t); return isFinite(d) ? `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''; }
  let setMode = false, editId = null, logN = 20, msg = '';
  function screen(host){
    setMode = false; editId = null; logN = 20; msg = '';
    // 이벤트는 상점 전용 래퍼에만 연결 (공용 view에 걸면 다른 화면의 폼·버튼까지 가로챔)
    host.innerHTML = '<div class="pts-wrap"></div>'; const view = host.firstChild;
    const render = () => {
      const w = wallet(), its = items(), bs = buys().slice().reverse();
      view.innerHTML = `
        <div class="card pts-bal"><span>${L.bal}</span><b data-pts-bal class="${w.bal < 0 ? 'neg' : ''}">${w.bal}</b><span>${L.pt}</span></div>
        <div class="pts-msg" role="status">${esc(msg)}</div>
        <h2 class="sub">${L.items}</h2>
        ${its.length ? `<div class="pts-items">${its.map(x => `<div class="card pts-item"><div class="pts-em">${esc(x.emoji || '🎁')}</div>
            <div class="pts-nm"><b>${esc(x.name)}</b><span>${x.cost}${L.pt}</span></div>
            <button class="btn primary" data-buy="${esc(x.id)}" ${w.bal >= x.cost ? '' : 'disabled'}>${w.bal >= x.cost ? L.buy : L.short}</button></div>`).join('')}</div>`
          : `<p class="note">${L.empty}</p>`}
        <h2 class="sub">${L.coupons}</h2>
        ${bs.length ? `<div class="pts-items">${bs.map(x => `<div class="card pts-item ${x.used ? 'used' : ''}"><div class="pts-em">${esc(x.emoji || '🎟️')}</div>
            <div class="pts-nm"><b>${esc(x.name)}</b><span>${fmtT(x.t)} · ${x.cost}${L.pt}${x.used ? ` · ${L.used} ${fmtT(x.used)}` : ''}</span></div>
            <button class="btn" data-use="${esc(x.id)}">${x.used ? L.unuse : L.use}</button><button class="btn pts-x" data-cdel="${esc(x.id)}" aria-label="${L.del}">✕</button></div>`).join('')}</div>`
          : `<p class="note">${L.noCoupon}</p>`}
        <details class="pts-det"><summary>${L.log}</summary>
          ${w.log.length ? `<div class="pts-log">${w.log.slice().reverse().slice(0, logN).map(x => `<div><span>${fmtT(x.t)}</span><span>${esc(x.r)}</span><b class="${x.d < 0 ? 'neg' : 'pos'}">${x.d > 0 ? '+' : ''}${x.d}</b></div>`).join('')}</div>
            ${w.log.length > logN ? `<button class="linkbtn" data-more type="button">${L.more}</button>` : ''}` : `<p class="note">${L.noLog}</p>`}</details>
        <details class="pts-det"><summary>${L.rules}</summary><p class="note" style="margin:8px 0 0">${L.ruleTxt}</p></details>
        <div class="nav2"><button class="btn" data-set>${setMode ? L.setDone : '⚙️ ' + L.set}</button></div>
        ${setMode ? settings(its) : ''}`;
      if (logN > 20) { const d = view.querySelector('.pts-det'); if (d) d.open = true; }
    };
    const settings = its => `<div class="card pts-set">
        <h3>${L.set}</h3>
        ${its.map((x, i) => editId === x.id ? `<form class="pts-form" data-edit="${esc(x.id)}">${fields(x)}<div class="pts-row"><button class="btn primary">${L.save}</button><button class="btn" type="button" data-cancel>${L.cancel}</button></div></form>`
          : `<div class="pts-srow"><span class="pts-em">${esc(x.emoji || '🎁')}</span><span class="pts-snm">${esc(x.name)} <small>${x.cost}${L.pt}</small></span>
            <button class="btn pts-sm" data-mv="${i}" data-d="-1" aria-label="${L.up}" ${i ? '' : 'disabled'}>▲</button><button class="btn pts-sm" data-mv="${i}" data-d="1" aria-label="${L.down}" ${i < its.length - 1 ? '' : 'disabled'}>▼</button>
            <button class="btn pts-sm" data-ed="${esc(x.id)}">${L.edit}</button><button class="btn pts-sm" data-idel="${esc(x.id)}" aria-label="${L.del}">✕</button></div>`).join('')}
        <h3>${L.add}</h3>
        <form class="pts-form" data-new>${fields({emoji: '', name: '', cost: ''})}<div class="pts-row"><button class="btn primary">${L.add}</button></div></form>
        <h3>${L.adj}</h3><p class="note" style="margin:0 0 8px">${L.adjNote}</p>
        <form class="pts-form" data-adj><div class="pts-row"><input name="amt" inputmode="numeric" placeholder="${L.adjAmt}" aria-label="${L.adjAmt}" style="flex:0 0 110px">
          <input name="why" maxlength="${NAME_MAX}" placeholder="${L.adjWhy}" aria-label="${L.adjWhy}"><button class="btn">${L.adjBtn}</button></div></form></div>`;
    const fields = x => `<div class="pts-row"><input name="emoji" maxlength="8" value="${esc(x.emoji)}" placeholder="🎁" aria-label="${L.emoji}" style="flex:0 0 56px;text-align:center">
        <input name="name" maxlength="${NAME_MAX}" value="${esc(x.name)}" placeholder="${L.name}" aria-label="${L.name}" required>
        <input name="cost" inputmode="numeric" value="${esc(x.cost)}" placeholder="${L.cost}" aria-label="${L.cost}" style="flex:0 0 90px" required></div>`;
    const readForm = f => {
      const name = str(f.name.value, NAME_MAX), cost = int(String(f.cost.value).replace(/[^\d]/g, '')), emoji = str(f.emoji.value, 8);
      return name && cost >= 1 && cost <= COST_MAX ? {name, cost, emoji} : null;
    };
    view.onclick = e => {
      const t = e.target, b = s => t.closest(s);
      let x;
      if ((x = b('[data-buy]')) && !x.disabled) {
        const it = items().find(i => i.id === x.dataset.buy); if (!it) return;
        if (wallet().bal < it.cost) { render(); return; }
        if (!confirm(L.buyQ(it.name, it.cost))) return;
        add(-it.cost, L.r.buy + ' · ' + it.name);
        const a = buys(); a.push({id: uid(), name: it.name, cost: it.cost, emoji: it.emoji, t: Date.now(), used: 0}); ls.set('buys', a.slice(-BUY_MAX));
        msg = L.bought(it.name); render(); return;
      }
      if ((x = b('[data-use]'))) { const a = buys(), c = a.find(i => i.id === x.dataset.use); if (c) { c.used = c.used ? 0 : Date.now(); ls.set('buys', a); } msg = ''; render(); return; }
      if ((x = b('[data-cdel]'))) { if (!confirm(L.delQ)) return; ls.set('buys', buys().filter(i => i.id !== x.dataset.cdel)); msg = ''; render(); return; }
      if (b('[data-more]')) { logN += 50; render(); return; }
      if (b('[data-set]')) { setMode = !setMode; editId = null; msg = ''; render(); if (setMode) { const s = view.querySelector('.pts-set'); if (s) s.scrollIntoView({block: 'start', behavior: 'smooth'}); } return; }
      if ((x = b('[data-mv]')) && !x.disabled) {
        const a = items(), i = +x.dataset.mv, j = i + (+x.dataset.d);
        if (i < 0 || j < 0 || i >= a.length || j >= a.length) return;
        [a[i], a[j]] = [a[j], a[i]]; ls.set('shop', a); render();
        const f = view.querySelector(`[data-mv="${j}"][data-d="${x.dataset.d}"]`) || view.querySelector(`[data-mv="${j}"]`); if (f) f.focus();
        return;
      }
      if ((x = b('[data-ed]'))) { editId = x.dataset.ed; render(); const f = view.querySelector('[data-edit] input[name="name"]'); if (f) f.focus(); return; }
      if (b('[data-cancel]')) { editId = null; render(); return; }
      if ((x = b('[data-idel]'))) { const it = items().find(i => i.id === x.dataset.idel); if (!it || !confirm(L.itemDelQ(it.name))) return; ls.set('shop', items().filter(i => i.id !== it.id)); render(); }
    };
    view.onsubmit = e => {
      const f = e.target; e.preventDefault();
      if (f.matches('[data-adj]')) {
        const d = int(String(f.amt.value).replace(/[^\d+-]/g, '').replace(/(?!^)[+-]/g, ''));
        if (!d || Math.abs(d) > COST_MAX) { msg = L.adjBad; render(); return; }
        add(d, L.r.adj + (str(f.why.value, NAME_MAX) ? ' · ' + str(f.why.value, NAME_MAX) : '')); msg = ''; render(); return;
      }
      const v = readForm(f); if (!v) { msg = L.bad; render(); return; }
      const a = items();
      if (f.matches('[data-new]')) { if (a.length >= ITEM_MAX) { msg = L.full; render(); return; } a.push({id: uid(), ...v}); }
      else if (f.matches('[data-edit]')) { const it = a.find(i => i.id === f.dataset.edit); if (it) Object.assign(it, v); editId = null; }
      ls.set('shop', a); msg = ''; render();
      if (f.matches('[data-new]')) { const n = view.querySelector('[data-new] input[name="name"]'); if (n) n.focus(); }
    };
    render();
  }

  function injectCss(){
    if (document.getElementById('ptsCss')) return;
    const s = document.createElement('style'); s.id = 'ptsCss';
    s.textContent = `
#ptsToast{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);transform:translate(-50%,-12px);opacity:0;z-index:60;pointer-events:none;
  padding:8px 16px;border-radius:999px;font-weight:700;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.18);transition:opacity .2s,transform .25s;white-space:nowrap;
  background:var(--card);color:var(--ink);border:1px solid var(--line)}
#ptsToast.up{color:var(--ok,#2a8a4a)}#ptsToast.down{color:var(--ng,#c0392b)}
#ptsToast.show{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){#ptsToast{transition:none}}
.pts-bal{display:flex;align-items:baseline;justify-content:center;gap:8px;padding:20px;font-size:15px;color:var(--sub)}
.pts-bal b{font-size:40px;color:var(--accent);font-variant-numeric:tabular-nums}
.pts-bal b.neg,[data-pts-bal].neg,.pts-log .neg{color:var(--ng,#c0392b)}
.pts-log .pos,.ptsres .pos{color:var(--ok,#2a8a4a)}.ptsres .neg{color:var(--ng,#c0392b)}
.ptsres{margin-top:8px;color:var(--sub);font-size:14px}
.pts-msg{min-height:1.2em;text-align:center;color:var(--accent);font-size:14px;margin:6px 0}
.pts-items{display:grid;gap:8px}
.pts-item{display:flex;align-items:center;gap:12px;padding:12px 14px}
.pts-item.used{opacity:.55}
.pts-em{font-size:26px;width:36px;text-align:center;flex:0 0 auto}
.pts-nm{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
.pts-nm b{overflow-wrap:anywhere}.pts-nm span{color:var(--sub);font-size:13px}
.pts-item .btn{flex:0 0 auto;min-height:40px;padding:8px 12px}
.pts-item .btn:disabled{opacity:.5}
.pts-x{min-width:40px}
.pts-det{margin-top:14px}.pts-det summary{cursor:pointer;font-weight:700;padding:6px 0}
.pts-log{display:grid;gap:4px;font-size:13px;margin-top:6px}
.pts-log div{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)}
.pts-log div span:first-child{color:var(--sub);flex:0 0 78px}.pts-log div span:nth-child(2){flex:1 1 auto;min-width:0;overflow-wrap:anywhere}
.pts-log b{flex:0 0 auto;font-variant-numeric:tabular-nums}
.pts-set{padding:16px;margin-top:12px}.pts-set h3{font-size:15px;margin:14px 0 8px}.pts-set h3:first-child{margin-top:0}
.pts-srow{display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--line)}
.pts-snm{flex:1 1 auto;min-width:0;overflow-wrap:anywhere}.pts-snm small{color:var(--sub)}
.pts-sm{flex:0 0 auto;min-width:40px;min-height:38px;padding:6px 8px}.pts-sm:disabled{opacity:.35}
.pts-form{margin:6px 0}.pts-row{display:flex;gap:6px;align-items:center}.pts-row+.pts-row{margin-top:6px}
.pts-row input{flex:1 1 auto;min-width:0;font:inherit;font-size:16px;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--chip);color:var(--ink)}
.pts-row .btn{flex:0 0 auto}`;
    (document.head || document.documentElement).appendChild(s);
  }
  window.PTS = api;
})();

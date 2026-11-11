// ---------- 음성(TTS) 공통 모듈: よん·れん 빌드 시 주입 ----------
// iOS 사파리 주의점
//  1) speak()는 사용자 터치 처리 중에 "동기적으로" 호출해야 함. Promise/setTimeout을 거치면 무음이 될 수 있음.
//  2) getVoices()는 처음엔 빈 배열일 수 있고, OS 업데이트 직후엔 한참 뒤에 채워지기도 함 → 매번 새로 읽고 voiceschanged를 계속 구독.
//  3) 저장해 둔 음성이 사라졌거나(업데이트로 URI 변경) 재생에 실패하면 기본 음성(lang만 지정)으로 자동 재시도.
// 고품질(Premium/Enhanced/Siri) 음성이 웹에 노출되는지는 iOS 버전에 따라 다름 → 목록에서 직접 고를 수 있게 함.
function makeTTS(opt){
  // opt: {lang:'ja-JP', store, T:{...문구}}
  const prefix = opt.lang.slice(0, 2).toLowerCase();
  const T = opt.T;
  const has = () => { try { return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function'; } catch(e) { return false; } };
  let all = [], voices = [];
  const norm = l => String(l || '').replace('_', '-').toLowerCase();
  function refresh(){
    try { all = has() ? (speechSynthesis.getVoices() || []) : []; } catch(e) { all = []; }
    voices = all.filter(v => norm(v.lang).startsWith(prefix));
    return voices;
  }
  const listeners = new Set();
  if (has()) {
    const onChange = () => { refresh(); listeners.forEach(f => { try { f(); } catch(e) {} }); };
    try { speechSynthesis.addEventListener('voiceschanged', onChange); } catch(e) { try { speechSynthesis.onvoiceschanged = onChange; } catch(_) {} }
  }
  // 첫 목록 로딩 대기(최대 3초, 0.25초 간격 재확인)
  const ready = new Promise(res => {
    if (!has()) return res([]);
    if (refresh().length) return res(voices);
    let n = 0;
    const iv = setInterval(() => { if (refresh().length || ++n >= 12) { clearInterval(iv); res(voices); } }, 250);
  });

  // 장난감 음성(Eloquence 등)은 감점
  const NOVELTY = /(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox)/i;
  const idOf = v => ((v.voiceURI || '') + ' ' + (v.name || '')).toLowerCase();
  function score(v){
    const id = idOf(v);
    let s = 0;
    if (/siri/.test(id)) s += 35;
    if (/premium|プレミアム|프리미엄/.test(id)) s += 30;
    if (/enhanced|拡張|고품질|향상/.test(id)) s += 20;
    if (/google|microsoft|natural|neural/.test(id)) s += 12;
    if (/compact/.test(id)) s -= 5;
    if (NOVELTY.test(id)) s -= 40;
    if (v.localService) s += 1;
    if (norm(v.lang) === norm(opt.lang)) s += 2;
    return s;
  }
  const ranked = () => voices.slice().sort((a, b) => score(b) - score(a));
  const savedURI = () => { try { return opt.store.get('voiceURI', null); } catch(e) { return null; } };
  const savedMissing = () => { const u = savedURI(); return !!(u && voices.length && !voices.some(v => v.voiceURI === u)); };
  function pick(){
    refresh();
    const uri = savedURI();
    return (uri && voices.find(v => v.voiceURI === uri)) || ranked()[0] || null;
  }
  const rate = () => { const r = +opt.store.get('voiceRate', 0.9); return r >= 0.5 && r <= 1.5 ? r : 0.9; };

  // 반드시 터치 처리 안에서 동기적으로 호출됨
  let seq = 0;
  function speakNow(text, voice, isRetry){
    if (!has() || !text) return;
    const my = ++seq;
    try {
      const ss = speechSynthesis;
      if (ss.speaking || ss.pending) ss.cancel();
      try { ss.resume(); } catch(e) {}           // iOS에서 일시정지 상태로 멈춰 있는 경우 대비
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = (voice && voice.lang) || opt.lang;
      u.rate = rate();
      if (voice) { try { u.voice = voice; } catch(e) { u.lang = opt.lang; } }   // 깨진 음성 객체면 기본 음성으로
      let started = false, retried = false;
      const retry = () => {
        if (retried || isRetry || my !== seq) return;   // 그사이 다른 재생을 눌렀으면 재시도 안 함   // 기본 음성으로 한 번만 재시도
        retried = true;
        try { speechSynthesis.cancel(); } catch(e) {}
        speakNow(text, null, true);
      };
      u.onstart = () => { started = true; };
      u.onerror = e => { const er = e && e.error; if (!started && er !== 'interrupted' && er !== 'canceled') retry(); };
      ss.speak(u);
      // 1.5초 안에 시작하지 않으면(업데이트로 깨진 음성, cancel 직후 무시 등) 기본 음성으로 재시도
      if (!isRetry) setTimeout(() => { if (!started && !speechSynthesis.speaking) retry(); }, 1500);
    } catch(e) {}
  }
  function speak(text){ speakNow(text, pick()); }

  // 첫 터치 때 음성 목록을 다시 읽고 일시정지 상태를 풀어 둠
  const wake = () => { if (!has()) return; refresh(); try { speechSynthesis.resume(); } catch(e) {} };
  try { document.addEventListener('touchstart', wake, {once: true, capture: true, passive: true}); } catch(e) {}

  function label(v){
    const id = idOf(v);
    return /siri/.test(id) ? 'Siri' : /premium|プレミアム|프리미엄/.test(id) ? 'Premium' : /enhanced|拡張|고품질|향상/.test(id) ? 'Enhanced' : NOVELTY.test(id) ? T.novelty : '';
  }

  // 음성 설정 화면
  function screen(view, esc){
    let showAll = false, polls = 0, timer = null;
    const alive = () => document.body.contains(view) && !!view.querySelector('#vreload');
    const render = () => {
      refresh();
      const base = showAll ? all.slice().sort((a, b) => (norm(a.lang).startsWith(prefix) ? 0 : 1) - (norm(b.lang).startsWith(prefix) ? 0 : 1) || score(b) - score(a)) : ranked();
      const cur = pick();
      const isCur = v => cur && v.voiceURI === cur.voiceURI;
      view.innerHTML = `
        <div class="card sec" style="margin-top:0">
          <h3>${T.speed}: <b id="rv">${rate().toFixed(2)}</b></h3>
          <input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${rate()}" style="width:100%">
        </div>
        ${has() ? '' : `<p class="note">${T.unsupported}</p>`}
        ${savedMissing() ? `<p class="note">${T.missing}</p>` : ''}
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <h2 class="sub" style="margin-right:auto">${T.voices} (${voices.length})</h2>
          <button class="pill" id="vreload">↻ ${T.reload}</button>
          <button class="pill" id="vall">${showAll ? T.onlyLang : T.allLang}</button>
        </div>
        <p class="note" style="margin-top:4px">${T.diag.replace('{n}', all.length)}</p>
        <div class="list">${base.map((v, i) => `
          <button class="card row" data-i="${i}" style="${isCur(v) ? 'border-color:var(--accent);border-width:2px' : ''}">
            <div class="w" style="font-size:16px">${esc(v.name)}${label(v) ? ` <span class="pill" style="padding:2px 8px;font-size:11px">${esc(label(v))}</span>` : ''}
              <div style="font-size:12px;color:var(--sub)">${esc(v.lang)}${isCur(v) ? ' · ' + T.selected : ''}</div></div>
            <div class="m">▶︎ ${T.tryIt}</div>
          </button>`).join('') || `<p class="note">${T.none}</p>`}</div>
        <div class="card sec"><h3>${T.howTitle}</h3><div style="font-size:14px;line-height:1.7">${T.how}</div></div>`;
      const rv = view.querySelector('#rv'), rs = view.querySelector('#rate');
      rs.oninput = () => { rv.textContent = (+rs.value).toFixed(2); };
      rs.onchange = () => { opt.store.set('voiceRate', +rs.value); speak(T.sample); };
      view.querySelector('#vreload').onclick = () => { speak(T.sample); polls = 0; poll(); render(); };
      view.querySelector('#vall').onclick = () => { showAll = !showAll; render(); };
      view.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        const v = base[+b.dataset.i];
        if (!v) return;
        opt.store.set('voiceURI', v.voiceURI);
        speakNow(T.sample, v);
        render();
      });
    };
    // 목록이 늦게 채워지는 경우를 위해 6초간 재확인
    const poll = () => {
      clearInterval(timer);
      timer = setInterval(() => {
        const before = all.length;
        refresh();
        if (!alive() || ++polls > 12) return clearInterval(timer);
        if (all.length !== before) render();
      }, 500);
    };
    const onChange = () => { if (alive()) render(); else listeners.delete(onChange); };
    listeners.add(onChange);
    render(); poll();
  }
  return {speak, screen, ready, current: () => ready.then(pick)};
}

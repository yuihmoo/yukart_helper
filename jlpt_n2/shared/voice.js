// ---------- 음성(TTS) 공통 모듈: よん·れん 빌드 시 주입 ----------
// iOS 사파리는 getVoices()가 처음엔 빈 배열이고 'voiceschanged' 이후에 채워짐 → 로딩을 기다린 뒤 고품질 음성을 고름.
// 고품질(Premium/Enhanced) 음성이 웹에 노출되는지는 iOS 버전에 따라 다르므로, 사용자가 직접 골라 들어볼 수 있는 화면을 제공.
function makeTTS(opt){
  // opt: {lang:'ja-JP', store, T:{...문구}}
  const prefix = opt.lang.slice(0, 2);
  let voices = [];
  const load = () => { try { voices = (speechSynthesis.getVoices() || []).filter(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(prefix)); } catch(e) { voices = []; } return voices; };
  const ready = new Promise(res => {
    if (!('speechSynthesis' in window)) return res([]);
    if (load().length) return res(voices);
    let done = false;
    const fin = () => { if (!done) { done = true; res(load()); } };
    try { speechSynthesis.addEventListener('voiceschanged', fin); } catch(e) {}
    setTimeout(fin, 1500);   // 이벤트가 오지 않는 브라우저 대비
  });
  // 장난감 음성(Eloquence: Eddy, Flo, Grandma, Grandpa, Reed, Rocko, Sandy, Shelley)은 감점
  const NOVELTY = /(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox)/i;
  function score(v){
    const id = ((v.voiceURI || '') + ' ' + (v.name || '')).toLowerCase();
    let s = 0;
    if (/premium|プレミアム|프리미엄/.test(id)) s += 30;
    if (/enhanced|拡張|고품질|향상/.test(id)) s += 20;
    if (/siri/.test(id)) s += 15;
    if (/google|microsoft|natural|neural/.test(id)) s += 12;
    if (/compact/.test(id)) s -= 5;
    if (NOVELTY.test(id)) s -= 40;
    if (v.localService) s += 1;
    if (v.lang && v.lang.replace('_', '-') === opt.lang) s += 2;
    return s;
  }
  const ranked = () => voices.slice().sort((a, b) => score(b) - score(a));
  const savedURI = () => opt.store.get('voiceURI', null);
  function pick(){
    const uri = savedURI();
    return (uri && voices.find(v => v.voiceURI === uri)) || ranked()[0] || null;
  }
  const rate = () => { const r = +opt.store.get('voiceRate', 0.9); return r >= 0.5 && r <= 1.5 ? r : 0.9; };
  function speakWith(text, voice){
    try {
      if (!('speechSynthesis' in window) || !text) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opt.lang; u.rate = rate();
      if (voice) u.voice = voice;
      // iOS에서 cancel 직후 바로 speak하면 무시되는 경우가 있어 한 틱 늦춤
      setTimeout(() => { try { speechSynthesis.speak(u); } catch(e) {} }, 30);
    } catch(e) {}
  }
  function speak(text){ ready.then(() => speakWith(text, pick())); }

  function label(v){
    const id = ((v.voiceURI || '') + ' ' + (v.name || '')).toLowerCase();
    const tag = /premium|プレミアム|프리미엄/.test(id) ? 'Premium' : /enhanced|拡張|고품질|향상/.test(id) ? 'Enhanced' : NOVELTY.test(id) ? opt.T.novelty : '';
    return tag;
  }
  // 음성 설정 화면
  function screen(view, esc){
    view.innerHTML = `<p class="note" style="margin-top:0">${opt.T.loading}</p>`;
    ready.then(() => {
      const list = ranked(), cur = pick(), T = opt.T;
      view.innerHTML = `
        <div class="card sec" style="margin-top:0">
          <h3>${T.speed}: <b id="rv">${rate().toFixed(2)}</b></h3>
          <input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${rate()}" style="width:100%">
        </div>
        <h2 class="sub">${T.voices} (${list.length})</h2>
        <div class="list">${list.map((v, i) => `
          <button class="card row" data-i="${i}" style="${cur && v.voiceURI === cur.voiceURI ? 'border-color:var(--accent);border-width:2px' : ''}">
            <div class="w" style="font-size:16px">${esc(v.name)}${label(v) ? ` <span class="pill" style="padding:2px 8px;font-size:11px">${esc(label(v))}</span>` : ''}
              <div style="font-size:12px;color:var(--sub)">${esc(v.lang)}${cur && v.voiceURI === cur.voiceURI ? ' · ' + T.selected : ''}</div></div>
            <div class="m">▶︎ ${T.tryIt}</div>
          </button>`).join('') || `<p class="note">${T.none}</p>`}</div>
        <div class="card sec"><h3>${T.howTitle}</h3><div style="font-size:14px;line-height:1.7">${T.how}</div></div>`;
      const rv = view.querySelector('#rv'), rs = view.querySelector('#rate');
      rs.oninput = () => { rv.textContent = (+rs.value).toFixed(2); };
      rs.onchange = () => { opt.store.set('voiceRate', +rs.value); speak(T.sample); };
      view.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        const v = list[+b.dataset.i];
        opt.store.set('voiceURI', v.voiceURI);
        speakWith(T.sample, v);
        screen(view, esc);
      });
    });
  }
  return {speak, screen, ready, current: () => ready.then(pick)};
}

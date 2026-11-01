// ---------- 학습 기록 백업 공통 모듈: 첫 화면·よん·れん 공용 ----------
// 저장 대상: localStorage의 'n2:'(よん 기출) 'n2m:'(よん 메인) 'ren:'(れん) 키 전부 → 파일 하나로 모든 앱 기록을 백업/복원.
// 자동 저장: ① 파일 자동 저장(크롬·엣지 PC: 한 번 파일을 지정하면 기록이 바뀔 때마다 그 파일을 덮어씀)
//            ② 그 외 브라우저(아이폰 등)는 파일을 몰래 쓸 수 없으므로 '마지막 백업 후 N일' 알림으로 대신함.
// 화면 문구: ko(よん·첫 화면 한국어), ja(れん·첫 화면 일본어)
const BACKUP_T = {
  ko: {never:'없음', memo:'암기', wrong:'오답', empty:'저장된 학습 기록이 없습니다.', exportFail:'파일을 저장하지 못했습니다. 다른 브라우저에서 시도해 주세요.',
  badFile:'백업 파일이 아니거나 손상된 파일입니다.', confirmImport:'이 백업으로 현재 학습 기록을 바꿀까요? (지금 기록은 되돌리기용으로 한 번 보관됩니다)', backupDate:'백업 시각',
  importPartial:'일부 항목을 저장하지 못했습니다(저장 공간 부족 등).', importDone:'불러오기를 완료했습니다.', confirmUndo:'불러오기 직전 상태로 되돌릴까요?',
  bannerPaused:'자동 백업이 일시 중지됐어요.', bannerNever:'아직 학습 기록을 백업한 적이 없어요.', bannerDays:'마지막 백업 후 {n}일 지났어요.', resume:'자동 백업 다시 켜기', backupNow:'지금 백업',
  current:'현재 학습 기록 (よん·れん 전체)', lastBackup:'마지막 백업', manual:'파일로 내보내기 · 불러오기', exportBtn:'⬇︎ 내보내기', importBtn:'⬆︎ 불러오기',
  manualNote:'よん·れん의 암기 체크, 오답 노트, 복습 일정, 최고 점수, 설정이 파일 하나에 저장됩니다. 아이폰에서는 공유 창의 <b>파일에 저장</b>을 고르세요. 다른 기기에서 불러오면 기록을 옮길 수 있습니다.',
  undo:'↺ 불러오기 전으로 되돌리기', auto:'자동 백업', autoOn:'켜짐 — 기록이 바뀔 때마다 지정한 파일에 자동 저장', lastAuto:'마지막 자동 저장', changeFile:'저장 파일 바꾸기', stopAuto:'자동 백업 끄기',
  autoPausedMsg:'브라우저를 다시 열면 보안상 한 번 허용이 필요합니다. 아래 버튼을 누르면 이어서 자동 저장합니다.',
  autoNote:'컴퓨터의 크롬·엣지에서는 백업 파일을 한 번 지정해 두면, 공부할 때마다 그 파일이 자동으로 갱신됩니다. (구글 드라이브·OneDrive 동기화 폴더에 두면 클라우드에도 자동 보관)', chooseFile:'자동 백업 파일 지정',
  autoUnsupported:'이 브라우저(아이폰·사파리 등)는 보안상 파일을 자동으로 저장할 수 없습니다. 대신 마지막 백업 후 {n}일이 지나면 홈 화면에 알림을 띄웁니다.', confirmStop:'자동 백업을 끌까요? (이미 저장된 파일은 그대로 남습니다)', syncTitle:'집 PC 동기화', syncNote:'집 PC에서 동기화 서버(kotoba_sync)를 실행해 두면, 공부한 기록이 PC의 SQLite 파일에 자동 저장되고 아이폰·PC 어디서 열어도 같은 기록이 이어집니다. 서버 주소와 사용자 토큰을 입력하세요.',
  syncUrl:'서버 주소 (예: https://내PC이름.xxxx.ts.net)', syncToken:'사용자 토큰', syncSave:'연결 확인 후 저장', syncNow:'지금 동기화', syncOff:'연결 해제', syncOn:'연결됨', syncUser:'사용자',
  syncLast:'마지막 동기화', syncErr:'오류', syncBadUrl:'https:// 로 시작하는 주소를 입력하세요. (PC 안에서 시험할 때만 http://localhost 허용)', syncFail:'서버에 연결하지 못했습니다. PC와 서버가 켜져 있는지, Tailscale이 연결돼 있는지 확인하세요.',
  syncAuth:'토큰이 맞지 않습니다.', syncOk:'연결되었습니다. 앞으로 자동으로 동기화합니다.', confirmSyncOff:'동기화를 해제할까요? (이 기기와 PC의 기록은 그대로 남습니다)', bannerSync:'집 PC와 {n}일째 동기화하지 못했어요.', syncOpen:'확인'},
  ja: {never:'なし', memo:'暗記', wrong:'間違い', empty:'保存された学習記録はありません。', exportFail:'ファイルを保存できませんでした。別のブラウザでお試しください。',
  badFile:'バックアップファイルではないか、壊れたファイルです。', confirmImport:'このバックアップで今の学習記録を置き換えますか?(今の記録は元に戻す用に一度保管されます)', backupDate:'バックアップ日時',
  importPartial:'一部の項目を保存できませんでした(容量不足など)。', importDone:'読み込みが完了しました。', confirmUndo:'読み込む前の状態に戻しますか?',
  bannerPaused:'自動バックアップが一時停止しています。', bannerNever:'まだ学習記録をバックアップしていません。', bannerDays:'前回のバックアップから{n}日経ちました。', resume:'自動バックアップを再開', backupNow:'今すぐバックアップ',
  current:'今の学習記録(よん・れん 全体)', lastBackup:'前回のバックアップ', manual:'ファイルに書き出し・読み込み', exportBtn:'⬇︎ 書き出す', importBtn:'⬆︎ 読み込む',
  manualNote:'よん・れんの暗記チェック、間違いノート、復習スケジュール、最高点、設定が1つのファイルに保存されます。iPhoneでは共有画面の<b>「ファイルに保存」</b>を選んでください。別の端末で読み込めば記録を移せます。',
  undo:'↺ 読み込む前に戻す', auto:'自動バックアップ', autoOn:'オン — 記録が変わるたびに指定したファイルへ自動保存', lastAuto:'前回の自動保存', changeFile:'保存先を変更', stopAuto:'自動バックアップをオフ',
  autoPausedMsg:'ブラウザを開き直すと、安全のため一度だけ許可が必要です。下のボタンを押すと自動保存を続けます。',
  autoNote:'パソコンのChrome・Edgeでは、バックアップファイルを一度指定すれば、勉強するたびにそのファイルが自動で更新されます。(Googleドライブ・OneDriveの同期フォルダに置けばクラウドにも自動保管)', chooseFile:'自動バックアップ先を指定',
  autoUnsupported:'このブラウザ(iPhone・Safariなど)は安全のためファイルを自動保存できません。代わりに前回のバックアップから{n}日経つとホームにお知らせを出します。', confirmStop:'自動バックアップをオフにしますか?(保存済みのファイルはそのまま残ります)', syncTitle:'自宅PCと同期', syncNote:'自宅PCで同期サーバー(kotoba_sync)を動かしておくと、学習記録がPCのSQLiteファイルに自動保存され、iPhone・PCどちらで開いても同じ記録が続きます。サーバーのアドレスとユーザートークンを入力してください。',
  syncUrl:'サーバーのアドレス(例: https://PC名.xxxx.ts.net)', syncToken:'ユーザートークン', syncSave:'接続を確認して保存', syncNow:'今すぐ同期', syncOff:'接続を解除', syncOn:'接続中', syncUser:'ユーザー',
  syncLast:'前回の同期', syncErr:'エラー', syncBadUrl:'https:// で始まるアドレスを入力してください。(PC内でのテストのみ http://localhost 可)', syncFail:'サーバーに接続できませんでした。PCとサーバーが起動しているか、Tailscaleが接続されているか確認してください。',
  syncAuth:'トークンが正しくありません。', syncOk:'接続しました。これから自動で同期します。', confirmSyncOff:'同期を解除しますか?(この端末とPCの記録はそのまま残ります)', bannerSync:'自宅PCと{n}日間同期できていません。', syncOpen:'確認'}
};
function makeBackup(opt){
  const T = opt.T, esc = opt.esc;
  const KEY_RE = /^(n2|n2m|ren):[\w.-]+$/;           // 백업에 포함할 키 (bk:는 백업 자체 상태라 제외)
  const APPS = {'n2m': 'よん', 'n2': 'よん 기출', 'ren': 'れん'};
  const REMIND_DAYS = 7, DAY = 864e5;
  const ls = {
    get(k){ try { return localStorage.getItem(k); } catch(e) { return null; } },
    set(k, v){ try { localStorage.setItem(k, v); return true; } catch(e) { return false; } },
    del(k){ try { localStorage.removeItem(k); } catch(e) {} },
    keys(){ try { return Object.keys(localStorage); } catch(e) { return []; } }
  };
  const now = () => Date.now();
  const fmt = t => { if (!t) return T.never; const d = new Date(+t); const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };

  function collect(){
    const data = {};
    for (const k of ls.keys()) if (KEY_RE.test(k)) { const v = ls.get(k); if (v != null) data[k] = v; }
    return data;
  }
  // 실제 학습 기록이 있는지(테마·음성 설정만 있는 경우는 백업 알림 대상 아님)
  const hasLearning = data => Object.keys(data).some(k => /:(memo|wrong|srs|best|gbest)$/.test(k) && data[k] && data[k].length > 4);
  function summary(data){
    const c = {};
    for (const k of Object.keys(data)) { const app = k.split(':')[0]; c[app] = (c[app] || 0) + 1; }
    const memo = k => { try { return (JSON.parse(data[k] || '[]') || []).length; } catch(e) { return 0; } };
    return Object.keys(APPS).filter(a => c[a]).map(a => `${APPS[a]}: ${T.memo} ${memo(a + ':memo')} · ${T.wrong} ${memo(a + ':wrong')}`).join('\n') || T.empty;
  }
  function payload(){
    return JSON.stringify({app: 'kotoba-backup', version: 1, savedAt: new Date().toISOString(), data: collect()}, null, 1);
  }
  const fileName = () => { const d = new Date(), p = n => String(n).padStart(2, '0');
    return `kotoba-backup-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`; };

  // ---------- 내보내기 ----------
  async function exportFile(){
    const text = payload(), name = fileName();
    const blob = new Blob([text], {type: 'application/json'});
    try {
      const file = new File([blob], name, {type: 'application/json'});
      // 아이폰(홈 화면 앱)은 다운로드가 막히는 경우가 있어 공유 시트(파일에 저장)를 우선 사용
      if (/iP(hone|ad|od)/.test(navigator.userAgent) && navigator.canShare && navigator.canShare({files: [file]})) {
        await navigator.share({files: [file], title: name});
        ls.set('bk:lastExport', String(now())); return true;
      }
    } catch(e) { if (e && e.name === 'AbortError') return false; }   // 사용자가 공유 창을 닫음
    try {
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      ls.set('bk:lastExport', String(now())); return true;
    } catch(e) { alert(T.exportFail); return false; }
  }

  // ---------- 불러오기 ----------
  function parse(text){
    let j; try { j = JSON.parse(text); } catch(e) { throw new Error(T.badFile); }
    if (!j || j.app !== 'kotoba-backup' || typeof j.data !== 'object' || Array.isArray(j.data)) throw new Error(T.badFile);
    const data = {};
    for (const [k, v] of Object.entries(j.data)) {
      if (!KEY_RE.test(k) || typeof v !== 'string' || v.length > 2e6) continue;   // 모르는 키·이상한 값은 무시
      try { JSON.parse(v); } catch(e) { continue; }
      data[k] = v;
    }
    if (!Object.keys(data).length) throw new Error(T.badFile);
    return {data, savedAt: j.savedAt};
  }
  function apply(data){
    ls.set('bk:undo', JSON.stringify(collect()));        // 실수로 덮어써도 되돌릴 수 있게 직전 상태 보관
    for (const k of ls.keys()) if (KEY_RE.test(k)) ls.del(k);
    let fail = 0;
    for (const [k, v] of Object.entries(data)) if (!ls.set(k, v)) fail++;
    return fail;
  }
  function importFile(file){
    return new Promise(res => {
      if (!file) return res(false);
      if (file.size > 10 * 1024 * 1024) { alert(T.badFile); return res(false); }
      const r = new FileReader();
      r.onerror = () => { alert(T.badFile); res(false); };
      r.onload = () => {
        try {
          const {data, savedAt} = parse(String(r.result));
          if (!confirm(`${T.confirmImport}\n\n${T.backupDate}: ${savedAt ? fmt(Date.parse(savedAt)) : '?'}\n${summary(data)}`)) return res(false);
          const fail = apply(data);
          alert(fail ? T.importPartial : T.importDone);
          res(true); location.reload();
        } catch(e) { alert(e.message || T.badFile); res(false); }
      };
      r.readAsText(file);
    });
  }
  function undo(){
    const v = ls.get('bk:undo'); if (!v) return;
    let data; try { data = JSON.parse(v); } catch(e) { return; }
    if (!confirm(T.confirmUndo)) return;
    for (const k of ls.keys()) if (KEY_RE.test(k)) ls.del(k);
    for (const [k, val] of Object.entries(data || {})) if (KEY_RE.test(k) && typeof val === 'string') ls.set(k, val);
    ls.del('bk:undo'); location.reload();
  }

  // ---------- 자동 저장 (File System Access API: 크롬·엣지 PC) ----------
  const FS_OK = typeof window.showSaveFilePicker === 'function';
  const idb = (() => {
    let p = null;
    const open = () => p || (p = new Promise((res, rej) => {
      try { const q = indexedDB.open('kotoba-backup', 1);
        q.onupgradeneeded = () => q.result.createObjectStore('kv');
        q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
      } catch(e) { rej(e); }
    }));
    const tx = (mode, fn) => open().then(db => new Promise((res, rej) => {
      const t = db.transaction('kv', mode), s = t.objectStore('kv'), r = fn(s);
      t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error);
    }));
    return {get: k => tx('readonly', s => s.get(k)).catch(() => null),
            set: (k, v) => tx('readwrite', s => s.put(v, k)).catch(() => null),
            del: k => tx('readwrite', s => s.delete(k)).catch(() => null)};
  })();
  let handle = null, perm = 'none', timer = null, writing = false, dirty = false;
  const listeners = new Set();
  const notify = () => listeners.forEach(f => { try { f(); } catch(e) {} });
  async function loadHandle(){
    if (!FS_OK) return;
    handle = await idb.get('handle');
    if (!handle) { perm = 'none'; return notify(); }
    try { perm = await handle.queryPermission({mode: 'readwrite'}); } catch(e) { perm = 'prompt'; }
    notify();
    if (perm === 'granted') schedule(500);
  }
  async function writeNow(){
    if (!handle || perm !== 'granted') return;
    if (writing) { dirty = true; return; }
    writing = true; dirty = false;
    try {
      const w = await handle.createWritable(); await w.write(payload()); await w.close();
      ls.set('bk:lastAuto', String(now())); ls.set('bk:autoError', '');
    } catch(e) {
      perm = 'prompt'; ls.set('bk:autoError', String((e && e.name) || 'error')); notify();
    } finally { writing = false; if (dirty) schedule(1000); }
  }
  function schedule(ms){ clearTimeout(timer); timer = setTimeout(writeNow, ms == null ? 3000 : ms); }
  async function chooseFile(){
    try {
      const h = await window.showSaveFilePicker({suggestedName: 'kotoba-autobackup.json', types: [{description: 'JSON', accept: {'application/json': ['.json']}}]});
      handle = h; await idb.set('handle', h); perm = 'granted'; notify(); await writeNow(); return true;
    } catch(e) { return false; }   // 사용자가 취소
  }
  async function resume(){
    if (!handle) return chooseFile();
    try { perm = await handle.requestPermission({mode: 'readwrite'}); } catch(e) { perm = 'prompt'; }
    notify(); if (perm === 'granted') await writeNow();
    return perm === 'granted';
  }
  async function stopAuto(){ handle = null; perm = 'none'; await idb.del('handle'); notify(); }
  // 앱이 기록을 저장할 때마다 자동 저장 예약 (모든 앱의 store.set이 결국 localStorage.setItem을 거침)
  // ---------- 집 PC 동기화 (kotoba_sync 서버 + SQLite) ----------
  // 키마다 마지막 변경 시각(sync:meta)을 기록하고, 서버와 주고받아 더 최근 값을 남긴다(last-write-wins).
  let origSet = null, metaCache = null, syncTimer = null, syncing = null;
  const getMeta = () => { if (!metaCache) { try { metaCache = JSON.parse(ls.get('sync:meta') || '{}') || {}; } catch(e) { metaCache = {}; } } return metaCache; };
  const rawSet = (k, v) => { try { (origSet || Storage.prototype.setItem).call(localStorage, k, v); return true; } catch(e) { return false; } };
  const saveMeta = () => rawSet('sync:meta', JSON.stringify(getMeta()));
  const syncConf = () => { try { const c = JSON.parse(ls.get('sync:conf') || 'null'); return c && c.url && c.token ? c : null; } catch(e) { return null; } };
  const validUrl = u => /^https:\/\/[^\s/]+/i.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(u);
  async function api(conf, path, body, keepalive){
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const to = setTimeout(() => ctl && ctl.abort(), 15000);   // 서버가 꺼져 있으면 오래 기다리지 않음
    try {
      const r = await fetch(conf.url.replace(/\/+$/, '') + path, {method: body ? 'POST' : 'GET', keepalive: !!keepalive,
        headers: Object.assign({'Authorization': 'Bearer ' + conf.token}, body ? {'Content-Type': 'application/json'} : {}),
        body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined, cache: 'no-store'});
      if (r.status === 401) throw new Error('auth');
      if (!r.ok) throw new Error('http ' + r.status);
      return await r.json();
    } finally { clearTimeout(to); }
  }
  // 반환: 서버에서 받아 바뀐 키 개수 (실패 시 -1)
  function syncNow(keepalive){
    const conf = syncConf(); if (!conf) return Promise.resolve(0);
    if (syncing) return syncing;
    syncing = (async () => {
      const meta = getMeta(), items = {};
      for (const [k, v] of Object.entries(collect())) items[k] = {v, t: meta[k] || 0};
      try {
        const res = await api(conf, '/api/sync', {items}, keepalive);
        let changed = 0;
        for (const [k, it] of Object.entries((res && res.items) || {})) {
          if (!KEY_RE.test(k) || !it || typeof it.v !== 'string') continue;
          const cur = ls.get(k);
          if ((it.t || 0) > (meta[k] || 0) || cur == null) {
            if (cur !== it.v) { rawSet(k, it.v); changed++; }
            meta[k] = it.t || 0;
          }
        }
        saveMeta(); rawSet('sync:last', String(now())); rawSet('sync:err', '');
        notify(); return changed;
      } catch(e) {
        rawSet('sync:err', e && e.message === 'auth' ? 'auth' : 'net'); notify(); return -1;
      } finally { syncing = null; }
    })();
    return syncing;
  }
  const scheduleSync = ms => { clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow(), ms == null ? 4000 : ms); };
  // 다른 기기의 기록을 받아오면 화면 상태(메모리)와 맞추기 위해 한 번 새로고침
  async function pullAndRefresh(){
    const n = await syncNow();
    if (n > 0) {
      let last = 0; try { last = +sessionStorage.getItem('sync:reload') || 0; } catch(e) {}
      if (now() - last > 10000) { try { sessionStorage.setItem('sync:reload', String(now())); } catch(e) {} location.reload(); }
    }
  }
  async function connectSync(url, token){
    url = String(url || '').trim().replace(/\/+$/, ''); token = String(token || '').trim();
    if (!validUrl(url)) { alert(T.syncBadUrl); return false; }
    try {
      const r = await api({url, token}, '/api/ping');
      if (!r || !r.ok) throw new Error('auth');
      rawSet('sync:conf', JSON.stringify({url, token, user: r.user}));
      alert(T.syncOk); await pullAndRefresh(); notify(); return true;
    } catch(e) { alert(e && e.message === 'auth' ? T.syncAuth : T.syncFail); return false; }
  }
  function disconnectSync(){ if (!confirm(T.confirmSyncOff)) return; ls.del('sync:conf'); ls.del('sync:err'); notify(); }

  try {
    const orig = origSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v){
      orig.call(this, k, v);
      if (this === window.localStorage && KEY_RE.test(k)) {
        if (handle && perm === 'granted') schedule();
        try { const m = getMeta(); m[k] = Date.now(); orig.call(this, 'sync:meta', JSON.stringify(m)); } catch(e) {}
        if (syncConf()) scheduleSync();
      }
    };
  } catch(e) {}
  if (syncConf()) {
    pullAndRefresh();
    document.addEventListener('visibilitychange', () => {
      if (!syncConf()) return;
      if (document.visibilityState === 'hidden') { if (syncTimer) { clearTimeout(syncTimer); syncNow(true); } }
      else pullAndRefresh();
    });
    window.addEventListener('online', () => scheduleSync(500));
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && timer) { clearTimeout(timer); writeNow(); } });
  loadHandle();

  // ---------- 상태·알림 ----------
  function status(){
    const last = Math.max(+ls.get('bk:lastExport') || 0, +ls.get('bk:lastAuto') || 0);
    const data = collect();
    const autoOn = !!handle && perm === 'granted';
    const days = last ? Math.floor((now() - last) / DAY) : null;
    const sc = syncConf(), sLast = +ls.get('sync:last') || 0, sDays = sLast ? Math.floor((now() - sLast) / DAY) : null;
    const syncFresh = !!sc && sDays != null && sDays < REMIND_DAYS;
    return {last, days, autoOn, autoPaused: !!handle && perm !== 'granted', fs: FS_OK,
      sync: sc, syncLast: sLast, syncErr: ls.get('sync:err') || '', syncStale: !!sc && hasLearning(data) && (sDays == null ? false : sDays >= 3),
      syncDays: sDays, need: hasLearning(data) && !autoOn && !syncFresh && (days == null || days >= REMIND_DAYS)};
  }
  // 홈 화면 상단 알림: 백업이 오래됐거나 자동 백업이 멈췄을 때만 표시
  function banner(el, onOpen){
    if (!el) return;
    const draw = () => {
      const s = status();
      let msg = '';
      if (s.autoPaused) msg = T.bannerPaused;
      else if (s.syncStale) msg = T.bannerSync.replace('{n}', s.syncDays);
      else if (s.need) msg = s.days == null ? T.bannerNever : T.bannerDays.replace('{n}', s.days);
      el.innerHTML = msg ? `<div class="bk-banner"><span>${esc(msg)}</span><button type="button" class="bk-go">${esc(s.autoPaused ? T.resume : s.syncStale ? T.syncOpen : T.backupNow)}</button></div>` : '';
      const b = el.querySelector('.bk-go');
      if (b) b.onclick = async () => { if (s.autoPaused) { await resume(); draw(); } else if (s.syncStale && onOpen) onOpen(); else if (onOpen) onOpen(); else { await exportFile(); draw(); } };
    };
    listeners.add(draw); draw();
  }

  // ---------- 백업 화면 ----------
  function screen(view){
    const draw = () => {
      const s = status(), data = collect();
      const sc = s.sync;
      view.innerHTML = `
        <div class="card bk-sec">
          <h3>${esc(T.syncTitle)}</h3>
          ${sc ? `<p class="bk-on">● ${esc(T.syncOn)} — ${esc(T.syncUser)}: ${esc(sc.user || '?')}<br><small>${esc(sc.url)}</small></p>
              <div class="bk-meta">${esc(T.syncLast)}: ${esc(fmt(s.syncLast))}${s.syncErr ? ` · <span style="color:var(--accent)">${esc(T.syncErr)}: ${esc(s.syncErr === 'auth' ? T.syncAuth : T.syncFail)}</span>` : ''}</div>
              <div class="bk-row" style="margin-top:10px"><button type="button" class="btn primary" id="bkSyncNow">${esc(T.syncNow)}</button><button type="button" class="btn" id="bkSyncOff">${esc(T.syncOff)}</button></div>`
            : `<p class="bk-note" style="margin-top:0">${T.syncNote}</p>
              <input class="bk-in" id="bkUrl" type="url" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(T.syncUrl)}">
              <input class="bk-in" id="bkTok" type="password" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(T.syncToken)}">
              <button type="button" class="btn primary" id="bkSyncSave" style="width:100%">${esc(T.syncSave)}</button>`}
        </div>
        <div class="card bk-sec">
          <h3>${esc(T.current)}</h3>
          <pre class="bk-sum">${esc(summary(data))}</pre>
          <div class="bk-meta">${esc(T.lastBackup)}: ${esc(fmt(s.last))}</div>
        </div>
        <div class="card bk-sec">
          <h3>${esc(T.manual)}</h3>
          <div class="bk-row"><button type="button" class="btn primary" id="bkExport">${esc(T.exportBtn)}</button>
            <label class="btn" id="bkImportL">${esc(T.importBtn)}<input type="file" id="bkImport" accept=".json,application/json" hidden></label></div>
          <p class="bk-note">${T.manualNote}</p>
          ${ls.get('bk:undo') ? `<button type="button" class="btn" id="bkUndo" style="width:100%;margin-top:6px">${esc(T.undo)}</button>` : ''}
        </div>
        <div class="card bk-sec">
          <h3>${esc(T.auto)}</h3>
          ${s.fs ? (s.autoOn
              ? `<p class="bk-on">● ${esc(T.autoOn)}<br><small>${esc(T.lastAuto)}: ${esc(fmt(+ls.get('bk:lastAuto')))}</small></p>
                 <div class="bk-row"><button type="button" class="btn" id="bkChange">${esc(T.changeFile)}</button><button type="button" class="btn" id="bkStop">${esc(T.stopAuto)}</button></div>`
              : s.autoPaused
              ? `<p class="bk-off">${esc(T.autoPausedMsg)}</p><div class="bk-row"><button type="button" class="btn primary" id="bkResume">${esc(T.resume)}</button><button type="button" class="btn" id="bkStop">${esc(T.stopAuto)}</button></div>`
              : `<p class="bk-note">${T.autoNote}</p><button type="button" class="btn primary" id="bkChoose" style="width:100%">${esc(T.chooseFile)}</button>`)
            : `<p class="bk-note">${T.autoUnsupported.replace('{n}', REMIND_DAYS)}</p>`}
        </div>`;
      const on = (id, f) => { const b = view.querySelector('#' + id); if (b) b.onclick = f; };
      on('bkExport', async () => { await exportFile(); draw(); });
      const inp = view.querySelector('#bkImport'); if (inp) inp.onchange = () => { importFile(inp.files && inp.files[0]); inp.value = ''; };
      on('bkUndo', undo);
      on('bkChoose', async () => { await chooseFile(); draw(); });
      on('bkChange', async () => { await chooseFile(); draw(); });
      on('bkResume', async () => { await resume(); draw(); });
      on('bkStop', async () => { if (confirm(T.confirmStop)) { await stopAuto(); draw(); } });
      on('bkSyncSave', async () => { const b = view.querySelector('#bkSyncSave'); b.disabled = true;
        const ok = await connectSync(view.querySelector('#bkUrl').value, view.querySelector('#bkTok').value); b.disabled = false; if (ok) draw(); });
      on('bkSyncNow', async () => { const b = view.querySelector('#bkSyncNow'); b.disabled = true; const n = await syncNow(); b.disabled = false;
        if (n > 0) location.reload(); else draw(); });
      on('bkSyncOff', () => { disconnectSync(); draw(); });
    };
    listeners.add(draw); draw();
    return () => listeners.delete(draw);
  }

  const CSS = `.bk-banner{display:flex;align-items:center;gap:10px;justify-content:space-between;padding:10px 14px;margin:12px 0 0;border-radius:14px;background:var(--accent-weak);color:var(--ink);font-size:13px}
.bk-banner button{flex:0 0 auto;padding:7px 12px;border-radius:999px;background:var(--accent);color:#fff;font-size:13px;font-weight:600;border:0}
.bk-sec{padding:16px;margin-top:12px}.bk-sec h3{margin:0 0 10px;font-size:13px;color:var(--sub);font-weight:600}
.bk-sum{white-space:pre-wrap;font:inherit;font-size:14px;margin:0}.bk-meta{font-size:12px;color:var(--sub);margin-top:8px}
.bk-row{display:flex;gap:8px}.bk-row .btn{flex:1;text-align:center;cursor:pointer}
.bk-note{font-size:12px;color:var(--sub);margin:8px 0 0;line-height:1.6}.bk-on{color:var(--ok,#2f8f5b);font-weight:600;margin:0 0 10px}.bk-on small{color:var(--sub);font-weight:400}
.bk-off{color:var(--accent);margin:0 0 10px}
.bk-in{display:block;width:100%;font:inherit;font-size:15px;padding:12px;margin:8px 0;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink)}`;
  try { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); } catch(e) {}

  return {exportFile, importFile, screen, banner, status, collect, syncNow};
}

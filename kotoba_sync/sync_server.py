#!/usr/bin/env python3
"""ことば帳(よん·れん) 학습 기록 동기화 서버 — 집 PC에서 실행, 데이터는 SQLite 파일 하나(kotoba.db).

외부 라이브러리 없이 Python 3.9+ 표준 라이브러리만 사용한다.

사용법
  python sync_server.py adduser <이름>     사용자 추가 → 접속 토큰 출력(한 번만 표시)
  python sync_server.py users              사용자 목록
  python sync_server.py deluser <이름>     사용자 삭제(기록 포함)
  python sync_server.py backup             DB 백업 파일 생성(backups/)
  python sync_server.py serve [--port 8787] [--host 127.0.0.1] [--allow-origin URL ...]

앱(GitHub Pages, https)에서 접속하려면 HTTPS 주소가 필요하므로 Tailscale의 `tailscale serve`로 감싸서 쓴다(README.md 참고).
"""
import argparse, datetime, hashlib, json, os, re, secrets, shutil, sqlite3, sys, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get('KOTOBA_DB', os.path.join(HERE, 'kotoba.db'))
BACKUP_DIR = os.path.join(os.path.dirname(DB_PATH), 'backups')
KEEP_BACKUPS = 14
MAX_BODY = 5 * 1024 * 1024            # 요청 본문 최대 5MB (학습 기록은 보통 수백 KB 이하)
KEY_RE = re.compile(r'^(n2|n2m|ren):[\w.-]{1,64}$')
DEFAULT_ORIGINS = ['https://yuihmoo.github.io']

_lock = threading.Lock()              # SQLite 쓰기 직렬화


def db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.execute('PRAGMA journal_mode=WAL')
    con.execute('''CREATE TABLE IF NOT EXISTS users(
        name TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL)''')
    con.execute('''CREATE TABLE IF NOT EXISTS kv(
        user TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, t INTEGER NOT NULL,
        PRIMARY KEY(user, key))''')
    return con


def token_hash(tok):
    return hashlib.sha256(tok.encode()).hexdigest()


def backup(reason='manual'):
    """SQLite 백업 API로 안전하게 복사하고 오래된 백업은 정리"""
    if not os.path.exists(DB_PATH):
        return None
    os.makedirs(BACKUP_DIR, exist_ok=True)
    dst = os.path.join(BACKUP_DIR, f'kotoba-{datetime.datetime.now():%Y%m%d-%H%M%S}-{reason}.db')
    src = sqlite3.connect(DB_PATH)
    out = sqlite3.connect(dst)
    with out:
        src.backup(out)
    out.close(); src.close()
    files = sorted(f for f in os.listdir(BACKUP_DIR) if f.startswith('kotoba-') and f.endswith('.db'))
    for f in files[:-KEEP_BACKUPS]:
        try: os.remove(os.path.join(BACKUP_DIR, f))
        except OSError: pass
    return dst


_last_daily = {'day': None}
def daily_backup():
    today = datetime.date.today().isoformat()
    if _last_daily['day'] == today:
        return
    _last_daily['day'] = today
    if os.path.isdir(BACKUP_DIR) and any(f.startswith(f'kotoba-{today.replace("-", "")}') for f in os.listdir(BACKUP_DIR)):
        return
    try: backup('daily')
    except Exception as e: print('daily backup failed:', e, file=sys.stderr)


class Handler(BaseHTTPRequestHandler):
    server_version = 'KotobaSync/1.0'
    origins = DEFAULT_ORIGINS

    # ---------- 공통 ----------
    def log_message(self, fmt, *args):
        sys.stderr.write('%s %s\n' % (datetime.datetime.now().strftime('%H:%M:%S'), fmt % args))

    def cors(self):
        origin = self.headers.get('Origin')
        if origin and (origin in self.origins or re.match(r'^http://(localhost|127\.0\.0\.1)(:\d+)?$', origin)):
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Private-Network', 'true')   # 크롬 사설망 접근 사전 요청 대응
            self.send_header('Access-Control-Max-Age', '600')

    def send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def user(self):
        auth = self.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return None
        tok = auth[7:].strip()
        if not (16 <= len(tok) <= 200):
            return None
        con = db()
        try:
            row = con.execute('SELECT name FROM users WHERE token_hash=?', (token_hash(tok),)).fetchone()
        finally:
            con.close()
        return row[0] if row else None

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.send_header('Content-Length', '0')
        self.end_headers()

    # ---------- API ----------
    def do_GET(self):
        if self.path == '/api/ping':
            u = self.user()
            return self.send_json(200 if u else 401, {'ok': bool(u), 'user': u, 'now': int(time.time() * 1000)})
        if self.path == '/api/data':
            u = self.user()
            if not u: return self.send_json(401, {'error': 'unauthorized'})
            return self.send_json(200, {'items': self.load(u), 'now': int(time.time() * 1000)})
        self.send_json(404, {'error': 'not found'})

    def do_POST(self):
        if self.path != '/api/sync':
            return self.send_json(404, {'error': 'not found'})
        u = self.user()
        if not u:
            return self.send_json(401, {'error': 'unauthorized'})
        try:
            n = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            n = -1
        if n <= 0 or n > MAX_BODY:
            return self.send_json(413 if n > MAX_BODY else 400, {'error': 'bad length'})
        try:
            body = json.loads(self.rfile.read(n).decode('utf-8'))
            items = body.get('items')
            if not isinstance(items, dict): raise ValueError
        except Exception:
            return self.send_json(400, {'error': 'bad json'})
        now = int(time.time() * 1000)
        clean = {}
        for k, it in items.items():
            # 키 형식·값 형식이 맞는 것만 받음. 미래 시각(기기 시계 오류)은 지금 시각으로 보정
            if not KEY_RE.match(k) or not isinstance(it, dict): continue
            v, t = it.get('v'), it.get('t')
            if not isinstance(v, str) or len(v) > 2_000_000 or not isinstance(t, (int, float)): continue
            try: json.loads(v)
            except Exception: continue
            clean[k] = (v, int(min(max(t, 0), now)))
        with _lock:
            daily_backup()
            con = db()
            try:
                with con:
                    for k, (v, t) in clean.items():
                        # 마지막에 바뀐 쪽을 남김(last-write-wins)
                        con.execute('''INSERT INTO kv(user, key, value, t) VALUES(?,?,?,?)
                            ON CONFLICT(user, key) DO UPDATE SET value=excluded.value, t=excluded.t
                            WHERE excluded.t > kv.t''', (u, k, v, t))
            finally:
                con.close()
        self.send_json(200, {'items': self.load(u), 'now': now, 'accepted': len(clean)})

    def load(self, u):
        con = db()
        try:
            return {k: {'v': v, 't': t} for k, v, t in con.execute('SELECT key, value, t FROM kv WHERE user=?', (u,))}
        finally:
            con.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd')
    a = sub.add_parser('adduser'); a.add_argument('name')
    d = sub.add_parser('deluser'); d.add_argument('name')
    sub.add_parser('users'); sub.add_parser('backup')
    s = sub.add_parser('serve')
    s.add_argument('--port', type=int, default=8787)
    s.add_argument('--host', default='127.0.0.1', help='기본은 이 PC 안에서만 접속(Tailscale serve가 중계)')
    s.add_argument('--allow-origin', action='append', default=[], help='추가로 허용할 웹 주소')
    args = ap.parse_args()

    if args.cmd == 'adduser':
        if not re.match(r'^[\w-]{1,32}$', args.name): sys.exit('이름은 영문·숫자·_- 32자 이내')
        tok = secrets.token_urlsafe(24)
        con = db()
        try:
            with con:
                con.execute('INSERT OR REPLACE INTO users(name, token_hash, created_at) VALUES(?,?,?)',
                            (args.name, token_hash(tok), int(time.time())))
        finally:
            con.close()
        print(f'사용자 "{args.name}" 등록 완료. 아래 토큰을 앱의 동기화 설정에 입력하세요(다시 표시되지 않음):\n\n  {tok}\n')
        print('같은 이름으로 다시 adduser 하면 토큰이 새로 바뀝니다(기존 기록은 유지).')
    elif args.cmd == 'deluser':
        con = db()
        try:
            with con:
                con.execute('DELETE FROM users WHERE name=?', (args.name,))
                con.execute('DELETE FROM kv WHERE user=?', (args.name,))
        finally:
            con.close()
        print('삭제 완료')
    elif args.cmd == 'users':
        con = db()
        try:
            for name, c in con.execute('SELECT name, created_at FROM users ORDER BY name'):
                n = con.execute('SELECT COUNT(*), MAX(t) FROM kv WHERE user=?', (name,)).fetchone()
                last = datetime.datetime.fromtimestamp(n[1] / 1000).strftime('%Y-%m-%d %H:%M') if n[1] else '-'
                print(f'{name}\t항목 {n[0]}\t마지막 변경 {last}')
        finally:
            con.close()
    elif args.cmd == 'backup':
        print(backup() or 'DB가 아직 없습니다')
    elif args.cmd == 'serve':
        db().close()
        Handler.origins = DEFAULT_ORIGINS + args.allow_origin
        srv = ThreadingHTTPServer((args.host, args.port), Handler)
        print(f'동기화 서버 실행 중: http://{args.host}:{args.port}  (DB: {DB_PATH})  종료: Ctrl+C')
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass
    else:
        ap.print_help()


if __name__ == '__main__':
    main()

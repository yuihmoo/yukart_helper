# kotoba_sync — 집 PC 학습 기록 동기화 서버

ことば帳(よん·れん)의 학습 기록(암기 체크·오답 노트·복습 일정·최고 점수·설정)을
**집 PC의 SQLite 파일 하나(`kotoba.db`)** 에 저장하고, 아이폰·PC 어디서 열어도 같은 기록이 이어지게 합니다.

- Python 3.9 이상만 있으면 됩니다 (추가 설치 라이브러리 없음).
- 앱은 GitHub Pages(https)에 그대로 두고, 앱이 이 서버와 자동으로 주고받습니다.
- PC가 꺼져 있어도 앱은 평소처럼 쓸 수 있고, PC가 켜지면 다시 동기화됩니다.

```
아이폰/PC 브라우저 ──https──▶ Tailscale (https://PC이름.xxxx.ts.net) ──▶ 이 서버 (127.0.0.1:8787) ──▶ kotoba.db
```

## 1. 서버 준비 (집 PC, 최초 1회)

```bash
# 이 폴더(kotoba_sync)에서 실행
python sync_server.py adduser yon     # 본인용 토큰 출력
python sync_server.py adduser ren     # 와이프용 토큰 출력
```

출력된 토큰은 **다시 표시되지 않으니** 메모해 두세요. 잃어버리면 같은 명령을 다시 실행하면 새 토큰이 나옵니다(기록은 유지).

```bash
python sync_server.py serve           # 서버 실행 (기본: 127.0.0.1:8787, 이 PC 안에서만 접속)
```

## 2. Tailscale로 HTTPS 주소 만들기

앱이 https 사이트라서 서버도 https 주소가 필요합니다. Tailscale이 무료로 인증서와 외부 접속을 해결해 줍니다.

1. 집 PC, 본인 아이폰, 와이프 아이폰에 Tailscale 앱을 설치하고 **같은 tailnet**에 로그인합니다
   (같은 계정으로 로그인하거나, 관리 콘솔에서 와이프 계정을 초대).
2. 집 PC에서 아래 명령을 한 번 실행합니다. `--bg`라서 PC를 재부팅해도 계속 유지됩니다.

   ```bash
   tailscale serve --bg 8787
   ```

   출력에 나오는 `https://PC이름.xxxx.ts.net` 이 서버 주소입니다.
   (MagicDNS와 HTTPS 인증서가 tailnet에서 켜져 있어야 합니다. 새 tailnet은 기본으로 켜져 있습니다.)
3. 끄려면 `tailscale serve off`.

참고: [tailscale serve 명령](https://tailscale.com/docs/reference/tailscale-cli/serve), [Serve 예제](https://tailscale.com/docs/reference/examples/serve)

## 3. 앱에서 연결 (각자 기기에서 1회)

よん 또는 れん 홈 → **학습 기록 백업** → **집 PC 동기화**
- 서버 주소: `https://PC이름.xxxx.ts.net`
- 사용자 토큰: 1단계에서 받은 각자의 토큰

이후에는 자동입니다.
- 앱을 열거나 다시 화면에 띄울 때: PC의 기록을 받아옴
- 공부해서 기록이 바뀌면: 몇 초 뒤 PC로 올림
- 같은 항목이 두 기기에서 바뀌었으면 **나중에 바뀐 쪽**이 남습니다.

## 4. PC 켤 때 자동 실행

**Windows** — `start_windows.bat`을 시작 프로그램 폴더에 바로가기로 넣습니다.
(`Win + R` → `shell:startup` → 바로가기 붙여넣기)

**macOS** — `com.kotoba.sync.plist`의 경로를 내 PC에 맞게 고친 뒤:

```bash
cp com.kotoba.sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.kotoba.sync.plist
```

## 5. 데이터 관리

| 명령 | 설명 |
|---|---|
| `python sync_server.py users` | 사용자별 저장 항목 수·마지막 변경 시각 |
| `python sync_server.py backup` | `backups/`에 DB 백업 생성 |
| `python sync_server.py deluser 이름` | 사용자와 기록 삭제 |

- 서버는 **하루 한 번 자동으로** `backups/`에 DB를 백업하고 최근 14개만 남깁니다.
- `kotoba.db`와 `backups/` 폴더를 구글 드라이브·OneDrive 폴더에 두면 클라우드에도 보관됩니다
  (`KOTOBA_DB` 환경 변수로 DB 위치를 바꿀 수 있습니다).
- 토큰은 DB에 해시로만 저장됩니다. `kotoba.db`는 git에 올리지 마세요(.gitignore 처리됨).

"""src/ 데이터(words.json, kanji.txt, examples.txt)를 template.html에 주입해 index.html 생성."""
import json, re, pathlib, sys

SRC = pathlib.Path(__file__).parent
OUT = SRC.parent / 'yon.html'

words = json.loads((SRC / 'words.json').read_text(encoding='utf-8'))
kanji = (SRC / 'kanji.txt').read_text(encoding='utf-8')
examples = (SRC / 'examples.txt').read_text(encoding='utf-8')

# 무결성 검사: 모든 한자/예문이 존재하는지, 구분자 개수가 맞는지
kmap = {}
for ln in kanji.splitlines():
    if not ln.strip() or ln.startswith('#'):
        continue
    parts = ln.split('|')
    if len(parts) != 5:
        sys.exit(f'kanji.txt 형식 오류: {ln}')
    kmap[parts[0]] = parts
emap = {}
for ln in examples.splitlines():
    if not ln.strip() or ln.startswith('#'):
        continue
    parts = ln.split('|')
    if len(parts) != 3:
        sys.exit(f'examples.txt 형식 오류: {ln}')
    emap[parts[0]] = parts
missing_k = sorted({c for w in words for c in w['w'] if re.match(r'[一-鿿]', c) and c not in kmap})
missing_e = [w['w'] for w in words if w['w'] not in emap]
if missing_k or missing_e:
    sys.exit(f'누락 한자: {missing_k} / 누락 예문: {missing_e}')

# ---------- 한자별 음독/훈독 + 단어 속 읽기 정렬 ----------
k2h = lambda s: ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)
DAKU = dict(zip('かきくけこさしすせそたちつてとはひふへほ', 'がぎぐげござじずぜぞだぢづでどばびぶべぼ'))
HANDAKU = dict(zip('はひふへほ', 'ぱぴぷぺぽ'))
def variants(stem):
    """연탁(か→が), 반탁음(は→ぱ), 촉음화(つ→っ) 변형 포함"""
    out = {stem}
    if stem and stem[0] in DAKU: out.add(DAKU[stem[0]] + stem[1:])
    if stem and stem[0] in HANDAKU: out.add(HANDAKU[stem[0]] + stem[1:])
    for v in list(out):
        if len(v) > 1 and v[-1] in 'つちくき': out.add(v[:-1] + 'っ')
    return out

readings_raw = (SRC / 'readings.txt').read_text(encoding='utf-8')
RD = {}
for ln in readings_raw.splitlines():
    if not ln.strip() or ln.startswith('#'):
        continue
    parts = ln.split('|')
    if len(parts) != 3:
        sys.exit(f'readings.txt 형식 오류: {ln}')
    c, on, kun = parts
    items = []
    for kind, field in (('on', on), ('kun', kun)):
        for it in filter(None, field.split(',')):
            p = it.split(':')
            if len(p) != 3:
                sys.exit(f'readings.txt 항목 오류: {c} {it}')
            items.append((kind, p[0], k2h(p[0]).split('.')[0]))
    RD[c] = items
missing_r = sorted({c for w in words for c in w['w'] if re.match(r'[一-鿿]', c) and c not in RD})
if missing_r:
    sys.exit(f'readings.txt 누락 한자: {missing_r}')

# 숙자훈 등 규칙으로 정렬되지 않는 단어: 한자별 읽기 수동 지정 (읽기 키가 없으면 '특수 읽기'로 표시)
OVERRIDES = {
    '日本風': [('日', 'に', ''), ('本', 'ほん', 'ホン'), ('風', 'ふう', 'フウ')],
    '最寄り': [('最', 'も', 'もっと.も'), ('寄', 'よ', 'よ.る')],
    '指図': [('指', 'さし', 'さ.す'), ('図', 'ず', 'ズ')],
    # 一人(ひとり)·二人(ふたり)는 숙자훈 → 人의 'り'는 특수 읽기
    '一人一人': [('一', 'ひと', 'ひと'), ('人', 'り', '')],
    '二人連れ': [('二', 'ふた', 'ふた'), ('人', 'り', ''), ('連', 'づ', 'つ.れる')],
}
def align(w, r):
    r = k2h(r); sols = []
    def rec(i, j, acc):
        if sols: return
        if i == len(w):
            if j == len(r): sols.append(list(acc))
            return
        c = w[i]
        if c == '々':
            prev = acc[-1]
            for v in variants(prev[1]):
                if r.startswith(v, j):
                    acc.append(('々', v, prev[2])); rec(i + 1, j + len(v), acc); acc.pop()
            return
        if not re.match(r'[一-鿿]', c):
            if r.startswith(k2h(c), j): rec(i + 1, j + 1, acc)
            return
        for kind, key, stem in sorted(RD[c], key=lambda x: -len(x[2])):
            for v in sorted(variants(stem), key=len, reverse=True):
                if r.startswith(v, j):
                    acc.append((c, v, key)); rec(i + 1, j + len(v), acc); acc.pop()
    rec(0, 0, [])
    return sols[0] if sols else None
fails = []
for w in words:
    seg = OVERRIDES.get(w['w']) or align(w['w'], w['r'])
    if not seg:
        fails.append(f"{w['w']}({w['r']})")
        continue
    w['seg'] = [list(s) for s in seg if s[0] != '々']
if fails:
    sys.exit('읽기 정렬 실패 (readings.txt에 읽기 추가 또는 OVERRIDES 지정 필요): ' + ', '.join(fails))

grammar = (SRC / 'grammar.txt').read_text(encoding='utf-8')
gcount = 0
seen_p = set()
for ln in grammar.splitlines():
    if not ln.strip() or ln.startswith('#'):
        continue
    parts = ln.split('|')
    if len(parts) != 6 or not re.search(r'\[[^\]]+\]', parts[2]):
        sys.exit(f'grammar.txt 형식 오류: {ln}')
    if parts[0] in seen_p:
        sys.exit(f'grammar.txt 중복 문형: {parts[0]}')
    seen_p.add(parts[0])
    gcount += 1

def js_str(s):
    # </script> 조기 종료 방지
    return json.dumps(s, ensure_ascii=False).replace('</', '<\\/')

data = (f'const WORDS_JSON = {js_str(words)};\n'
        f'const RAW_KANJI = {js_str(kanji)};\n'
        f'const RAW_EX = {js_str(examples)};\n'
        f'const RAW_GRAMMAR = {js_str(grammar)};\n'
        f'const RAW_READ = {js_str(readings_raw)};')
html = (SRC / 'template.html').read_text(encoding='utf-8').replace('/*__DATA__*/', data, 1)
html = html.replace('/*__VOICE__*/', (SRC.parent / 'shared' / 'voice.js').read_text(encoding='utf-8'), 1)
OUT.write_text(html, encoding='utf-8')
print(f'OK: {OUT} ({len(html)//1024} KB, 단어 {len(words)}, 한자 {len(kmap)}, 문형 {gcount})')

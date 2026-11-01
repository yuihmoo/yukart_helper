"""よん 앱 빌드: 공용 한자 데이터 + 두 단어 세트를 template.html에 주입.

- main   (yon.html)        : 해커스 「N2 필수 단어·문형 암기장」 1~25일 단어, 26~30일 문형
- gichul (yon-gichul.html) : 최신 기출 어휘·문형 2021~2026 (기존 학습 기록 'n2:' 키 그대로 사용)
"""
import json, re, pathlib, sys
from jalign import align, k2h

SRC = pathlib.Path(__file__).parent
ROOT = SRC.parent
KRE = re.compile(r'[一-鿿]')


def lines(path):
    for ln in (SRC / path).read_text(encoding='utf-8').splitlines():
        if ln.strip() and not ln.startswith('#'):
            yield ln


# ---------- 공용 데이터: 한자 해설, 음독/훈독, 예문 ----------
kanji_raw = (SRC / 'kanji.txt').read_text(encoding='utf-8')
kmap = {}
for ln in lines('kanji.txt'):
    p = ln.split('|')
    if len(p) != 5:
        sys.exit(f'kanji.txt 형식 오류: {ln}')
    if p[0] in kmap:
        sys.exit(f'kanji.txt 중복: {p[0]}')
    kmap[p[0]] = p

read_raw = (SRC / 'readings.txt').read_text(encoding='utf-8')
RD = {}
for ln in lines('readings.txt'):
    p = ln.split('|')
    if len(p) != 3:
        sys.exit(f'readings.txt 형식 오류: {ln}')
    c, on, kun = p
    items = []
    for kind, field in (('on', on), ('kun', kun)):
        for it in filter(None, field.split(',')):
            q = it.split(':')
            if len(q) != 3 or not q[0]:
                sys.exit(f'readings.txt 항목 오류: {c} {it}')
            items.append((kind, q[0], k2h(q[0]).split('.')[0]))
    RD[c] = items

ex_raw = (SRC / 'examples.txt').read_text(encoding='utf-8')
emap = {}
for ln in lines('examples.txt'):
    p = ln.split('|')
    if len(p) != 3:
        sys.exit(f'examples.txt 형식 오류: {ln}')
    emap[p[0]] = p

# 숙자훈·오쿠리가나 생략 등 규칙으로 정렬되지 않는 단어: 한자별 읽기 수동 지정 (키가 ''이면 '특수 읽기')
OVERRIDES = json.loads((SRC / 'overrides.json').read_text(encoding='utf-8'))


def prepare_words(words, need_example):
    missing_k = sorted({c for w in words for c in w['w'] if KRE.match(c) and (c not in kmap or c not in RD)})
    missing_e = [w['w'] for w in words if need_example and w['w'] not in emap]
    if missing_k or missing_e:
        sys.exit(f'누락 한자(kanji/readings): {missing_k} / 누락 예문: {missing_e}')
    fails = []
    for w in words:
        seg = OVERRIDES.get(w['w']) or align(w['w'], w['r'], RD)
        if seg is None:          # 가나만으로 된 단어는 빈 리스트([])가 정상
            fails.append(f"{w['w']}({w['r']})"); continue
        for c, _, key in seg:   # 지정한 키는 readings.txt에 있어야 강조가 됨
            if c != '々' and key and key not in {it[1] for it in RD.get(c, [])}:
                fails.append(f"{w['w']}: {c}의 읽기 '{key}'가 readings.txt에 없음")
        w['seg'] = [list(s) for s in seg if s[0] != '々']
    if fails:
        sys.exit('읽기 정렬 실패 (readings.txt에 읽기 추가 또는 overrides.json 지정 필요): ' + ', '.join(fails))
    return words


def grammar_from_txt():
    """기출 문형: 문형|뜻|예문([정답])|해석|연도|그룹 → 공용 JSON 형식"""
    out, seen = [], set()
    for ln in lines('grammar.txt'):
        p = ln.split('|')
        if len(p) != 6 or not re.search(r'\[[^\]]+\]', p[2]):
            sys.exit(f'grammar.txt 형식 오류: {ln}')
        if p[0] in seen:
            sys.exit(f'grammar.txt 중복 문형: {p[0]}')
        seen.add(p[0])
        out.append({'p': p[0], 'm': p[1], 'ex': [{'s': p[2], 'k': p[3]}],
                    'years': [y for y in p[4].split(',') if y], 'g': p[5].strip()})
    return out


def check_grammar(gram):
    seen = set()
    for g in gram:
        if not g['p'] or not g['ex']:
            sys.exit(f'문형 데이터 오류: {g}')
        if g['p'] in seen:
            sys.exit(f'중복 문형: {g["p"]}')
        seen.add(g['p'])
        for e in g['ex']:
            if len(re.findall(r'\[[^\]]+\]', e['s'])) != 1:
                sys.exit(f'빈칸은 예문마다 정확히 1개: {g["p"]} / {e["s"]}')
    return gram


def js(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def build(out, words, gram, conf):
    used = {c for w in words for c in w['w'] if KRE.match(c)}
    kanji_sub = '\n'.join('|'.join(kmap[c]) for c in kmap if c in used)
    read_sub = '\n'.join(ln for ln in lines('readings.txt') if ln.split('|')[0] in used)
    ex_sub = '\n'.join('|'.join(emap[w['w']]) for w in words if w['w'] in emap)
    data = (f'const CONF = {js(conf)};\n'
            f'const WORDS_JSON = {js(words)};\n'
            f'const RAW_KANJI = {js(kanji_sub)};\n'
            f'const RAW_EX = {js(ex_sub)};\n'
            f'const GRAM_JSON = {js(gram)};\n'
            f'const RAW_READ = {js(read_sub)};')
    html = (SRC / 'template.html').read_text(encoding='utf-8').replace('/*__DATA__*/', data, 1)
    html = html.replace('/*__VOICE__*/', (ROOT / 'shared' / 'voice.js').read_text(encoding='utf-8'), 1)
    (ROOT / out).write_text(html, encoding='utf-8')
    print(f'OK: {out} ({len(html)//1024} KB, 단어 {len(words)}, 한자 {len(used)}, 문형 {len(gram)})')


# ---------- main: 필수 단어·문형 ----------
main_words = json.loads((SRC / 'main' / 'words.json').read_text(encoding='utf-8'))
for w in main_words:
    if not w['w'] or not w['r'] or not w['m'] or not (1 <= w['day'] <= 25):
        sys.exit(f'main/words.json 항목 오류: {w}')
    w['years'] = w.pop('yrs')
main_gram = check_grammar(json.loads((SRC / 'main' / 'grammar.json').read_text(encoding='utf-8')))
build('yon.html', prepare_words(main_words, True), main_gram, {
    'set': 'main', 'prefix': 'n2m:', 'title': 'N2 필수 단어', 'back': './index.html', 'other': './yon-gichul.html'})

# ---------- gichul: 최신 기출 ----------
gichul_words = json.loads((SRC / 'words.json').read_text(encoding='utf-8'))
build('yon-gichul.html', prepare_words(gichul_words, True), check_grammar(grammar_from_txt()), {
    'set': 'gichul', 'prefix': 'n2:', 'title': 'N2 최신 기출', 'back': './yon.html', 'other': './yon.html'})

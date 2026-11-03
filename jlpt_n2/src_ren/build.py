"""れん(TOPIK 한국어) 앱 빌드: vocab.json, hanja.json, grammar.json + grammar_blank.txt → ../ren.html"""
import json, re, sys, pathlib

SRC = pathlib.Path(__file__).parent
OUT = SRC.parent / 'ren.html'

vocab = json.loads((SRC / 'vocab.json').read_text(encoding='utf-8'))
hanja = json.loads((SRC / 'hanja.json').read_text(encoding='utf-8'))
gram = json.loads((SRC / 'grammar.json').read_text(encoding='utf-8'))

# ---- 예문: 번호|한국어 예문|日本語訳 (모든 단어에 1개씩) ----
examples = {}
for ln in (SRC / 'examples.txt').read_text(encoding='utf-8').splitlines():
    if not ln.strip() or ln.startswith('#'):
        continue
    p = ln.split('|')
    if len(p) != 3 or not p[0].isdigit() or not p[1].strip() or not p[2].strip():
        sys.exit(f'examples.txt 형식 오류: {ln}')
    if int(p[0]) in examples:
        sys.exit(f'examples.txt 중복 번호: {p[0]}')
    examples[int(p[0])] = [p[1], p[2]]

# ---- 어휘 검사: 번호 연속, 빈 값 없음 ----
nums = [v['n'] for v in vocab]
if nums != list(range(1, len(vocab) + 1)):
    sys.exit('vocab.json 번호가 1부터 연속되지 않음')
empty = [v['n'] for v in vocab if not v['ko'].strip() or not v['ja'].strip()]
if empty:
    sys.exit(f'vocab.json 빈 항목: {empty}')

# ---- 한자 대응 검사: 음절 수·순서가 실제 단어와 일치 ----
for n, pairs in hanja.items():
    syl = [c for c in vocab[int(n) - 1]['ko'] if '가' <= c <= '힣']
    if [p[0] for p in pairs] != syl[:len(pairs)]:
        sys.exit(f'hanja.json 불일치: {n} {vocab[int(n) - 1]["ko"]} {pairs}')

# ---- 문법 빈칸: [ ]를 떼면 PDF 원문 예문과 정확히 같아야 함 ----
blank = {}
for ln in (SRC / 'grammar_blank.txt').read_text(encoding='utf-8').splitlines():
    if not ln.strip() or ln.startswith('#'):
        continue
    p = ln.split('|')
    if len(p) != 3:
        sys.exit(f'grammar_blank.txt 형식 오류: {ln}')
    n, s, g = int(p[0]), p[1], p[2].strip()
    if len(re.findall(r'\[[^\]]+\]', s)) != 1:
        sys.exit(f'빈칸은 정확히 1개여야 함: {ln}')
    blank[n] = (s, g)
out_g = []
for g in gram:
    if g['n'] not in blank:
        sys.exit(f'grammar_blank.txt 누락: {g["n"]}')
    s, grp = blank[g['n']]
    if re.sub(r'[\[\]]', '', s) != g['ex'].strip():
        sys.exit(f'예문 불일치 {g["n"]}:\n  원문: {g["ex"]}\n  빈칸: {s}')
    out_g.append({**g, 's': s, 'a': re.search(r'\[([^\]]+)\]', s).group(1), 'g': grp})

js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
missing_ex = [v['n'] for v in vocab if v['n'] not in examples]
if missing_ex:
    sys.exit(f'예문 누락: {missing_ex[:20]} … ({len(missing_ex)}개)')
# 자주 쓰는 단어(freq.py 결과) — 없으면 별표 없이 빌드
_fp = SRC / 'freq.json'
freq = json.loads(_fp.read_text(encoding='utf-8')) if _fp.exists() else {'meta': None, 'words': {}}
data = f'const FREQ = {js(freq)};\n' + f'const VOCAB = {js(vocab)};\nconst HANJA = {js(hanja)};\nconst GRAM = {js(out_g)};\nconst EXAMPLES = {js(examples)};'
html = (SRC / 'template.html').read_text(encoding='utf-8').replace('/*__DATA__*/', data, 1)
html = html.replace('/*__VOICE__*/', (SRC.parent / 'shared' / 'voice.js').read_text(encoding='utf-8'), 1)
html = html.replace('/*__BACKUP__*/', (SRC.parent / 'shared' / 'backup.js').read_text(encoding='utf-8'), 1)
OUT.write_text(html, encoding='utf-8')
print(f'OK: {OUT} ({len(html)//1024} KB, 단어 {len(vocab)}, 한자어 {len(hanja)}, 문법 {len(out_g)})')

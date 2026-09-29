"""れん(TOPIK 한국어) 앱 빌드: vocab.json, hanja.json, grammar.json + grammar_blank.txt → ../ren.html"""
import json, re, sys, pathlib

SRC = pathlib.Path(__file__).parent
OUT = SRC.parent / 'ren.html'

vocab = json.loads((SRC / 'vocab.json').read_text(encoding='utf-8'))
hanja = json.loads((SRC / 'hanja.json').read_text(encoding='utf-8'))
gram = json.loads((SRC / 'grammar.json').read_text(encoding='utf-8'))

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
data = f'const VOCAB = {js(vocab)};\nconst HANJA = {js(hanja)};\nconst GRAM = {js(out_g)};'
html = (SRC / 'template.html').read_text(encoding='utf-8').replace('/*__DATA__*/', data, 1)
html = html.replace('/*__VOICE__*/', (SRC.parent / 'shared' / 'voice.js').read_text(encoding='utf-8'), 1)
OUT.write_text(html, encoding='utf-8')
print(f'OK: {OUT} ({len(html)//1024} KB, 단어 {len(vocab)}, 한자어 {len(hanja)}, 문법 {len(out_g)})')

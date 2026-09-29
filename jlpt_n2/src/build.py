"""src/ 데이터(words.json, kanji.txt, examples.txt)를 template.html에 주입해 index.html 생성."""
import json, re, pathlib, sys

SRC = pathlib.Path(__file__).parent
OUT = SRC.parent / 'index.html'

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

def js_str(s):
    # </script> 조기 종료 방지
    return json.dumps(s, ensure_ascii=False).replace('</', '<\\/')

data = (f'const WORDS_JSON = {js_str(words)};\n'
        f'const RAW_KANJI = {js_str(kanji)};\n'
        f'const RAW_EX = {js_str(examples)};')
html = (SRC / 'template.html').read_text(encoding='utf-8').replace('/*__DATA__*/', data, 1)
OUT.write_text(html, encoding='utf-8')
print(f'OK: {OUT} ({len(html)//1024} KB, 단어 {len(words)}, 한자 {len(kmap)})')

"""src/meaning.txt 일본어 검증 (SudachiPy, 사전: sudachidict_core)
1) 예문: 사전에 없는 말(OOV)이 없을 것
2) [한자]가 들어간 단어의 기본형이 핵심어와 같고, 읽기도 일치할 것
3) 관련어: 하나의 단어로 분석되고(또는 사전에 있고) 읽기가 일치할 것
사용: python3.13 tools/check_meaning.py
"""
import re, sys, pathlib
from sudachipy import dictionary, tokenizer
T = dictionary.Dictionary().tokenizer(); C = tokenizer.Tokenizer.SplitMode.C
k2h = lambda s: ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)
def reading(text):
    return k2h(''.join(m.reading_form() for m in T.tokenize(text, C)))
errs, n_item, n_group = [], 0, 0
NUM = re.compile(r'^[〇一二三四五六七八九十百千万億]+$')   # 한자 숫자는 Sudachi가 OOV로 내므로 제외
# 사전형 단독 분석 읽기가 표준 표기와 다른 경우(근거 명시)
READ_OK = {
    '就く': 'つく',   # Sudachi 단독 분석이 「づく」로 냄. 표준 읽기는 つく(就職 등)
    '言う': 'いう',   # Sudachi 발음형 「ゆう」. 표기 읽기는 いう
    '下': 'もと',     # 「〜の下で」(영향 아래)는 もと. 단독 분석은 した로 냄 → 문맥 읽기
}
WR = re.compile(r'^(.+?)\((.+?)\)$')
for ln_no, ln in enumerate(pathlib.Path(__file__).resolve().parent.parent.joinpath('src/meaning.txt').read_text(encoding='utf-8').splitlines(), 1):
    if not ln.strip() or ln.startswith('#'): continue
    if ln.startswith('@'):
        n_group += 1; continue
    p = ln.split('|')
    if len(p) != 6: errs.append(f'{ln_no}: 칸 수 {len(p)}'); continue
    kan, nu, key, sent, ko, rel = p
    n_item += 1
    m = WR.match(key)
    if not m: errs.append(f'{ln_no}: 핵심어 형식 {key}'); continue
    kw, kr = m.groups()
    if sent.count('[') != 1 or f'[{kan}]' not in sent: errs.append(f'{ln_no}: 빈칸이 [{kan}] 하나가 아님'); continue
    plain = sent.replace('[', '').replace(']', '')
    pos = plain.index(kan, sent.index('['))
    toks = list(T.tokenize(plain, C))
    oov = [t.surface() for t in toks if t.is_oov() and not NUM.match(t.surface())]
    if oov: errs.append(f'{ln_no}: 사전 밖 단어 {oov} — {plain}')
    hit = next((t for t in toks if t.begin() <= pos < t.end()), None)
    if not hit: errs.append(f'{ln_no}: 빈칸 위치 단어 없음'); continue
    if hit.dictionary_form() != kw:
        errs.append(f'{ln_no}: [{kan}] → {hit.surface()}(기본형 {hit.dictionary_form()}) ≠ 핵심어 {kw} — {plain}')
    elif reading(kw) != kr and READ_OK.get(kw) != kr:
        errs.append(f'{ln_no}: 핵심어 {kw} 읽기 {reading(kw)} ≠ {kr}')
    for r in rel.split('・'):
        mm = WR.match(r.strip())
        if not mm: errs.append(f'{ln_no}: 관련어 형식 {r}'); continue
        w, rd = mm.groups()
        if kan not in w: errs.append(f'{ln_no}: 관련어 {w}에 {kan} 없음')
        ts = list(T.tokenize(w, C))
        if any(t.is_oov() for t in ts): errs.append(f'{ln_no}: 관련어 {w} 사전 밖')
        if reading(w) != rd: errs.append(f'{ln_no}: 관련어 {w} 읽기 {reading(w)} ≠ {rd}')
print(f'묶음 {n_group}, 항목 {n_item}, 오류 {len(errs)}')
for e in errs: print(' ', e)
sys.exit(1 if errs else 0)

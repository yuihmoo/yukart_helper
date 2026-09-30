# 참고용 스크립트: 어휘 뜻(일본어)의 한자와 한국어 음절을 KANJIDIC 한국 한자음으로 대조해 hanja.json을 생성.
# 실행하려면 npm 패키지 `kanji`(KANJIDIC 데이터 포함)를 kd/kanji-0.19.3 에 풀어 두고, topik_vocab.json 경로를 맞춰야 함.
import json, re, pathlib
D = pathlib.Path('kd/kanji-0.19.3/package/dist/data')
VAR = json.load(open(D/'kanjium/kanjium-variants.json'))
_cache = {}
def ko_readings(c):
    if c in _cache: return _cache[c]
    out = set()
    for ch in [c] + [v for v in VAR.get(c, []) if len(v) == 1]:
        f = D/'kanjidic'/f'{ord(ch):x}.json'
        if not f.exists(): continue
        j = json.load(open(f))
        for g in j.get('reading_meaning', [{}])[0].get('rmgroup', []):
            for r in g.get('reading', []):
                if r['r_type'] == 'korean_h': out.add(r['$t'])
    _cache[c] = out; return out
# 두음법칙: 사전형(ㄹ/ㄴ 초성) → 어두형
def dueum(s):
    out = {s}
    base = ord(s) - 0xAC00
    if base < 0 or base > 11171: return out
    cho, jung, jong = base // 588, (base % 588) // 28, base % 28
    # ㄹ(5) → ㄴ(2) or ㅇ(11); ㄴ(2) → ㅇ(11) before ㅣ,ㅑ,ㅕ,ㅛ,ㅠ,ㅖ
    iy = {20, 2, 6, 12, 17, 7}   # ㅣ ㅑ ㅕ ㅛ ㅠ ㅖ
    mk = lambda c: chr(0xAC00 + c*588 + jung*28 + jong)
    if cho == 5: out.add(mk(11) if jung in iy else mk(2))
    if cho == 2 and jung in iy: out.add(mk(11))
    return out
def syl_ok(syl, c, first):
    for r in ko_readings(c):
        if r == syl or (first and syl in dueum(r)): return True
        if not first and syl in dueum(r): return True   # 사전에 어두형만 있는 경우 대비(드묾)
    return False
V = json.load(open('topik_vocab.json'))
res = {}; stat = {'hanja':0}
for x in V:
    ko = x['ko']; syl = [c for c in ko if '가' <= c <= '힣']
    best = None
    for opt in re.split('[、,，/]', x['ja']):
        run = re.match(r'[一-鿿々]+', opt.strip())
        if not run: continue
        K0 = run.group(0).replace('々', '')
        # 뜻 전체가 안 맞으면 앞부분(최소 2자)만이라도 맞는지 (例: 공연장=公演会場 → 공연=公演)
        for L in range(min(len(K0), len(syl)), 0, -1):
            K = K0[:L]
            if L == 1 and len(syl) > 2: break      # 한 글자만 맞는 긴 단어는 우연 일치 가능성 → 제외
            if L < len(K0) and L < 2: break
            if all(syl_ok(syl[i], K[i], i == 0) for i in range(L)):
                if not best or len(K) > len(best): best = K
                break
    if best:
        res[x['n']] = [[syl[i], best[i]] for i in range(len(best))]; stat['hanja'] += 1
print(stat, len(V))
json.dump(res, open('topik_hanja.json', 'w'), ensure_ascii=False)
import random; random.seed(3)
ks = random.sample(list(res), 40); print([(V[k-1]['ko'], V[k-1]['ja'], ''.join(h for _,h in res[k])) for k in ks])
miss = [x for x in V if x['n'] not in res and re.fullmatch(r'[一-鿿]+', x['ja'])]
print(len(miss), [(x['ko'], x['ja']) for x in miss[:60]])

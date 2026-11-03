"""れん: 한국어 '자주 쓰는 단어' 별표 → freq.json

TOPIK 기출 데이터는 공개 데이터셋을 구할 수 없어, 일반 한국어 사용 빈도(wordfreq)로 대체한다.
  - 출처: wordfreq (Robyn Speer, https://github.com/rspeer/wordfreq) 한국어 목록
    (Wikipedia·자막·뉴스·웹 등 여러 말뭉치를 합친 형태소 단위 빈도)
  - 형태소 단위라 '공부하다'는 '공부', '먹다'는 어간 '먹'으로 조회한다.
  - 한 글자 키는 조사·어미와 겹쳐 과대평가되므로(예: 가다→'가'), 조사·어미와 같은 글자는 제외하고
    나머지 한 글자 키도 가중치를 낮춘다.
  - 중급·초급 각각 상위 5% → ★★, 다음 10% → ★
실행: pip install wordfreq && python freq.py   (MeCab 불필요: 빈도 사전을 직접 조회)
"""
import json, math, pathlib, re, sys

try:
    from wordfreq import get_frequency_dict
except ImportError:
    sys.exit('wordfreq 필요: pip install wordfreq')

SRC = pathlib.Path(__file__).parent
V = json.loads((SRC / 'vocab.json').read_text(encoding='utf-8'))
D = get_frequency_dict('ko')
if len(D) < 10000:
    sys.exit(f'wordfreq 한국어 사전이 비정상적으로 작음: {len(D)}')

# 조사·어미·접사와 글자가 같아 빈도가 부풀려지는 한 글자 키
FUNC = set('이가은는을를의에도로와과고지서게기며면다요니시어아해한할된들것수등때중및더또잘못안')
SINGLE_W = 0.25
# 어간·한 글자가 흔한 다른 낱말(조사·어미·명사)과 같아 빈도를 신뢰할 수 없는 단어 → 크게 낮춤
# 예) 개다(晴れる)→'개'(犬), 날다→'날'(日), 어서→어미 '-어서', 만(万)→조사 '만'
HOMO = {'개다', '대다', '날다', '집다', '데다', '세다', '비다', '속다', '물다', '느끼하다', '상하다', '상',
        '적다', '인', '어서', '자', '전하다', '비하다', '권하다', '오', '만', '주', '알'}
HOMO_W = 0.05


def keys(ko):
    """단어 → 빈도 사전에서 조회할 형태소 키 목록(여러 개면 가장 낮은 값을 사용)"""
    ko = re.sub(r'[^가-힣 ]', '', ko).strip()
    if not ko:
        return []
    if ' ' in ko:
        return [k for part in ko.split() for k in keys(part)]
    if ko.endswith('습니까') or ko.endswith('습니다'):
        ko = ko[:-3]
        ko = ko[:-1] if ko.endswith('겠') else ko
        return [ko] if ko else []
    for suf in ('하다', '되다', '시키다'):
        if ko.endswith(suf) and len(ko) > len(suf):
            return [ko[:-len(suf)]]
    if ko.endswith('다') and len(ko) > 1:
        return [ko[:-1]]
    return [ko]


def score(ko):
    if ko in HOMO:
        f = score_raw(ko)
        return f * HOMO_W if f else None
    return score_raw(ko)


def score_raw(ko):
    ks = keys(ko)
    if not ks:
        return None
    vals = []
    for k in ks:
        f = D.get(k)
        if f is None:
            return None
        if len(k) == 1:
            if k in FUNC:
                return None
            f *= SINGLE_W
        vals.append(f)
    return min(vals)


out, meta = {}, {'source': 'wordfreq (ko)', 'method': 'general usage frequency; per level top 5% ★★, next 10% ★'}
for lv in (0, 1):
    rows = [(score(x['ko']), x) for x in V if (1 if x.get('lv') else 0) == lv]
    scored = sorted([r for r in rows if r[0]], key=lambda r: -r[0])
    n = len(rows); t2 = round(n * 0.05); t1 = round(n * 0.15)
    for i, (f, x) in enumerate(scored[:t1]):
        out[str(x['n'])] = {'tier': 2 if i < t2 else 1, 'z': round(math.log10(f) + 9, 2)}
    meta[f'lv{lv}'] = {'n': n, 'scored': len(scored), 'tier2': t2, 'tier1': t1 - t2}
    print(lv, meta[f'lv{lv}'])
    print('  ★★', [x['ko'] for _, x in scored[:t2]])
    print('  ★ head', [x['ko'] for _, x in scored[t2:t2 + 40]])
(SRC / 'freq.json').write_text(json.dumps({'meta': meta, 'words': out}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

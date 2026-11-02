"""2026년 12월 JLPT N2 어휘 출제 가능성 추정 → main/predict.json

근거 데이터
  - main/words.json : 해커스 필수 단어(2010~2019 기출 표시 ’10~’19, 문제 유형별 소분류)
  - words.json      : 2021~2026 실제 기출 어휘(연도)

방법
  '2010~19년 정보(기출 횟수·마지막 출제 연도·문제 유형·여러 일차 중복 수록)'로
  '2021~26년에 다시 출제됐는가'를 맞히는 로지스틱 회귀를 학습 → 같은 특징으로 점수를 매김.
  최근(2025~2026)에 이미 출제된 단어는 바로 다시 나오는 경우가 드물어(2021~26 중 단기 재출제 2%) 점수를 낮춤.
  검증: 2021~23 출제로 학습 → 2024~26 출제를 예측했을 때의 AUC를 함께 출력.

이 결과는 '과거 출제 패턴상 상대적으로 가능성이 높은 단어'를 고른 것이며 실제 출제를 보장하지 않는다.
외부 라이브러리 없이 실행: python predict.py
"""
import json, math, pathlib, random

SRC = pathlib.Path(__file__).parent
M = json.loads((SRC / 'main' / 'words.json').read_text(encoding='utf-8'))
G = json.loads((SRC / 'words.json').read_text(encoding='utf-8'))
recent = {x['w']: sorted({int(y) for y in x['years']}) for x in G}


def qtype(h):
    if any(k in h for k in ('한자 읽기', '탁음', '장음', '발음이 두 개', '같은 한자')): return '읽기'
    if any(k in h for k in ('모양이 비슷한', '비슷하거나 반대', '발음이 같거나')): return '표기'
    if '단어형성' in h: return '단어형성'
    if '문맥' in h: return '문맥규정'
    if '유의' in h: return '유의표현'
    if '용법' in h: return '용법'
    return '독해·청해'


# 표제어 단위로 합치기(같은 단어가 여러 일차에 실린 경우)
U = {}
for x in M:
    u = U.setdefault(x['w'], {'yrs': set(), 'days': set(), 'q': []})
    u['yrs'] |= {int(y) for y in x['yrs']}
    u['days'].add(x['day'])
    u['q'].append(qtype(x['h']))
QT = ['읽기', '표기', '단어형성', '문맥규정', '유의표현', '용법', '독해·청해']


def feats(u):
    n = len(u['yrs']); last = max(u['yrs']) if u['yrs'] else 0
    q = u['q'][0]
    f = [1.0,
         1.0 if n == 1 else 0.0, 1.0 if n >= 2 else 0.0,
         1.0 if 2010 <= last <= 2014 else 0.0, 1.0 if 2015 <= last <= 2016 else 0.0, 1.0 if last >= 2017 else 0.0,
         1.0 if len(u['days']) > 1 else 0.0]
    f += [1.0 if q == t else 0.0 for t in QT[:-1]]          # 독해·청해가 기준(0)
    return f


def fit(X, y, l2=0.5, it=3000, lr=0.3):
    w = [0.0] * len(X[0]); n = len(X)
    for _ in range(it):
        g = [0.0] * len(w)
        for xi, yi in zip(X, y):
            z = sum(a * b for a, b in zip(w, xi)); p = 1 / (1 + math.exp(-z))
            for j, a in enumerate(xi): g[j] += (p - yi) * a
        for j in range(len(w)):
            w[j] -= lr * (g[j] / n + (l2 * w[j] / n if j else 0))
    return w


def prob(w, x):
    return 1 / (1 + math.exp(-sum(a * b for a, b in zip(w, x))))


def auc(scores, labels):
    pos = [s for s, l in zip(scores, labels) if l]; neg = [s for s, l in zip(scores, labels) if not l]
    if not pos or not neg: return float('nan')
    win = sum((p > q) + 0.5 * (p == q) for p in pos for q in neg)
    return win / (len(pos) * len(neg))


words = sorted(U)
X = [feats(U[w]) for w in words]

# ---- 검증: 2021~23 출제로 학습, 2024~26 출제 예측 ----
y_tr = [1 if any(2021 <= y <= 2023 for y in recent.get(w, [])) else 0 for w in words]
y_te = [1 if any(2024 <= y <= 2026 for y in recent.get(w, [])) else 0 for w in words]
w_val = fit(X, y_tr)
val_auc = auc([prob(w_val, x) for x in X], y_te)

# ---- 본 학습: 2021~26 전체 ----
y = [1 if recent.get(w) else 0 for w in words]
wt = fit(X, y)


def recency_factor(w):
    ys = recent.get(w, [])
    if not ys: return 1.0
    last = max(ys)
    return {2026: 0.25, 2025: 0.35, 2024: 0.6, 2023: 0.8}.get(last, 0.9)


rows = []
for w, x in zip(words, X):
    u = U[w]
    p = prob(wt, x) * recency_factor(w)
    why = []
    if u['yrs']: why.append(f"기출 {len(u['yrs'])}회(마지막 {max(u['yrs'])})")
    if recent.get(w): why.append('최근 출제 ' + '·'.join(map(str, recent[w])))
    if len(u['days']) > 1: why.append('여러 유형에 중복 수록')
    why.append(u['q'][0])
    rows.append((p, w, why))
rows.sort(key=lambda r: -r[0])
n = len(rows); top2 = round(n * 0.05); top1 = round(n * 0.15)
out = {}
for i, (p, w, why) in enumerate(rows[:top1]):
    out[w] = {'tier': 2 if i < top2 else 1, 'p': round(p, 4), 'why': ' · '.join(why)}
meta = {'n': n, 'tier2': top2, 'tier1': top1 - top2, 'val_auc': round(val_auc, 3),
        'base_rate': round(sum(y) / n, 4)}
(SRC / 'main' / 'predict.json').write_text(json.dumps({'meta': meta, 'words': out}, ensure_ascii=False, indent=0), encoding='utf-8')
print('meta', meta)
print('weights', [round(v, 2) for v in wt])
print('top 25', [(w, round(p, 3)) for p, w, _ in rows[:25]])

"""단어 읽기를 한자별로 나누는 정렬기 (build.py·읽기 데이터 생성 공용)."""
import re

K = re.compile(r'[一-鿿]')
DAKU = dict(zip('かきくけこさしすせそたちつてとはひふへほ', 'がぎぐげござじずぜぞだぢづでどばびぶべぼ'))
HANDAKU = dict(zip('はひふへほ', 'ぱぴぷぺぽ'))


def k2h(s):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


def variants(stem):
    """연탁(か→が), 반탁음(は→ぱ), 촉음화(つ→っ) 변형 포함"""
    out = {stem}
    if stem and stem[0] in DAKU: out.add(DAKU[stem[0]] + stem[1:])
    if stem and stem[0] in HANDAKU: out.add(HANDAKU[stem[0]] + stem[1:])
    for v in list(out):
        if len(v) > 1 and v[-1] in 'つちくき': out.add(v[:-1] + 'っ')
    return out


def align(w, r, RD):
    """RD: 字 -> [(kind, key, stem)].  성공 시 [(字, 읽기, key)], 실패 시 None"""
    r = k2h(r); sols = []

    def cands(i, c):
        rest = w[i + 1:]
        def pri(item):
            kind, key, stem = item
            oku = key.split('.', 1)[1] if '.' in key else ''
            # 오쿠리가나가 단어 표기와 실제로 이어지는 훈독을 우선 (覚める → さ.める)
            return (-len(stem), 0 if (oku and rest.startswith(oku)) else 1)
        return sorted(RD.get(c, []), key=pri)

    def rec(i, j, acc):
        if sols: return
        if i == len(w):
            if j == len(r): sols.append(list(acc))
            return
        c = w[i]
        if c == '々':
            if not acc: return
            prev = acc[-1]
            for v in variants(prev[1]):
                if r.startswith(v, j):
                    acc.append(('々', v, prev[2])); rec(i + 1, j + len(v), acc); acc.pop()
            return
        if not K.match(c):
            if r.startswith(k2h(c), j): rec(i + 1, j + 1, acc)
            return
        for kind, key, stem in cands(i, c):
            for v in sorted(variants(stem), key=len, reverse=True):
                if r.startswith(v, j):
                    acc.append((c, v, key)); rec(i + 1, j + len(v), acc); acc.pop()
    rec(0, 0, [])
    return sols[0] if sols else None

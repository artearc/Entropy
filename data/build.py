# Builds assets/cards-data.js from data/raw.txt + data/pips.txt (hand-transcribed from the Beta 0.2 card images).
import re, json, collections, os
D = os.path.dirname(os.path.abspath(__file__))
raw = [l.rstrip('\n').split('§') for l in open(D + '/raw.txt', encoding='utf-8') if l.strip()]
pips = dict(l.rstrip('\n').split('§') for l in open(D + '/pips.txt', encoding='utf-8') if l.strip())
KW = ['Haste', 'Fast Attack', 'Fast', 'Swift', 'Taunt', 'Hold Back', 'Remains', 'Mourning', 'Aggressive', 'Frenzy',
      'Regeneration', 'Indestructible', 'Retaliate', 'Absorb', 'Stealth', 'Conquest', 'Overrun', 'Impact', 'Barrier',
      'Terror', 'Lethal', 'Upkeep', 'Trespass', 'Invade', 'Return', 'Repeal', 'Deplete', 'Populate', 'Depopulate',
      'Anchored', 'Permanence', 'Forward Deployment', 'Back Deployment', 'Chaining', 'Negative Entropy', 'Flip', 'Search', 'Void', 'Sacrifice', 'Steal', 'Marker']
out = []
for cid, name, typ, cost, stats, text in raw:
    tl = typ.lower()
    t = 'source' if tl.startswith('source') else 'unit' if tl.startswith('unit') else 'event' if tl.startswith('event') else 'structure' if tl.startswith('structure') else 'aspect'
    sub = typ.split(' - ', 1)[1] if ' - ' in typ else ''
    sudden = '(Sudden)' in typ
    p = pips[cid].split()
    c = {'id': cid, 'n': name, 't': t, 'st': typ.replace(' (Sudden)', ''), 'c': cost if cost == 'X' else int(cost), 'p': p, 'x': text}
    if sub: c['sub'] = sub
    if sudden: c['sud'] = 1
    if t == 'source' and 'Event' in typ: c['se'] = 1
    if stats.startswith('I'): c['i'] = int(stats[1:])
    elif '|' in stats:
        a, d = stats.split('|'); c['a'] = a if a == 'X' else int(a); c['d'] = d if d == 'X' else int(d)
    cols = {x[0] for x in p if x[0] in 'rgb'}
    if t == 'source':  # a source's identity also includes what it provides
        for w, k in (('(Red)', 'r'), ('(Green)', 'g'), ('(Blue)', 'b')):
            if w in text: cols.add(k)
    c['id_'] = 'n' if not cols else (cols.pop() if len(cols) == 1 else 'm')
    if any(x.endswith('+') for x in p) or '(Light)' in text: c['L'] = 1
    if any(x.endswith('-') for x in p) or '(Dark)' in text: c['D'] = 1
    found = []
    low = text.lower()
    for k in KW:
        if re.search(r'\b' + re.escape(k.lower()) + r'(s|es|ed|d|ing)?\b', low) and not (k == 'Fast' and 'fast attack' in low and low.count('fast') == low.count('fast attack')):
            found.append(k)
    if 'Unique' in typ: found.append('Unique')
    if sudden: found.append('Sudden')
    if found: c['k'] = found
    if 'any number of copies' in low: c['inf'] = 1
    out.append(c)
for c in out: c['ci'] = c.pop('id_')
js = '/* Entropy TCG Beta 0.2 card pool. Transcribed from the published card images. */\nwindow.CARDS=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(D + '/../assets/cards-data.js', 'w', encoding='utf-8').write(js)
print(len(out), collections.Counter(c['t'] for c in out), collections.Counter(c['ci'] for c in out))
kc = collections.Counter(k for c in out for k in c.get('k', []))
print(kc.most_common())
print(len(js)//1024, 'KB')

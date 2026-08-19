#!/usr/bin/env python3
"""sync-layout.py — Estampa uma semana no __planning-layout/index.html.

Uso: python3 scripts/sync-layout.py 2026-W35 [2026-W34 ...]

O viewer não lê do disco: as tarefas moram na const WEEKS e o texto das retros
na const RETROS_MD, ambas dentro do index.html. Este script faz o upsert de uma
semana nas duas, a partir de plannings/<week>/planning.json e retro.md.
Semanas que não foram pedidas não são tocadas.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, '__planning-layout', 'index.html')
NAMES = {'memory-club': 'Clube da Memória', 'yangplanet': 'Yang Planet', 'stalolabs': 'Stalo Labs'}


def js(v):
    return json.dumps(v, ensure_ascii=False)


def num(v):
    return 'null' if v is None else ('%g' % v)


def week_block(week):
    d = json.load(open(os.path.join(ROOT, 'plannings', week, 'planning.json')))
    out = ['  %s: {' % js(week), '    week: %s,' % js(week)]
    if d.get('period_label'):
        out.append('    period_label: %s,' % js(d['period_label']))
    if d.get('sprint_weeks'):
        out.append('    sprint_weeks: [%s],' % ', '.join(js(w) for w in d['sprint_weeks']))
    out += ['    start_date: %s,' % js(d['start_date']),
            '    end_date: %s,' % js(d['end_date']),
            '    hours_available: %s,' % num(d['hours_available'])]

    r = d.get('retro') or {}
    if r.get('completed'):
        tasks = [t for p in d['projects'].values() for t in p['tasks']]
        m = r.get('metrics') or {}
        out += ['    retro: {', '      completed: true,',
                '      tasks_done: %d,' % m.get('tasks_done', sum(1 for t in tasks if t['status'] == 'done')),
                '      tasks_total: %d,' % m.get('tasks_total', len(tasks)),
                '      hours_estimated: %s,' % num(m.get('hours_estimated', sum(t['estimated_hours'] or 0 for t in tasks))),
                '      hours_actual: %s,' % num(m.get('hours_actual', sum(t['actual_hours'] or 0 for t in tasks))),
                '      what_went_well: %s,' % js(r.get('what_went_well', '')),
                # planning.json usa what_blocked_me; o viewer lê what_blocked
                '      what_blocked: %s,' % js(r.get('what_blocked_me', r.get('what_blocked', ''))),
                '      what_to_change: %s' % js(r.get('what_to_change', '')),
                '    },']

    out.append('    projects: {')
    keys = [k for k in ('memory-club', 'yangplanet', 'stalolabs') if k in d['projects']]
    for i, k in enumerate(keys):
        ts = d['projects'][k]['tasks']
        out.append('      %s: { name: %s, tasks: [' % (js(k), js(NAMES.get(k, k))))
        for j, t in enumerate(ts):
            f = ['id: ' + js(t['id']), 'title: ' + js(t['title']), 'repo: ' + js(t['repo']),
                 'estimated_hours: ' + num(t['estimated_hours']),
                 'priority: ' + js(t['priority']), 'notes: ' + js(t.get('notes', ''))]
            if t['status'] in ('done', 'doing'):
                f.append('default_status: ' + js(t['status']))
            out.append('        { ' + ', '.join(f) + ' }' + (',' if j < len(ts) - 1 else ''))
        out.append('      ]}' + (',' if i < len(keys) - 1 else ''))
    out += ['    }', '  }']
    return out


def upsert(lines, open_marker, week, block, is_end):
    """Substitui ou insere a entrada de `week` no objeto que começa em open_marker.

    block vem sem vírgula final; a vírgula é decidida aqui pela posição.
    """
    start = next(i for i, l in enumerate(lines) if l.startswith(open_marker))
    end = next(i for i in range(start + 1, len(lines)) if lines[i] == '};')

    bounds, i = {}, start + 1
    while i < end:
        m = re.match(r'  "(\d{4}-W\d\d)":', lines[i])
        if m:
            j = i
            while j < end and not is_end(lines[j], j == i):
                j += 1
            bounds[m.group(1)] = (i, j)
            i = j + 1
        else:
            i += 1

    def commaed(b, yes):
        return b[:-1] + [b[-1] + ','] if yes else list(b)

    if week in bounds:
        a, b = bounds[week]
        return lines[:a] + commaed(block, lines[b].endswith(',')) + lines[b + 1:]

    before = [w for w in sorted(bounds) if w < week]
    if before:
        b = bounds[before[-1]][1]
        last = b == max(v[1] for v in bounds.values())
        if not lines[b].endswith(','):
            lines[b] += ','
        return lines[:b + 1] + commaed(block, not last) + lines[b + 1:]
    return lines[:start + 1] + commaed(block, True) + lines[start + 1:]


def ends_weeks(line, first):
    return not first and line in ('  }', '  },')


def ends_retro(line, first):
    # a entrada fecha na crase não escapada no fim da linha
    if first and not re.match(r'  "\d{4}-W\d\d": `', line):
        return False
    t = line[:-1] if line.endswith(',') else line
    return t.endswith('`') and not t.endswith('\\`') and (not first or len(t) > line.index('`') + 1)


def main(weeks):
    src = open(HTML).read().split('\n')
    for week in weeks:
        src = upsert(src, 'const WEEKS = {', week, week_block(week), ends_weeks)
        retro = os.path.join(ROOT, 'plannings', week, 'retro.md')
        if os.path.exists(retro):
            md = open(retro).read().rstrip('\n')
            md = md.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
            blk = ('  %s: `%s`' % (js(week), md)).split('\n')
            src = upsert(src, 'const RETROS_MD = {', week, blk, ends_retro)
        print('sincronizado: %s' % week)
    open(HTML, 'w').write('\n'.join(src))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('Uso: %s <week> [week ...]' % sys.argv[0])
    main(sys.argv[1:])

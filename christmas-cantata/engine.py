"""Small DSL -> LilyPond engine for the cantata medley.

Each voice is a string of LilyPond tokens in absolute pitch with an optional
"=syllable" suffix on notes.  Notes after a syllable note that carry no
syllable form a melisma (a slur is added automatically).  Bars are separated
with "|" and every bar is checked against the global bar length.
"""
import re
from fractions import Fraction as F

TOKEN_RE = re.compile(r"<[^>]*>\S*|\S+")
NOTE_RE = re.compile(
    r"^(?P<pitch><[^>]*>|[a-g](?:ss|ff|s|f)?[',]*|r|R|s)"
    r"(?P<dur>(?:32|16|8|4|2|1)\.*)?"
    r"(?P<mult>\*\d+(?:/\d+)?)?"
    r"(?P<post>[^=]*)"
    r"(?:=(?P<syl>.*))?$"
)
STEP = {"c": 0, "d": 2, "e": 4, "f": 5, "g": 7, "a": 9, "b": 11}
ACC = {"": 0, "s": 1, "f": -1, "ss": 2, "ff": -2}


class DSLError(Exception):
    pass


def dur_value(dur, mult):
    base = F(1, int(dur.rstrip(".")))
    dots = len(dur) - len(dur.rstrip("."))
    val = base
    add = base
    for _ in range(dots):
        add /= 2
        val += add
    if mult:
        m = mult[1:]
        if "/" in m:
            a, b = m.split("/")
            val *= F(int(a), int(b))
        else:
            val *= int(m)
    return val


def pitch_midi(p):
    m = re.match(r"^([a-g])(ss|ff|s|f)?([',]*)$", p)
    if not m:
        raise DSLError("bad pitch " + p)
    letter, acc, octs = m.group(1), m.group(2) or "", m.group(3)
    return 48 + STEP[letter] + ACC[acc] + 12 * octs.count("'") - 12 * octs.count(",")


def chord_pitches(p):
    if p.startswith("<"):
        return [pitch_midi(x) for x in p[1:-1].split()]
    return [pitch_midi(p)]


def split_bars(s):
    return [b.strip() for b in s.split("|")]


def tokens(s):
    return TOKEN_RE.findall(s)


class Note:
    __slots__ = ("pitch", "dur", "mult", "post", "syl", "value", "is_rest", "raw", "midi")

    def __init__(self, m, prevdur):
        self.pitch = m.group("pitch")
        self.dur = m.group("dur") or prevdur
        if self.dur is None:
            raise DSLError("missing duration")
        self.mult = m.group("mult") or ""
        self.post = m.group("post") or ""
        self.syl = m.group("syl")
        self.value = dur_value(self.dur, self.mult)
        self.is_rest = self.pitch in ("r", "R", "s")
        self.midi = None if self.is_rest else chord_pitches(self.pitch)


def parse_bar(bar, prevdur):
    """Return list of items (Note or str) and the bar duration."""
    items = []
    total = F(0)
    for tok in tokens(bar):
        m = NOTE_RE.match(tok)
        if m and not tok.startswith("\\"):
            n = Note(m, prevdur)
            prevdur = n.dur
            items.append(n)
            total += n.value
        else:
            items.append(tok)
    return items, total, prevdur


def global_bar_lengths(gstr):
    """Durations of each bar of a global string, plus time signature per bar."""
    bars = split_bars(gstr)
    lengths = []
    prevdur = None
    for bar in bars:
        toks = tokens(bar)
        total = F(0)
        i = 0
        while i < len(toks):
            t = toks[i]
            if t in ("\\time", "\\partial"):
                i += 2
                continue
            if t == "\\key":
                i += 3
                continue
            m = NOTE_RE.match(t)
            if m and not t.startswith("\\") and m.group("pitch") == "s":
                n = Note(m, prevdur)
                prevdur = n.dur
                total += n.value
            i += 1
        lengths.append(total)
    return lengths


def frac_to_dur(f):
    table = {
        F(1): "1", F(3, 4): "2.", F(1, 2): "2", F(1, 4): "4", F(3, 8): "4.",
        F(1, 8): "8", F(3, 2): "1.", F(7, 8): "2..",
    }
    if f in table:
        return table[f]
    raise DSLError("no duration for %s" % f)


def _is_hangul(ch):
    return "가" <= ch <= "힣"


def split_slot(slot):
    """'한밤,' -> ['한', '밤,'];  'Oo' -> ['Oo']."""
    if not any(_is_hangul(c) for c in slot):
        return [slot]
    parts = []
    for c in slot:
        if _is_hangul(c) or not parts:
            parts.append(c)
        else:
            parts[-1] += c
    return parts


def apply_lyrics(sec_name, vname, bars_src, slots):
    """Replace the syllables of a voice with a new list of slots.

    Each slot replaces one original syllable.  A slot holding several Hangul
    syllables spreads them over the following melisma notes of that syllable
    (breaking a tie where needed)."""
    out_bars = []
    flat = []  # (bar index, token string or Note)
    prevdur = None
    for bi, bar in enumerate(bars_src):
        for tok in tokens(bar):
            m = NOTE_RE.match(tok)
            if m and not tok.startswith("\\"):
                n = Note(m, prevdur)
                prevdur = n.dur
                flat.append([bi, n])
            else:
                flat.append([bi, tok])
    si = 0
    pending = []
    last_note = None
    for item in flat:
        n = item[1]
        if not isinstance(n, Note):
            continue
        if n.is_rest:
            if pending:
                raise DSLError("%s %s: syllables %s left over before a rest" % (sec_name, vname, pending))
            last_note = None
            continue
        if n.syl is not None:
            if pending:
                raise DSLError("%s %s: syllables %s left over" % (sec_name, vname, pending))
            if si >= len(slots):
                raise DSLError("%s %s: not enough lyric slots (%d)" % (sec_name, vname, len(slots)))
            parts = split_slot(slots[si])
            si += 1
            n.syl = parts[0]
            pending = parts[1:]
        elif pending:
            n.syl = pending.pop(0)
            if last_note is not None and "~" in last_note.post:
                last_note.post = last_note.post.replace("~", "", 1)
        last_note = n
    if pending:
        raise DSLError("%s %s: syllables %s left over at end" % (sec_name, vname, pending))
    if si != len(slots):
        raise DSLError("%s %s: %d lyric slots given, %d used" % (sec_name, vname, len(slots), si))
    for bi in range(len(bars_src)):
        toks = []
        for b, it in flat:
            if b != bi:
                continue
            if isinstance(it, Note):
                s = it.pitch + it.dur + it.mult + it.post
                if it.syl is not None:
                    s += "=" + it.syl
                toks.append(s)
            else:
                toks.append(it)
        out_bars.append(" ".join(toks))
    return out_bars


class Voice:
    """A vocal line for one section."""

    def __init__(self, name, text, has_lyrics=True):
        self.name = name
        self.bars_src = split_bars(text)
        self.has_lyrics = has_lyrics


def compile_vocal(sec_name, vname, bars_src, glens):
    """Compile bars of one voice in one section -> (ly_music, syllables, timeline)."""
    if len(bars_src) != len(glens):
        raise DSLError("%s %s: %d bars, global has %d" % (sec_name, vname, len(bars_src), len(glens)))
    prevdur = None
    all_items = []
    bar_of_item = []
    for bi, bar in enumerate(bars_src):
        items, total, prevdur = parse_bar(bar, prevdur)
        if total != glens[bi]:
            raise DSLError("%s %s bar %d: length %s, expected %s :: %s" % (sec_name, vname, bi + 1, total, glens[bi], bar))
        all_items.extend(items)
        bar_of_item.extend([bi] * len(items))
        all_items.append("|")
        bar_of_item.append(bi)
    if all_items and all_items[-1] == "|":
        all_items.pop()
        bar_of_item.pop()

    # melisma detection
    notes = [it for it in all_items if isinstance(it, Note)]
    syllables = []
    run_start = None  # syllable note index starting a run
    run_last = None
    prev_tied = False
    open_note = None

    def close_run():
        nonlocal run_start, run_last
        if run_start is not None and run_last is not None:
            run_start.post = "(" + run_start.post
            run_last.post = run_last.post + ")"
            # mark extender on syllable
            syllables[-1] = (syllables[-1][0], True)
        run_start = None
        run_last = None

    for n in notes:
        if n.is_rest:
            close_run()
            prev_tied = False
            open_note = None
            continue
        if n.syl is not None:
            close_run()
            syllables.append((n.syl, False))
            run_start = n
            run_last = None
            open_note = n
        else:
            if prev_tied:
                # tie continuation: part of the run but not by itself a melisma
                pass
            elif open_note is None:
                raise DSLError("%s %s: note %s%s without syllable" % (sec_name, vname, n.pitch, n.dur))
            else:
                run_last = n
        prev_tied = "~" in n.post
    close_run()

    # if a run's only continuation notes were ties, the slur logic above never set run_last
    out = []
    for it in all_items:
        if isinstance(it, Note):
            out.append(it.pitch + it.dur + it.mult + it.post)
        else:
            out.append(it)
    timeline = []
    t = F(0)
    for n in notes:
        timeline.append((t, n.value, None if n.is_rest else n.midi, n.is_rest))
        t += n.value
    return " ".join(out), syllables, timeline


def strip_for_piano(bars_src):
    """Reduce vocal bars to bare pitches/durations (keep ties)."""
    out = []
    prevdur = None
    for bar in bars_src:
        items, _, prevdur = parse_bar(bar, prevdur)
        toks = []
        for it in items:
            if isinstance(it, Note):
                tie = "~" if "~" in it.post else ""
                p = it.pitch
                if p == "R":
                    toks.append("R" + it.dur + it.mult)
                elif p == "s":
                    toks.append("s" + it.dur + it.mult)
                else:
                    toks.append(p + it.dur + it.mult + tie)
        out.append(" ".join(toks))
    return " | ".join(out)


def lyric_string(syllables):
    parts = []
    for syl, ext in syllables:
        hyph = syl.endswith("-") and len(syl) > 1
        text = syl[:-1] if hyph else syl
        text = text.replace('"', '\\"')
        s = '"%s"' % text
        if hyph:
            s += " --"
        elif ext:
            s += " __"
        parts.append(s)
    return " ".join(parts)


RANGES = {"S": (60, 81), "A": (55, 74), "T": (48, 69), "B": (40, 64)}
PAIRS = [("S", "A"), ("S", "T"), ("S", "B"), ("A", "T"), ("A", "B"), ("T", "B")]


def analyse(sec_name, timelines, gbar_starts, quiet=()):
    """Voice-leading checks over the onset grid of the 4 voices."""
    warnings = []
    order = ["S", "A", "T", "B"]

    def sounding(v, t):
        for (st, d, midi, rest) in timelines[v]:
            if st <= t < st + d:
                if rest:
                    return None
                return max(midi) if v == "S" else min(midi)
        return None

    def bar_of(t):
        bi = 0
        for i, s in enumerate(gbar_starts):
            if s <= t:
                bi = i
        return bi + 1

    def is_quiet(a, b, t):
        bn = bar_of(t)
        for qa, qb, lo, hi in quiet:
            if lo <= bn <= hi and (qa == "*" or (qa, qb) == (a, b)):
                return True
        return False

    def where(t):
        bi = 0
        for i, s in enumerate(gbar_starts):
            if s <= t:
                bi = i
        return "bar %d +%s" % (bi + 1, t - gbar_starts[bi])

    onsets = sorted({st for v in order for (st, d, m, r) in timelines[v]})
    for v in order:
        lo, hi = RANGES[v]
        for (st, d, midi, rest) in timelines[v]:
            if rest:
                continue
            for p in midi:
                if p < lo or p > hi:
                    warnings.append("%s %s range %d at %s" % (sec_name, v, p, where(st)))
    prev = None
    for t in onsets:
        cur = {v: sounding(v, t) for v in order}
        for a, b in [("S", "A"), ("A", "T"), ("T", "B")]:
            if cur[a] is not None and cur[b] is not None and cur[a] < cur[b]:
                warnings.append("%s crossing %s<%s at %s" % (sec_name, a, b, where(t)))
        if prev is not None:
            for a, b in PAIRS:
                if is_quiet(a, b, t):
                    continue
                pa, pb, ca, cb = prev[a], prev[b], cur[a], cur[b]
                if None in (pa, pb, ca, cb):
                    continue
                if pa == ca or pb == cb:
                    continue
                i1 = (pa - pb) % 12
                i2 = (ca - cb) % 12
                same_dir = (ca - pa) * (cb - pb) > 0
                if same_dir and i1 == i2 and i1 in (0, 7):
                    kind = "8ve" if i1 == 0 else "5th"
                    warnings.append("%s parallel %s %s-%s at %s" % (sec_name, kind, a, b, where(t)))
        prev = cur
    return warnings

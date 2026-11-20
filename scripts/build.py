"""Build t3-code-labs.json from src/base.json.

src/base.json is T3 Clawd (MIT, rohit3a/t3-clawd) with the ⌘N label changed to Ctrl+N.
This script layers the Labs changes on top and writes the theme file at the repo root.

    python scripts/build.py            # writes ./t3-code-labs.json
    t3 theme set ./t3-code-labs.json   # publishes it and switches T3 Code to it
"""
import json
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "src" / "base.json"
dst = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "t3-code-labs.json"
t = json.load(open(src, encoding="utf-8"))
c = t["css"]


def rep(old, new):
    global c
    assert c.count(old) == 1, (old[:60], c.count(old))
    c = c.replace(old, new, 1)


# 1. Header: "T3 Code" + "Labs" badge
rep('&::before{content:"T3";font-size:14.5px;font-weight:700;letter-spacing:-.02em}'
    '&::after{content:"Clawd";font-size:14.5px;font-weight:500;letter-spacing:-.01em;color:var(--o)}',
    '&::before{content:"T3 Code";font-size:14.5px;font-weight:650;letter-spacing:-.02em;white-space:nowrap}'
    '&::after{content:"Labs";font-size:9.5px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;'
    'line-height:1;padding:3px 6px 3px;border-radius:5px;color:var(--o);'
    'background:color-mix(in srgb,var(--o) 13%,transparent);'
    'border:1px solid color-mix(in srgb,var(--o) 32%,transparent)}')


def icon(body):
    svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' "
           "stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" + body + "</svg>")
    return 'url("data:image/svg+xml,' + quote(svg, safe="=:/' ") + '")'


IC = {
    "check": icon("<circle cx='12' cy='12' r='10'/><path d='m9 12 2 2 4-4'/>"),
    "clock": icon("<circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/>"),
    "refresh": icon("<path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'/><path d='M21 3v5h-5'/>"
                    "<path d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'/><path d='M8 16H3v5'/>"),
    "mail": icon("<path d='M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z'/>"
                 "<path d='m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10'/>"),
    "trash": icon("<path d='M3 6h18'/><path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'/>"
                  "<path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'/><path d='M10 11v6'/><path d='M14 11v6'/>"),
    "pin": icon("<path d='M12 17v5'/><path d='M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'/>"),
    "dot": icon("<circle cx='12' cy='12' r='3'/>"),
}

# Multi-select menu = a top-level context menu where no item has a leading icon.
# Item order from T3 source: [Unpin] Settle, [Snooze ▸], [Regenerate titles], Mark unread, Delete.
M = '[data-context-menu][data-level="0"]:not(:has(button[role=menuitem]>svg:first-child))'
B = 'button[role=menuitem]'
DEL = B + ':is([style*="destructive"],[class*="text-destructive"])'

extra = (
    # premium context menus
    "[data-context-menu]{border-radius:12px!important;border:1px solid var(--sbb);"
    "box-shadow:0 14px 36px var(--sh),0 2px 6px rgba(0,0,0,.1)!important}"
    "[data-context-menu]>div{padding:5px!important}"
    "[data-context-menu] button[role=menuitem]{min-height:32px!important;border-radius:7px!important;"
    "padding:5px 10px!important;gap:10px!important;font-size:13.5px!important;transition:background-color .12s}"
    "[data-context-menu] button[role=menuitem]:not([aria-disabled=true]):is(:hover,:focus-visible){"
    "background:color-mix(in srgb,var(--o) 13%,transparent)!important}"
    "[data-context-menu] button[role=menuitem]>svg:first-child{width:15px;height:15px;flex:none;opacity:.8}"
    "[data-context-menu] [role=separator]{margin:4px 6px!important;opacity:.7}"
    # icons for the multi-select menu
    f"{M} {B}::before{{content:\"\";flex:0 0 15px;width:15px;height:15px;opacity:.8;background:currentColor;"
    f"-webkit-mask:var(--ic,{IC['dot']}) center/contain no-repeat}}"
    # Anchored on what T3 marks semantically, not on position: the submenu (Snooze) has aria-haspopup and
    # Delete is painted with the destructive colour. The others are placed relative to those two anchors.
    f"{M} {B}:has(+{B}[aria-haspopup]),{M} {B}:first-of-type:not(:has(+{B}+{B}[aria-haspopup])){{--ic:{IC['check']}}}"
    f"{M} {B}:has(+{B}+{B}[aria-haspopup]){{--ic:{IC['pin']}}}"
    f"{M} {B}[aria-haspopup]{{--ic:{IC['clock']}}}"
    f"{M} {B}[aria-haspopup]+{B}:not(:has(+{DEL})){{--ic:{IC['refresh']}}}"
    f"{M} {B}:has(+{DEL}){{--ic:{IC['mail']}}}"
    f"{M} {DEL}{{--ic:{IC['trash']}}}"
    f"{M} {DEL}:not([aria-disabled=true]){{color:var(--err)!important;"
    f"&:is(:hover,:focus-visible){{background:color-mix(in srgb,var(--err) 13%,transparent)!important}}}}"
    # composer: accent focus glow + context strip as chips
    "[data-slot=composer-host]:focus-within{box-shadow:0 0 0 3px color-mix(in srgb,var(--o) 13%,transparent),var(--csh)!important}"
    ":is([data-slot=composer-context-strip] [data-composer-context-control],[data-slot=composer-context-strip] [data-slot=combobox-trigger]){height:26px!important;padding:0 10px!important;"
    "gap:6px!important;border-radius:999px!important;font-size:12.5px!important;"
    "background:rgba(127,127,127,.08)!important;border:1px solid var(--line)!important;"
    "transition:border-color .15s,color .15s;& svg{width:13px!important;height:13px!important}"
    "&:hover{color:var(--hi)!important;border-color:color-mix(in srgb,var(--o) 45%,transparent)!important}}"
    "[data-chat-provider-model-picker]{border-radius:8px!important;&:hover{background:rgba(127,127,127,.12)!important}}"
    # thread details card
    "[data-thread-details-card]{border:1px solid var(--sbb)!important;box-shadow:var(--csh)!important}"
)
# Observability: traffic-light usage + context meters (rows expose "Name: N% left|used")
U = 'section[aria-label="Usage limits"] [aria-label$="% left"]'
X = 'section[aria-label="Context window"] [aria-label$="% used"]'
def any_pct(base, nums, suffix):
    return ",".join(f'{base}[aria-label*=": {n}% {suffix}"]' for n in nums)
u_low, u_mid = range(0, 15), range(15, 35)
x_high, x_mid = range(85, 101), range(65, 85)
extra += (
    f":is({U},{X}){{--meter:var(--ok);border-radius:7px!important;transition:background-color .12s;"
    "&:hover{background:rgba(127,127,127,.08)!important}"
    "&>span:nth-child(2){height:5px!important;background:rgba(127,127,127,.16)!important}"
    "&>span:nth-child(2)>span{background:var(--meter)!important;"
    "box-shadow:0 0 8px color-mix(in srgb,var(--meter) 45%,transparent)}"
    "&>span:last-child{color:var(--meter)!important;font-weight:600!important}}"
    f"{X}{{--meter:var(--o)}}"
    f"{any_pct(U, u_mid, 'left')},{any_pct(X, x_mid, 'used')}{{--meter:var(--warn)}}"
    f"{any_pct(U, u_low, 'left')},{any_pct(X, x_high, 'used')}{{--meter:var(--err)}}"
    ':is(section[aria-label="Usage limits"],section[aria-label="Context window"])'
    "{border-top:1px solid var(--line)!important}"
)
# Thread details card: section eyebrows, "left" on usage values, a clear "add script" affordance.
D = "[data-thread-details-card]"
extra += (
    f"{D} section[aria-label]>div:first-child:has(>h3){{display:flex!important;min-height:0!important;"
    "margin:0 0 3px!important;padding:2px 10px 0!important}"
    f"{D} section[aria-label]>div:first-child>h3{{font-size:10.5px!important;font-weight:600!important;"
    "letter-spacing:.07em;text-transform:uppercase;color:var(--mu2)!important}"
    f"{U}>span:last-child::after{{content:\" left\";font-weight:400;font-size:11px;color:var(--mu2)}}"
    f"{D} button[aria-label=\"Add project script\"]{{border:1px dashed color-mix(in srgb,var(--mu) 38%,transparent)!important;"
    "border-radius:8px!important;margin-top:4px!important;color:var(--mu)!important;"
    "transition:border-color .15s,color .15s,background-color .15s;"
    "& svg{color:var(--o)!important}"
    "&:hover{border-color:color-mix(in srgb,var(--o) 60%,transparent)!important;color:var(--hi)!important;"
    "background:color-mix(in srgb,var(--o) 8%,transparent)!important}}"
    # tooltips: the first line (the meter's own label) stands out
    "[data-slot=tooltip-viewport]>div>span:first-child:not(:only-child){font-weight:600}"
)
# Sidebar project folders: bigger icons, count as a pill, stronger open folder, live "working" dot.
F = "li[data-testid=sidebar-project-folder]>button[data-sidebar-row]"
extra += (
    f"{F}{{height:34px!important;border-radius:9px!important;gap:10px!important;transition:background-color .12s}}"
    f"{F}>:first-child{{width:20px!important;height:20px!important;flex:0 0 20px!important;"
    "border-radius:6px!important;overflow:hidden;& :is(img,svg){width:100%!important;height:100%!important}}"
    f"{F}[aria-expanded=true]>span.truncate{{font-weight:600!important;color:var(--hi)!important}}"
    f"{F}>span.tabular-nums{{display:inline-flex;align-items:center;justify-content:center;min-width:20px;"
    "height:18px;padding:0 6px;border-radius:999px;font-size:11px!important;font-weight:500;"
    "background:rgba(127,127,127,.13);color:var(--mu)!important}"
    f"{F}[aria-expanded=true]>span.tabular-nums{{background:color-mix(in srgb,var(--o) 14%,transparent);"
    "color:var(--pk,var(--o4))!important}"
    f"{F}>span:has(>.sr-only){{animation:t3lp 1.6s ease-in-out infinite}}"
    "@keyframes t3lp{50%{opacity:.3}}"
    f"@media (prefers-reduced-motion:reduce){{{F}>span:has(>.sr-only){{animation:none}}}}"
)
# Usage → Limits dialog: one card per limit, a bar per account. Each bar is a button whose label reads
# "<account>: N% left, resets in …"; the fill keeps the account's colour, so the status rides on a ring instead.
L = '[role=dialog][aria-label=Usage]'
PB = 'button[aria-label*="% left, "]'
ROW = f'{L} section>div:has({PB})'
def pool(nums, base=PB):
    return ",".join(f'{base}[aria-label*=": {n}% left"]' for n in nums)
extra += (
    f"{L} section>h2{{font-size:14px!important;font-weight:600!important;letter-spacing:-.01em}}"
    f"{ROW}{{--lvl:var(--ok);border-radius:12px!important;border-color:var(--line)!important;"
    "background:rgba(127,127,127,.035);transition:border-color .15s,background-color .15s;"
    "&:hover{border-color:color-mix(in srgb,var(--o) 30%,var(--line))!important;background:rgba(127,127,127,.06)}"
    # title as a quiet eyebrow, the number as the hero
    "&>div:first-child>span:first-child{font-size:12px!important;font-weight:600!important;color:var(--mu)!important;"
    "letter-spacing:.02em}"
    "&>div:first-child>span:nth-child(2)>span:first-child{letter-spacing:-.03em;font-feature-settings:'tnum'}}"
    # a single-account limit: the big number takes the traffic-light colour
    f"{ROW}:not(:has({PB}~{PB}))>div:first-child>span:nth-child(2)>span:first-child{{color:var(--lvl)!important}}"
    f"{ROW}:has({pool(u_mid)}){{--lvl:var(--warn)}}"
    f"{ROW}:has({pool(u_low)}){{--lvl:var(--err)}}"
    # pace hint: ahead of pace is a warning, headroom is good news
    f'{L} [role=img][aria-label^="Ahead of pace"]{{color:var(--warn)!important}}'
    f'{L} [role=img][aria-label^="Under pace"]{{color:var(--ok)!important}}'
    # the bars: richer fill, calmer hatching, crisper pace marker, readable labels
    f"{L} {PB}{{--lvl:transparent;border-radius:8px!important;"
    "box-shadow:inset 0 0 0 1.5px var(--lvl),0 1px 0 rgba(255,255,255,.03);transition:box-shadow .15s,filter .15s;"
    "&:hover{filter:brightness(1.08)}"
    "&>div[aria-hidden]{border-radius:8px!important}"
    "&>div[aria-hidden]>div>div:first-child{opacity:.6!important;border-radius:8px!important;"
    "background-image:linear-gradient(rgba(255,255,255,.14),rgba(255,255,255,0) 60%)}"
    "&>div[aria-hidden]>div>div:nth-child(2){opacity:.11!important}"
    "&>span[aria-hidden]:first-of-type{width:2px!important;box-shadow:0 0 0 1px rgba(0,0,0,.35)}"
    "&>div:last-child{font-size:12px!important;font-weight:600;text-shadow:0 1px 2px var(--sh)}"
    "&>div:last-child>span:last-child{border-radius:6px!important;border:1px solid var(--line)}}"
    f"{L} :is({pool(u_mid)}){{--lvl:color-mix(in srgb,var(--warn) 85%,transparent)}}"
    f"{L} :is({pool(u_low)}){{--lvl:var(--err)}}"
    # Cost / Tokens / Limits switch: the active view in the accent
    f"{L} [data-slot=toggle-group] [data-slot=toggle][aria-pressed=true]{{"
    "background:color-mix(in srgb,var(--o) 16%,transparent)!important;color:var(--hi)!important}"
)
# Sidebar header, compact: search and the two icon actions share one row; New chat sits under them with its
# shortcuts beside the label (Ctrl+N, and Shift for "new thread in the current project", as T3's tooltip says).
H = 'div:has(>div.shrink-0>[aria-label="New thread"])'
rep(H + '{flex-direction:column!important;align-items:stretch!important;gap:4px!important;',
    H + '{display:grid!important;grid-template-columns:minmax(0,1fr) 34px 34px;align-items:center!important;'
    'gap:6px!important;')
rep('&>div.shrink-0>[aria-label="Add project"]::after{content:"Add project"}'
    '&>div.shrink-0>:not([aria-label="New thread"],[aria-label="Add project"]){order:-1;&::after{content:"Projects"}}',
    '&>div.shrink-0>:not([aria-label="New thread"]){justify-content:center!important;padding:0!important;'
    'height:36px!important;min-height:36px!important;max-height:36px!important;border-radius:10px!important;'
    'background:var(--sb)!important;border:1px solid var(--sbb)!important;color:var(--mu)!important;'
    '&:hover{color:var(--hi)!important;border-color:rgba(127,127,127,.3)!important}}'
    '&>div.shrink-0>:not([aria-label="New thread"],[aria-label="Add project"]){order:-1}')
rep('&>div.shrink-0>[aria-label="New thread"]{order:5;margin-top:8px!important;',
    '&>div.shrink-0>[aria-label="New thread"]{order:5;grid-column:1/-1;margin-top:4px!important;')
rep('justify-content:center!important;gap:8px!important;background:var(--o)!important;',
    'justify-content:flex-start!important;padding:0 7px 0 12px!important;gap:8px!important;background:var(--o)!important;')
KEY = ("font-size:11px;font-weight:500;letter-spacing:0;line-height:1;white-space:nowrap;"
       "color:rgba(255,255,255,.85);background:rgba(0,0,0,.15);padding:4px 6px;border-radius:5px")
rep('&::after{content:"New chat"}&::before{content:"Ctrl+N";position:absolute;right:12px;top:50%;'
    'transform:translateY(-50%);font-size:11.5px;font-weight:500;letter-spacing:0;color:rgba(255,255,255,.8);'
    'background:rgba(0,0,0,.14);padding:2px 6px;border-radius:5px}',
    # T3's New thread opens the project picker (chat.new); the ellipsis says so. Shift+click skips the picker.
    '&::after{content:"New chat\\2026";order:1}'
    f'&::before{{content:"Ctrl N";order:2;margin-left:auto;{KEY}}}'
    '&>span[aria-hidden]{display:inline-flex!important;order:3;position:static!important;width:auto!important;'
    'height:auto!important;translate:none!important;transform:none!important;'
    f'&::after{{content:"\\21E7  project";{KEY};background:rgba(0,0,0,.08);color:rgba(255,255,255,.72)}}}}')

# Breadcrumb: the project crumb starts a new thread in that project; say so with a "+" on hover.
extra += (
    'nav[aria-label="Thread breadcrumb"] button[aria-label^="New thread in "]{border-radius:6px;transition:background-color .12s;'
    '&::after{content:"+";display:none;margin-left:2px;font-weight:600;color:var(--o)}'
    '&:hover{background:rgba(127,127,127,.1);&::after{display:inline}}}'
)

# Project folders: the hover action is T3's one-click "New thread in <project>" (no picker). Make it a labelled
# accent pill so it reads as the quick way in.
extra += (
    'li[data-testid=sidebar-project-folder] button[aria-label^="New thread in "]{'
    "width:auto!important;height:22px!important;padding:0 7px 0 5px!important;gap:3px!important;"
    "border-radius:6px!important;border-color:transparent!important;font-size:11.5px!important;font-weight:600!important;"
    "color:var(--o)!important;background:color-mix(in srgb,var(--o) 13%,transparent)!important;"
    "& svg{width:13px!important;height:13px!important}"
    '&::after{content:"New";position:static!important;min-width:0!important;min-height:0!important}'
    "&:hover{background:color-mix(in srgb,var(--o) 24%,transparent)!important}}"
)

# New thread screen: the project name is a switcher (show the chevron), and "or start without a project" gets
# its shortcut (T3's tooltip: Ctrl+Alt+N).
DH = "div:has(>div>h1 [data-draft-project-trigger])"
extra += (
    '[data-draft-project-trigger]::after{content:"";width:.28em;height:.28em;margin-left:.28em;flex:none;'
    "align-self:center;border:solid currentColor;border-width:0 .07em .07em 0;rotate:45deg;translate:0 -.1em;"
    "opacity:.55;transition:opacity .15s}"
    "[data-draft-project-trigger]:hover::after,[data-draft-project-trigger][data-popup-open]::after{opacity:1}"
    f'{DH}>p>button::after{{content:"Ctrl Alt N";margin-left:8px;font-size:10.5px;font-weight:500;'
    "padding:2px 5px;border-radius:5px;border:1px solid var(--line);color:var(--mu2)}"
)

# Composer: keyboard hints while you type (T3's default bindings), and the permission mode at a glance.
CF = "[data-chat-composer-footer]>div:first-child"
extra += (
    f"{CF}{{display:flex;align-items:center;gap:10px;min-width:0}}"
    f"{CF}::after{{content:\"\\21B5  send   \\B7   \\21E7\\21B5  new line   \\B7   Ctrl \\21E7 M  model\";"
    "white-space:pre;overflow:hidden;text-overflow:ellipsis;font-size:11.5px;color:var(--mu2);"
    "opacity:0;transition:opacity .2s}"
    f"[data-chat-composer-surface]:focus-within {CF}::after{{opacity:1}}"
    f"@media (max-width:1000px){{{CF}::after{{display:none}}}}"
    '[data-slot=composer-context-strip] button[aria-label^="Permissions:"]{--pm:var(--ok);'
    "color:color-mix(in srgb,var(--pm) 80%,var(--hi))!important;"
    "border-color:color-mix(in srgb,var(--pm) 40%,transparent)!important;"
    "background:color-mix(in srgb,var(--pm) 9%,transparent)!important}"
    '[data-slot=composer-context-strip] button[aria-label="Permissions: Full access"]{--pm:var(--warn)}'
    '[data-slot=composer-context-strip] button[aria-label^="Branch:"] [title]{font-family:var(--font-mono,ui-monospace),monospace;font-size:12px}'
)

# Model picker popup: accent for the active provider, the hovered and the chosen model, and key hints.
MP = "[data-model-picker-content]"
extra += (
    f"{MP} [data-model-picker-provider] button[aria-pressed=true]{{"
    "background:color-mix(in srgb,var(--o) 16%,transparent)!important;color:var(--hi)!important;border-radius:8px!important}"
    f"{MP} [data-slot=combobox-item]{{border-radius:8px!important;transition:background-color .1s}}"
    f"{MP} [data-slot=combobox-item][data-highlighted]{{background:color-mix(in srgb,var(--o) 12%,transparent)!important}}"
    f"{MP} [data-slot=combobox-item][aria-selected=true]{{color:var(--hi)!important;font-weight:600;"
    "box-shadow:inset 2px 0 0 var(--o)}"
    "[data-model-picker-effort] [role=radio][aria-checked=true]{color:var(--o)!important;font-weight:600}"
    f"div:has(>{MP})::after{{content:\"\\2191\\2193  move   \\B7   \\21B5  choose   \\B7   Esc  close   \\B7   Ctrl \\21E7 M  toggle\";"
    "display:block;white-space:pre;padding:7px 14px 8px;font-size:11px;color:var(--mu2);"
    "border-top:1px solid var(--line)}"
)

# Command palette (Ctrl K, and the project picker New chat opens): accent row, and in the project picker a tip
# that Shift+click on New chat skips it. The picker is the palette with a Back button.
P = "[data-command-palette]"
extra += (
    f"{P} [data-slot=command-item]{{border-radius:8px!important;transition:background-color .1s}}"
    f"{P} [data-slot=command-item][data-highlighted]{{background:color-mix(in srgb,var(--o) 12%,transparent)!important;"
    "box-shadow:inset 2px 0 0 var(--o)}"
    f"{P} [data-slot=command-shortcut]{{font-variant-numeric:tabular-nums}}"
    # every other list popup (project switcher, branch picker, menus) gets the same accent row
    ":is([data-slot=combobox-popup] [data-slot=combobox-item],[data-slot=menu-popup] [data-slot=menu-item])[data-highlighted]{"
    "background:color-mix(in srgb,var(--o) 12%,transparent)!important}"
    f"{P}:has([aria-label=Back]) [data-slot=command-footer]::after{{"
    "content:\"\\21E7  click New chat to skip this\";font-size:11px;color:var(--mu2);white-space:nowrap}"
    f"@media (max-width:700px){{{P} [data-slot=command-footer]::after{{display:none}}}}"
)

# Small things: selection in the accent.
extra += "::selection{background:color-mix(in srgb,var(--o) 30%,transparent)}"
c = c + extra
assert c.count("{") == c.count("}"), "unbalanced braces"

# error colour token for both appearances
rep(":root{--sb:", ":root{--err:#E5644E;--warn:#E0A458;--ok:#6DBE8C;--sb:")
rep(":root:not(.dark){--pk:", ":root:not(.dark){--err:#B5452F;--warn:#A86A1C;--ok:#2F8F5B;--pk:")

t["name"] = "T3 Code Labs"
t["css"] = c
assert len(c) <= 50000, len(c)
with open(dst, "w", encoding="utf-8") as f:
    json.dump(t, f, ensure_ascii=False, indent=2)
print("css chars", len(c))

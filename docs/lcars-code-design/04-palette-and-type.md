# Palette, type, spacing

## The colour vocabulary

The canonical LCARS set, read out of the lcarsde screenshots:

| token | value | what it is |
|---|---|---|
| `--orchid` | `#cc99cc` | the identity block, the soft violet |
| `--cornflower` | `#9999ff` | the blue of the screen |
| `--light-blue` | `#9999cc` | the muted blue |
| `--red` | `#cc6666` | the alert colour |
| `--orange` | `#ff9966` | the warm accent |
| `--amber` | `#ff9900` | the highlight, the numbers |
| `--black` | `#000` | the gutter and the field |

The template's own names (`--bluey`, `--butterscotch`, `--true-mauve`, ...)
are in the theme CSS and mean the same colours.

## The colours by role

A role has one colour, and it keeps it. This is the table that decides every
colour on the site.

| role | colour | where it appears |
|---|---|---|
| the identity | orchid | the first block of the spine, the name cell |
| the place | cornflower | the second block of the spine |
| `nav-1` | cornflower | HOME |
| `nav-2` | orange | WORK |
| `nav-3` | butterscotch | ABOUT |
| `nav-4` | red | CONTACT |
| the language switch | barley | the last cell of the nav |
| the readout groups | the template's cycle | the digit rows |
| the window's title bar | red | the name of the page |
| the spine blocks | the template's `--panel-N-color` | the sections |
| the edge | cornflower, amber, light blue, orchid, red, orange | the segments |

**A new component picks a role. It never picks a colour.**

## The type

| use | face | notes |
|---|---|---|
| the labels | Oswald (condensed) | uppercase, letter-spaced 0.14-0.18em |
| the numbers | IBM Plex Mono | tabular, never letterspaced |
| the body | Oswald | the paragraphs are short |

Oswald carries Cyrillic, so the Russian build is the same file with no
fallback. The numeric face is monospace so the digits in the readout line
up.

## The spacing

There is one number: **8 px**. It is the gutter between two blocks, the
margin between two sections, the gap in the nav, the gap in the spine. A
section's bottom margin is 8 px; a title bar's bottom margin is 8 px; the
frame's padding is 8 px.

The exceptions are inside the content, where the type needs air: a paragraph
is 1.4 em from the next, a list row is 0.3 em from the next.

## The contrast

Black on every colour of the set clears 7:1. White is used only on black.
The muted ink (`#9a9aae`) on black clears 4.5:1 and is used for the
secondary text only.

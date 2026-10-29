# The frame

Five parts. Each has one job, and the job decides where it goes.

```
.console                      grid: 232px | 1fr, rows: auto | 1fr, gap 8px, padding 8px
├─ .console__title            the title            (grid-column 1/-1)
├─ .console__top              (grid-column 1/-1)
│  ├─ .readout                the readout field    (flex: 1)
│  │  └─ .data-cascade-wrapper > .data-column > .dc-row-N
│  └─ .console__nav           the nav              (flex: 0)
│     └─ a.nav-1 .. a.nav-4, a.lang
├─ .spine                     the spine            (grid-row 2)
│  ├─ .spine__top             > .panel-1, .panel-2
│  └─ .spine__stack           > .panel-3 .. .panel-7, .panel-spacer
├─ .console__window           the window           (grid-row 2, grid-column 2)
│  ├─ .console__content       the content
│  └─ .console__titlebar      the title bar - BELOW the window
└─ .console__edge             the edge             (fixed, 31px)
```

## The title

One line, large, right aligned, uppercase, on black. It names the page: the
person on the home, the case on a case page. It is never a heading inside
the content and never a button.

Size: `clamp(1.5rem, 1rem + 2.2vw, 3.2rem)`.

## The readout field

The grid of digits. 24 columns of 7 right-aligned rows, from the template's
own component. Two rules:

* the **numbers are ours** - the metrics of the cases, the record, the
  services, the facts. Nothing in the field is filler;
* the **colour cycles in groups** (`data-group-1/1a/2/2b/3`, 6 s) - the
  template's own keyframes, untouched. The layout never moves.

The live values (the clock, the date, the stardate, the days to the
transition, the session, the index) are the first two columns; they carry
`data-live` and are filled by the script every second.

## The nav

Four buttons, always at the top right, plus the language switch. The
colours are roles: `nav-1` .. `nav-4`. The switch is a separate cell at the
end of the row.

## The spine

The stack of tall blocks on the left. Two blocks at the top (the identity,
the place), then one block per section of the page, then the spacer.

**The heights belong to the template's CSS.** `panel-3` has a minimum
height, `panel-4` a `22vh`, `panel-6` a `29vh`, `panel-7` a `30vh`. That is
the canonical geometry and it is left alone - an inline height on a panel
is the bug that broke this frame three times.

The spine's blocks carry the section index and the section name; they
scroll to the section; the one on screen lights up.

## The window

The reading area, in the middle, right of the spine. Two rows:

* the content;
* the title bar - **below** the window, as the lcarsde manual describes. It
  carries the name of the page and the time zone.

## The edge

A fixed strip on the right: 31 px wide, a stack of 31 px segments with 8 px
gutters, the elbows alternating. It closes the frame and it is the only
thing allowed to sit over the content.

## The gutter

8 px everywhere: between the title and the top row, between the cells of the
nav, between the blocks of the spine, between the segments of the edge. It
is the one number that never changes.

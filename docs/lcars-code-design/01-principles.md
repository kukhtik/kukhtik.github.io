# The principles

Seven rules. Everything else in this package is a consequence of them.

## 1. The frame is a constant, the content is the variable

The reference frame measures the same on every one of its pages: the same
bar widths, the same spine blocks, the same readout field. Only the content
layer changes. So the frame is built once and never reflows with the text;
the content is fitted into it.

*Consequence:* the frame's geometry never comes from the content. No height
is computed from a paragraph, no block is stretched to fit a list.

## 2. One element is one shape, with one rounded end

A block in the frame is a rectangle with **one** rounded end - the elbow.
The radius is about half the block's thickness: 20 px for a 40 px cell.
Never two rounded ends on one block, never a shape assembled from several
coloured pieces.

*Consequence:* a "button" is a single element with a single background. If
it looks like three pieces, it is three elements - which is a bug.

## 3. Black is the gutter, never a background

The gap between two blocks is 8 px of black. Black is also the field the
readout lives in. It is never a card behind a block, never a panel behind
text.

*Consequence:* no rounded dark cards. A row of data is a row, not a card.

## 4. The text is knocked out in black and pushed right

Labels are uppercase, right aligned, and sit on the colour of the block they
belong to - black type on a coloured shape. The big title is the exception:
it is right aligned on black.

*Consequence:* never centre a label, never put dark text on a dark shape,
never centre the content of a block.

## 5. The numbers are the content

The readout field is not decoration. It carries the measured numbers of the
work: 11/11 checks, 96/100, 130 ms, 21 214 facts, 2 292 nodes, 500k rows.
The template fills its field with filler; ours is filled with facts.

*Consequence:* every digit in the field is traceable to the content table.

## 6. Colour is assigned by role, and a role keeps its colour

The palette is a vocabulary with typed names (`--orchid`, `--nav-1`,
`--panel-3`). A role has one colour and keeps it across the whole site.
Colour never carries meaning that is not in its role.

*Consequence:* the nav, the spine, the readout groups and the actions are
coloured by role. A new component picks a role, it does not pick a colour.

## 7. Motion is part of the language, not decoration

Motion has a cause, a duration and a limit. The reference breathes by
cycling the **colour** of its digit rows; it answers a press with
brightness; a value that changes rolls. It never fades a layout in.

*Consequence:* see `06-motion.md` for the whole vocabulary. Anything that
animates without a cause is removed.

## Where the rules come from

| rule | measured from |
|---|---|
| 1 | the ten pages of thelcars.com, all with the same frame |
| 2, 3 | the lcarsde screenshots - the elbows, the 8 px gutters |
| 4 | the lcarsde status bar, the template's text-bar and list |
| 5 | the lcarsde application menu and the template's data-cascade |
| 6 | the template's colour guide (`--panel-1-color`, `--bar-3-color`, ...) |
| 7 | the template's `data-group-*` keyframes and its `:has()` press feedback |

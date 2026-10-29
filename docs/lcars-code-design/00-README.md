# LCARS code design

The design code of the console: the vocabulary, the rules, the parts, and the
gates that keep the code and the documents from drifting apart.

It is a package, not a file. Read it in this order.

| document | what it settles |
|---|---|
| `01-principles.md` | the seven rules everything else follows from |
| `02-frame.md` | the five parts of the frame, their geometry, their places |
| `03-components.md` | the catalogue: every component, its markup, its role, its rules |
| `04-palette-and-type.md` | the colour vocabulary by role, the type, the spacing |
| `05-content-model.md` | the slot table, the two languages, the length limits, the page recipes |
| `06-motion.md` | the motion vocabulary: what moves, how fast, on what trigger |
| `07-responsive-a11y.md` | the breakpoints and the accessibility contract |
| `08-build-and-gates.md` | the pipeline and what each gate proves |
| `lcars-spec.json` | the same rules in machine-readable form - the source for the tokens |
| `reference/measured-rules.json` | the pixels behind every rule, with the source of each measurement |

## The one-paragraph version

The LCARS frame is a **constant**: a title, a readout field of numbers, a nav
of four buttons, a spine of tall blocks on the left, a window with its title
bar below it, and a strip of segments closing the right edge. The content
layer is what varies. The components - the readout field, the section title,
the row list, the picture, the actions - are the template's, and they are
used as components. The content, the numbers, the colour assignment for our
roles, the section map and the motion are ours. When a page of ours looks
like a page of theirs, the fault is ours: it means a page was copied instead
of composed.

## The rule of the whole package

> A shape is one element with one rounded end. The text is knocked out in
> black and pushed to the right. Black is the gutter, never a background.
> The numbers are the content. The frame never moves; only the content does.

Every decision below is measured, and the measurement is in
`reference/measured-rules.json`.

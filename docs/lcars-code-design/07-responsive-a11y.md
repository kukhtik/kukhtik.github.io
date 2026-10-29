# Responsive and accessibility

## The breakpoints

| width | the frame |
|---|---|
| > 900 px | the full frame: the title, the readout and the nav on top, the spine on the left, the window in the middle, the edge on the right |
| <= 900 px | the title on top, the readout and the nav under it, the spine becomes a horizontal strip of short blocks above the window, the edge is hidden |
| <= 650 px | the nav wraps, the list rows lose the third column, the images fill the width |

The spine's blocks keep their geometry on a wide screen (the template's
heights) and become 40 px wide blocks in a row on a narrow one. The frame's
grid is the only thing that changes - no block is ever re-measured by hand.

## The accessibility contract

* **one `h1` per page** - the title of the page. The frame's title is that
  `h1`; the content never adds a second one.
* every page has a `lang`, a `<title>`, a meta description and a canonical
  link.
* every image has an `alt` in **both** languages, and the alt describes the
  picture, not the file name.
* the text is black on its colour, or a light ink on black: the contrast is
  never below 4.5:1, and the labels on the blocks are above 7:1.
* the skip link is the first thing in the tab order.
* the focus is visible: a focus ring on the nav items and the buttons, in
  amber, 2 px.
* the live values are `aria-live="off"` - they change every second and a
  screen reader must not read them.
* the motion is off for `prefers-reduced-motion`.
* the language switch is a real link with an `href`, so it works without
  JavaScript.

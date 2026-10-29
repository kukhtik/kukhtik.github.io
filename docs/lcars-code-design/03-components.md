# The components

The catalogue. Every component: what it is, what it is for, where it goes,
and the rules it obeys. The components themselves are the template's; this
is how we use them.

## The frame components (ours)

### `.console__title`
The title of the page. One line, large, right aligned, uppercase.
*Where:* the top of the frame, above the readout field.
*Rules:* exactly one per page; it is not a button and it never scrolls away.

### `.readout`
The readout field: the template's `.data-cascade-wrapper` with our numbers.
*Where:* the top row, left of the nav.
*Rules:* 24 columns x 7 rows; every digit traceable to the content table;
the colour cycle is the template's.

### `.console__nav`
The four site buttons and the language switch.
*Where:* the top row, right.
*Rules:* the colour of a nav item is its role (`nav-1`..`nav-4`); the
language switch is a separate cell.

### `.spine`
The stack of blocks on the left.
*Where:* the left column, from the top to the bottom of the window.
*Rules:* the blocks are `panel-N`; the heights are the template's; one
block per section of the page; the block of the section on screen is lit
and the others are dimmed to 30 %.

### `.console__window`
The window: the content and, below it, the title bar.
*Where:* the middle, right of the spine.
*Rules:* the title bar is below the content, never above it.

### `.console__edge`
The strip of segments on the right.
*Where:* fixed to the right edge.
*Rules:* 31 px wide, 31 px segments, 8 px gutters.

## The content components (the template's)

### `.lcars-text-bar` + `<h2>`
The title of a section: a bar with the heading knocked out in black.
*Where:* the head of every section.
*Rules:* one per section; the heading is the section's name, and the bar
carries the section's colour role.

### `.lcars-list` + `<li>`
The row list: each row has an ellipse marker (34 x 18) and the row's
number comes first, in `<b>`.
*Where:* every list of facts, cases, links, results.
*Rules:* the number first, the text second, the qualifier last; a fact that
belongs to a project names the project in the row.

### `.image-frame`
The picture: an image in a frame with a five-block base.
*Where:* the case gallery.
*Rules:* the base is the signature of a picture - it is not a border; the
image carries a real `alt` in both languages; the images are small (the
gallery is a contact sheet, not a billboard).

### `.buttons` + `button-<colour>`
The actions.
*Where:* the foot of a section.
*Rules:* one colour per action type; the label is black on the colour.

### `.flexbox` + `.col`
Two columns that wrap on narrow screens.
*Where:* paired content inside the window.
*Rules:* never a table; the columns wrap instead of shrinking.

### `.lcars-bar`
An empty coloured div: a separator.
*Where:* between two blocks.

### `.blink` / `.blink-slow` / `.blink-fast`
The only blinking thing in the system.
*Where:* a live state - the availability lamp, nothing else.
*Rules:* if more than one element blinks on a screen, it is wrong.

### `.font-<colour>` / `.bullet-<colour>`
The typed colour vocabulary: the colour of a run of text, the colour of a
list marker.
*Where:* anywhere a colour is needed that is not a block.

## Our two additions

### `.metric`
A measured figure with its label and its source.
*Markup:* `<div class="metric"><span>Engineer Companion - benchmark</span><b>96/100</b></div>`
*Where:* the measured results of a case, the figures on the home page.
*Rules:* the project is named in the label; the number is in the numeric
face; the left border carries the role colour.

### `.console__titlebar`
The title bar under the window: the name of the page, the time zone.
*Where:* under `.console__content`.
*Rules:* it is a bar of blocks with 8 px gutters, like the rest.

## The rule for all of them

One component is one element with one shape. If a component needs two
coloured pieces to look right, it is two components - or one component with
the wrong markup.

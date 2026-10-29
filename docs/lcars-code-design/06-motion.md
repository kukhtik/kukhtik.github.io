# The motion

Motion is a language with a small vocabulary. Every animation below has a
cause. Anything without a cause is removed.

## The vocabulary

| motion | what moves | how | when |
|---|---|---|---|
| the readout breathes | the **colour** of the digit rows, in groups | the template's `data-group-*`, 6 s | always |
| a value turns | the digits of the cell that changed | rotateX 90 deg, 340 ms | when the value changes |
| the press answers | the block, and the frame segment next to it | brightness 118 % / 88 % | on hover and on press |
| the section enters | the section's bar | a clip wipe from the left, 340 ms | when it enters the viewport |
| the rows follow | the rows of the section | 12 px from the left, 35 ms apart | with the section |
| the spine answers | the block of the section on screen | 108 %; the others dim to 30 % | on scroll |
| the console sleeps | the whole frame | brightness 50 % | after 25 s without input |
| the lamp blinks | the availability | 1.9 s step | only while it is live |

## The rules

* **nothing fades in**. The layout does not fade. A block that arrives moves
  into place.
* **nothing scales up**. A panel does not grow; it moves.
* **140-420 ms**, decelerating: `cubic-bezier(.16,.84,.34,1)`. No bounce,
  no elastic, no spring.
* **one cause per animation**. A block that is both entering and reacting
  does two separate things at two separate times.
* **the frame never moves**. The frame is the constant; only the content
  moves inside it.
* **`prefers-reduced-motion` switches everything off**, including the
  readout's colour cycle.

## The rules for the implementation

* An animation that uses `transform` must not fight another rule on the
  same property. Use the independent `translate` property and carry the
  distance in a variable, so the "settled" state always wins.
* An animated element must never change the layout: no `width`, `height`,
  `margin` or `top` in a keyframe.
* The animation must not survive its end state. After the transition, the
  computed `translate` and `transform` must be `none` - and there is a gate
  that checks exactly that.

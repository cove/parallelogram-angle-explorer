# Parallelogram Angle Explorer

Interactive parallelogram geometry showing adjustable skew, perpendicular measurements, fixed guide lengths, and overlap.

A second diagram squares a 15 ft strip off each side. Their ends are cut at a right angle to the side while the top and bottom edges lean away, so the right strip runs over the top edge and the left strip runs under the bottom edge; both overhangs are shaded red and measured. They close only when the shape is square on.

A third diagram draws the same 65 ft and 50 ft lines parallel to the 80 ft top edge. Measured that way a foot stays a foot at any angle, so 15 + 50 = 65 puts both lines' far ends on one line and 65 + 15 fills the whole side — no overlap and nothing left over.

Live site: https://cove.github.io/parallelogram-angle-explorer/

## Development

The browser and tests both import `geometry.mjs`, which is the single source of truth for every geometry and measurement calculation.

```sh
npm test
npm run coverage
```

The coverage command enforces 100% line, function, and branch coverage for both the shared geometry module and the renderer. Tests include every slider step, boundary-adjacent values, invalid inputs, rounding thresholds, symmetry, presets, slider events, and the mobile viewport switch.

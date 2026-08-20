# Parallelogram Angle Explorer

Interactive parallelogram geometry showing adjustable skew, perpendicular measurements, fixed guide lengths, and overlap. The first diagram is labelled as the forced assessor measurements: what the parcel becomes when every dimension is taken at a right angle to the side.

A second diagram squares a 15 ft strip off each side and leaves the middle for the 50 ft. Each strip's square ends run past one leaning edge (red overlap) and stop short of the other, leaving shape uncovered (amber underlap), and the two strips eat enough width that the middle measures short of 50 ft — 45.03 ft at 69.69°. The middle carries the same square ends further from the side, so it runs over one edge and short of the other by more still — 22.22 ft at its far end. On a steep lean the strips collide outright. Everything lines up only at 90°.

A third diagram draws the same 65 ft and 50 ft lines parallel to the 80 ft top edge. Measured that way a foot stays a foot at any angle, so 15 + 50 = 65 puts both lines' far ends on one line and 65 + 15 fills the whole side — no overlap and nothing left over.

Live site: https://cove.github.io/parallelogram-angle-explorer/

## Development

The browser and tests both import `geometry.mjs`, which is the single source of truth for every geometry and measurement calculation.

```sh
npm test
npm run coverage
```

The coverage command enforces 100% line, function, and branch coverage for both the shared geometry module and the renderer. Tests include every slider step, boundary-adjacent values, invalid inputs, rounding thresholds, symmetry, presets, slider events, and the mobile viewport switch.

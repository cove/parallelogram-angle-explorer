# Parallelogram Angle Explorer

Interactive parallelogram geometry showing adjustable skew, perpendicular measurements, fixed guide lengths, and overlap. Its note also records that 14.07 / 50.72 / 15.21 cannot be reproduced at any angle, and leaves the slider to demonstrate it.

The first diagram is the forced assessor measurements.

A second diagram measures every part — 15, 50, 15 — square to the right side, chained one after the other: the last 15 ft is stepped off the far end of the 65 ft line rather than off the left edge. The top and bottom edges lean, so every part overlaps past one edge (red: ground the parcel does not have) and leaves a gap at the other (white: ground nothing claims). Both grow the further a part reaches from the side, and both close only at 90°, where the chain's 80 ft finally matches the 80 ft the parcel measures across.

A third diagram draws the same 65 ft and 50 ft lines parallel to the 80 ft top edge. Measured that way a foot stays a foot at any angle, so 15 + 50 = 65 puts both lines' far ends on one line and 65 + 15 fills the whole side — no overlap and nothing left over.

Live site: https://cove.github.io/parallelogram-angle-explorer/

## Development

The browser and tests both import `geometry.mjs`, which is the single source of truth for every geometry and measurement calculation.

Each diagram carries its own slant-angle slider and all three move together, so a phone reader can drive the geometry from wherever they are on the page.

```sh
npm test
npm run coverage
```

The coverage command enforces 100% line, function, and branch coverage for both the shared geometry module and the renderer. Tests include every slider step, boundary-adjacent values, invalid inputs, rounding thresholds, symmetry, presets, slider events, and the mobile viewport switch.

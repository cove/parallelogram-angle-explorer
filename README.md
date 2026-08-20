# Parallelogram Angle Explorer

Interactive parallelogram geometry showing adjustable skew, perpendicular measurements, fixed guide lengths, and overlap. The first diagram is labelled as the forced assessor measurements: what the parcel becomes when every dimension is taken at a right angle to the side.

A second diagram measures every part — 15, 50, 15 — square to the sides, but the top and bottom edges lean. So every part overlaps past one edge (red: ground the parcel does not have) and underlaps the other (amber: ground nothing claims). Both grow the further a part reaches from its side, and both close only at 90°, where the middle also measures a full 50 ft.

A third diagram draws the same 65 ft and 50 ft lines parallel to the 80 ft top edge. Measured that way a foot stays a foot at any angle, so 15 + 50 = 65 puts both lines' far ends on one line and 65 + 15 fills the whole side — no overlap and nothing left over.

Live site: https://cove.github.io/parallelogram-angle-explorer/

## Development

The browser and tests both import `geometry.mjs`, which is the single source of truth for every geometry and measurement calculation.

```sh
npm test
npm run coverage
```

The coverage command enforces 100% line, function, and branch coverage for both the shared geometry module and the renderer. Tests include every slider step, boundary-adjacent values, invalid inputs, rounding thresholds, symmetry, presets, slider events, and the mobile viewport switch.

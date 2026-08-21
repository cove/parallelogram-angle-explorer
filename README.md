# Parallelogram Angle Explorer

Interactive parallelogram geometry showing adjustable skew, perpendicular measurements, fixed guide lengths, and overlap. Its note also records that 14.07 / 50.72 / 15.21 cannot be reproduced at any angle, and leaves the slider to demonstrate it.

The first diagram is the forced assessor measurements.

A second diagram intentionally demonstrates the flawed right-angle fit. A 15 ft strip is squared inward from each of the parcel's own sides, and a fixed 50 ft center is fitted inward from the right strip. Away from 90°, the perpendicular parcel width is less than 80 ft, so the center overlaps the left strip (red: ground claimed twice), while their different square-ended levels leave gaps inside the parcel (white: ground nothing claims). The purple left strip visibly reaches above or below the green center as the lean reverses. Everything fits only at 90°.

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

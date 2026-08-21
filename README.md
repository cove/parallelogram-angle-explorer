# Parallelogram Angle Explorer

Interactive parallelogram geometry showing adjustable skew, perpendicular measurements, fixed guide lengths, and overlap. Its note also records that 14.07 / 50.72 / 15.21 cannot be reproduced at any angle, and leaves the slider to demonstrate it.

The first diagram is the forced assessor measurements.

A second diagram intentionally demonstrates the flawed right-angle fit. Each 15 ft end mark is carried along the slanted parcel edge and squared off from its own side, so its purple horizontal width is `15 × sin(θ)` and changes with the angle. A fixed 50 ft center is then forced inward from the right strip. Away from 90°, red shows both the center/left-strip double claim inside the parcel and the square-ended fit spilling beyond the sloping top and bottom; white shows ground left unclaimed inside. The purple left strip visibly reaches above or below the green center as the lean reverses. Everything fits only at 90°.

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

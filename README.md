# Parallelogram Angle Explorer

Interactive parallelogram geometry showing adjustable skew, perpendicular measurements, fixed guide lengths, and overlap.

A second diagram shades the 65 ft and 50 ft areas when both are measured at 90° from the right side. Because they start at the same side, the shorter one always sits inside the longer one; that shared band is shaded red and labelled as overlapping, as is any part of the 65 ft area that runs past the far edge.

Live site: https://cove.github.io/parallelogram-angle-explorer/

## Development

The browser and tests both import `geometry.mjs`, which is the single source of truth for every geometry and measurement calculation.

```sh
npm test
npm run coverage
```

The coverage command enforces 100% line, function, and branch coverage for both the shared geometry module and the renderer. Tests include every slider step, boundary-adjacent values, invalid inputs, rounding thresholds, symmetry, presets, slider events, and the mobile viewport switch.

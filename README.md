# Parallelogram Angle Explorer

Interactive parallelogram geometry showing adjustable skew, perpendicular measurements, fixed guide lengths, and overlap.

Live site: https://cove.github.io/parallelogram-angle-explorer/

## Why no slant exceeds 15 ft or 50 ft

The perpendicular spans are `15 × sin θ` and `50 × sin θ`, and `sin θ ≤ 1` for every θ, so they satisfy `15·sin θ ≤ 15 ft` and `50·sin θ ≤ 50 ft` — with equality only at θ = 90° — hence no slant reproduces a measurement above 15 ft or 50 ft. ∎

`geometry.test.mjs` checks this over every slider step, and the app repeats the bound above the calculation grid.

## Copying measurements

The **Copy live measurements** button copies only the angle-dependent values — the slant angle, outer offsets, inner span, and overlap. The fixed shape (15 + 50 + 15 = 80 ft, 165.93 ft long sides) and the fixed A/B guides are excluded, since they never change with the slider. `variableMeasurementsText` in `geometry.mjs` builds that text from the `varies` flag on each formula.

## Development

The browser and tests both import `geometry.mjs`, which is the single source of truth for every geometry and measurement calculation.

```sh
npm test
npm run coverage
```

The coverage command enforces 100% line, function, and branch coverage for both the shared geometry module and the renderer. Tests include every slider step, boundary-adjacent values, invalid inputs, rounding thresholds, symmetry, presets, slider events, and the mobile viewport switch.

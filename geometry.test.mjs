import assert from "node:assert/strict";
import test from "node:test";

import { calculateDiagram, DIMENSIONS, PRESET_ANGLES } from "./geometry.mjs";

const approximately = (actual, expected, tolerance = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

test("exports the supported presets and fixed dimensions", () => {
  assert.deepEqual(PRESET_ANGLES, {
    initial: 69.69,
    rightAngle: 90,
    reverse: 110.23,
  });
  assert.deepEqual(DIMENSIONS, {
    side: 80,
    longSide: 165.93,
    inset: 15,
    innerSpan: 50,
    arrowA: 65,
    arrowB: 50,
  });
  assert.ok(Object.isFrozen(PRESET_ANGLES));
  assert.ok(Object.isFrozen(DIMENSIONS));
});

test("calculates the initial 69.69 degree example", () => {
  const diagram = calculateDiagram(PRESET_ANGLES.initial);

  approximately(diagram.sine, 0.9378283686332146);
  approximately(diagram.cosine, 0.347099338464);
  approximately(diagram.projection, 27.767947103005028);
  approximately(diagram.measurements.perpendicularInset, 14.06742552949822);
  approximately(diagram.measurements.perpendicularInner, 46.89141843166073);
  approximately(diagram.measurements.perpendicularWidth, 75.02626949065717);
  approximately(diagram.measurements.overlap, 0.9325744705018165);
  assert.equal(diagram.formulas.outerOffsets, "15 × sin(69.69°) = 14.07 ft each");
  assert.equal(diagram.formulas.innerSpan, "50 × sin(69.69°) = 46.89 ft");
  assert.equal(
    diagram.formulas.overlap,
    "|65 − (50 + 15 × sin(69.69°))| = 0.93 ft",
  );
});

test("produces exact right-angle measurements at 90 degrees", () => {
  const diagram = calculateDiagram(PRESET_ANGLES.rightAngle);

  assert.equal(diagram.sine, 1);
  assert.equal(diagram.cosine, 0);
  assert.equal(diagram.projection, 0);
  assert.equal(diagram.shortRotation, 0);
  assert.equal(diagram.measurements.perpendicularInset, 15);
  assert.equal(diagram.measurements.perpendicularInner, 50);
  assert.equal(diagram.measurements.perpendicularWidth, 80);
  assert.equal(diagram.measurements.overlap, 0);
  assert.equal(diagram.shape[0].y, diagram.shape[1].y);
  assert.equal(diagram.shape[2].y, diagram.shape[3].y);
  assert.equal(diagram.formulas.shape, "15 + 50 + 15 = 80 ft; long sides = 165.93 ft");
  assert.equal(diagram.formulas.fixedArrows, "A = 65 ft; B = 50 ft");
  assert.equal(diagram.formulas.outerOffsets, "15 × sin(90.00°) = 15.00 ft each");
  assert.equal(diagram.formulas.innerSpan, "50 × sin(90.00°) = 50.00 ft");
  assert.equal(
    diagram.formulas.overlap,
    "|65 − (50 + 15 × sin(90.00°))| = 0.00 ft",
  );
});

test("calculates the reverse 110.23 degree preset", () => {
  const diagram = calculateDiagram(PRESET_ANGLES.reverse);

  approximately(diagram.measurements.perpendicularInset, 14.074681446105192);
  approximately(diagram.measurements.perpendicularInner, 46.91560482035064);
  approximately(diagram.measurements.perpendicularWidth, 75.06496771256101);
  approximately(diagram.measurements.overlap, 0.9253185538948083);
  assert.ok(diagram.projection < 0);
  assert.ok(diagram.shape[0].y < diagram.shape[1].y);
  assert.equal(diagram.formulas.innerSpan, "50 × sin(110.23°) = 46.92 ft");
});

test("supports both slider boundaries without negative zero", () => {
  const nearZero = calculateDiagram(1);
  const flat = calculateDiagram(180);

  approximately(nearZero.measurements.perpendicularInset, 0.26178609655925267);
  approximately(nearZero.measurements.overlap, 14.738213903440732);
  assert.equal(flat.sine, 0);
  assert.equal(flat.measurements.perpendicularInset, 0);
  assert.equal(flat.measurements.perpendicularInner, 0);
  assert.equal(flat.measurements.perpendicularWidth, 0);
  approximately(flat.measurements.overlap, 15);
  assert.equal(flat.formulas.outerOffsets, "15 × sin(180.00°) = 0.00 ft each");
  assert.equal(flat.formulas.overlap.endsWith("15.00 ft"), true);
});

test("returns a complete, internally connected drawing model", () => {
  const diagram = calculateDiagram(PRESET_ANGLES.initial);

  assert.equal(diagram.shape.length, 4);
  assert.deepEqual(diagram.insetLines.left.y2 - diagram.insetLines.left.y1, 285.3996);
  assert.equal(diagram.topDimensions.left.x2, diagram.topDimensions.inner.x1);
  assert.equal(diagram.topDimensions.inner.x2, diagram.topDimensions.right.x1);
  assert.equal(diagram.perpendicular.left.x2, diagram.perpendicular.inner.x1);
  assert.equal(diagram.perpendicular.inner.x2, diagram.perpendicular.right.x1);
  assert.equal(diagram.perpendicular.leftSquare.length, 3);
  assert.equal(diagram.perpendicular.rightSquare.length, 3);
  assert.equal(diagram.guides.overlapSpan.y1, diagram.guides.overlapExtension.y1);
  assert.equal(diagram.arc.radius, 28);
  assert.equal(diagram.angleDegrees, PRESET_ANGLES.initial);
  approximately(diagram.angleRadians, PRESET_ANGLES.initial * Math.PI / 180);
  assert.ok(diagram.topLabels.left.x < diagram.topLabels.inner.x);
  assert.ok(diagram.topLabels.inner.x < diagram.topLabels.right.x);
  assert.ok(diagram.bottomLabel.y > diagram.shape[2].y);
  assert.ok(diagram.rightSideLabel.x > diagram.shape[1].x);
});

test("rejects invalid angle values", () => {
  for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, 0, 180.01, "90"]) {
    assert.throws(
      () => calculateDiagram(invalid),
      new RangeError("angle must be a finite number from 1 through 180 degrees"),
    );
  }
});

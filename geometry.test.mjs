import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDiagram,
  calculateRightAngleAreas,
  DIMENSIONS,
  PRESET_ANGLES,
} from "./geometry.mjs";

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
  assert.deepEqual(diagram.formulas.outerOffsets, {
    expression: "15 ft × sin(69.69°)",
    result: "= 14.07 ft each",
  });
  assert.deepEqual(diagram.formulas.innerSpan, {
    expression: "50 ft × sin(69.69°)",
    result: "= 46.89 ft",
  });
  assert.equal(
    diagram.formulas.overlap.expression,
    "|65 ft − (50 ft + 15 ft × sin(69.69°))|",
  );
  assert.equal(diagram.formulas.overlap.result, "= 0.93 ft");
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
  assert.deepEqual(diagram.formulas.shape, {
    expression: "15 ft + 50 ft + 15 ft",
    result: "= 80 ft; long sides = 165.93 ft",
  });
  assert.deepEqual(diagram.formulas.fixedArrows, {
    expression: "A = 65 ft",
    result: "· B = 50 ft",
  });
  assert.equal(diagram.formulas.outerOffsets.result, "= 15.00 ft each");
  assert.equal(diagram.formulas.innerSpan.result, "= 50.00 ft");
  assert.equal(
    diagram.formulas.overlap.expression,
    "|65 ft − (50 ft + 15 ft × sin(90.00°))|",
  );
  assert.equal(diagram.formulas.overlap.result, "= 0.00 ft");
});

test("calculates the reverse 110.23 degree preset", () => {
  const diagram = calculateDiagram(PRESET_ANGLES.reverse);

  approximately(diagram.measurements.perpendicularInset, 14.074681446105192);
  approximately(diagram.measurements.perpendicularInner, 46.91560482035064);
  approximately(diagram.measurements.perpendicularWidth, 75.06496771256101);
  approximately(diagram.measurements.overlap, 0.9253185538948083);
  assert.ok(diagram.projection < 0);
  assert.ok(diagram.shape[0].y < diagram.shape[1].y);
  assert.equal(diagram.formulas.innerSpan.result, "= 46.92 ft");
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
  assert.equal(flat.formulas.outerOffsets.result, "= 0.00 ft each");
  assert.equal(flat.formulas.overlap.result, "= 15.00 ft");
});

test("supports values immediately inside both slider boundaries", () => {
  for (const angle of [1.000001, 179.999999]) {
    const diagram = calculateDiagram(angle);
    assert.equal(diagram.angleDegrees, angle);
    assert.ok(Number.isFinite(diagram.measurements.perpendicularWidth));
    assert.ok(Number.isFinite(diagram.measurements.overlap));
  }
});

test("rounds displayed overlap values on both sides of a half-cent threshold", () => {
  const threshold = Math.asin(1 - 0.005 / DIMENSIONS.inset) * 180 / Math.PI;
  const roundsUp = calculateDiagram(threshold - 0.000001);
  const roundsDown = calculateDiagram(threshold + 0.000001);

  assert.ok(roundsUp.measurements.overlap > 0.005);
  assert.ok(roundsDown.measurements.overlap < 0.005);
  assert.equal(roundsUp.formulas.overlap.result, "= 0.01 ft");
  assert.equal(roundsDown.formulas.overlap.result, "= 0.00 ft");
});

test("preserves geometry invariants at every slider step", () => {
  for (let hundredths = 100; hundredths <= 18000; hundredths += 1) {
    const angle = hundredths / 100;
    const diagram = calculateDiagram(angle);
    const { measurements } = diagram;

    approximately(
      measurements.perpendicularInset * 2 + measurements.perpendicularInner,
      measurements.perpendicularWidth,
      1e-8,
    );
    assert.ok(measurements.perpendicularWidth >= 0);
    assert.ok(measurements.perpendicularWidth <= DIMENSIONS.side);
    assert.ok(measurements.overlap >= 0);
    assert.ok(measurements.overlap <= DIMENSIONS.inset + 1e-8);
    assert.equal(diagram.shape.length, 4);
    assert.equal(diagram.topDimensions.left.x2, diagram.topDimensions.inner.x1);
    assert.equal(diagram.topDimensions.inner.x2, diagram.topDimensions.right.x1);
    assert.equal(diagram.perpendicular.left.x2, diagram.perpendicular.inner.x1);
    assert.equal(diagram.perpendicular.inner.x2, diagram.perpendicular.right.x1);

    const numericValues = [];
    const collectNumbers = (value) => {
      if (typeof value === "number") {
        numericValues.push(value);
      } else if (Array.isArray(value)) {
        value.forEach(collectNumbers);
      } else if (value && typeof value === "object") {
        Object.values(value).forEach(collectNumbers);
      }
    };
    collectNumbers(diagram);
    assert.equal(numericValues.every(Number.isFinite), true);
  }
});

test("is symmetric around 90 degrees across the supported range", () => {
  for (let hundredths = 100; hundredths <= 9000; hundredths += 25) {
    const angle = hundredths / 100;
    const mirrorAngle = 180 - angle;
    const forward = calculateDiagram(angle);
    const mirror = calculateDiagram(mirrorAngle);

    approximately(
      forward.measurements.perpendicularWidth,
      mirror.measurements.perpendicularWidth,
      1e-8,
    );
    approximately(forward.measurements.overlap, mirror.measurements.overlap, 1e-8);
    approximately(forward.projection, -mirror.projection, 1e-8);
  }
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
  for (const invalid of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    0,
    0.999999,
    180.000001,
    180.01,
    null,
    undefined,
    "90",
  ]) {
    assert.throws(
      () => calculateDiagram(invalid),
      new RangeError("angle must be a finite number from 1 through 180 degrees"),
    );
  }
});

test("measures both right-angle areas from the right side", () => {
  const areas = calculateRightAngleAreas(PRESET_ANGLES.initial);
  const [leftTop, rightTop, rightBottom, leftBottom] = areas.shape;

  // Both bands end on the right side and run back at a right angle to it.
  approximately(areas.areaA.x + areas.areaA.width, rightTop.x);
  approximately(areas.areaB.x + areas.areaB.width, rightTop.x);
  approximately(areas.areaA.width / areas.areaB.width, DIMENSIONS.arrowA / DIMENSIONS.arrowB);
  approximately(areas.areaA.y, Math.min(leftTop.y, rightTop.y));
  approximately(areas.areaA.height, Math.max(leftBottom.y, rightBottom.y) - areas.areaA.y);
  assert.deepEqual(areas.overlapArea, areas.areaB);
  approximately(areas.dimensions.a.x1, rightTop.x);
  approximately(areas.dimensions.a.x2, areas.areaA.x);
  approximately(areas.dimensions.b.x2, areas.areaB.x);
  assert.equal(areas.dimensions.a.y1, areas.dimensions.a.y2);
  assert.equal(areas.squares.a.length, 3);
  assert.equal(areas.squares.b.length, 3);
  assert.ok(areas.squares.a[1].y < areas.squares.a[0].y);
  assert.ok(areas.squares.b[1].y > areas.squares.b[0].y);
  assert.equal(areas.angleDegrees, PRESET_ANGLES.initial);
  assert.equal(areas.formulas.method.result, "· A = 65 ft · B = 50 ft");
  assert.equal(areas.formulas.width.expression, "80 ft × sin(69.69°)");
  assert.equal(areas.formulas.width.result, "= 75.03 ft across");
  assert.equal(areas.formulas.overlap.expression, "min(65 ft, 50 ft)");
  assert.equal(areas.formulas.overlap.result, "= 50.00 ft, always overlapping");
});

test("the shorter right-angle area always overlaps the longer one", () => {
  for (let angle = 1; angle <= 180; angle += 0.25) {
    const areas = calculateRightAngleAreas(angle);
    assert.equal(areas.measurements.overlap, DIMENSIONS.arrowB);
    assert.ok(areas.overlapArea.width > 0);
    assert.ok(areas.overlapArea.x >= areas.areaA.x - 1e-9);
  }
});

test("flags the part of the longer area that runs past the far edge", () => {
  const square = calculateRightAngleAreas(PRESET_ANGLES.rightAngle);
  assert.equal(square.measurements.beyond, 0);
  assert.equal(square.beyondArea.width, 0);
  assert.equal(square.formulas.beyond.expression, "max(0, 65 ft − 80.00 ft)");
  assert.equal(square.formulas.beyond.result, "= 0.00 ft past the far edge");

  const shallow = calculateRightAngleAreas(40);
  const [leftTop, , , leftBottom] = shallow.shape;
  approximately(shallow.measurements.beyond, 65 - 80 * Math.sin(40 * Math.PI / 180));
  approximately(shallow.beyondArea.x, shallow.areaA.x);
  approximately(shallow.beyondArea.y, leftTop.y);
  approximately(shallow.beyondArea.height, leftBottom.y - leftTop.y);
  approximately(shallow.labels.beyond.x, shallow.beyondArea.x + shallow.beyondArea.width / 2);
  assert.ok(shallow.labels.beyond.y < leftTop.y);
  assert.match(shallow.formulas.beyond.result, /^= 13\.58 ft past the far edge$/);
});

test("rejects invalid angles for the right-angle areas too", () => {
  assert.throws(() => calculateRightAngleAreas(0), RangeError);
  assert.throws(() => calculateRightAngleAreas(Number.NaN), RangeError);
});

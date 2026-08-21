import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDiagram,
  calculateParallelAreas,
  calculateRightAngleAreas,
  DIMENSIONS,
  PRESET_ANGLES,
} from "./geometry.mjs?v=7";

const approximately = (actual, expected, tolerance = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

// The angle every worked figure below was computed by hand for. It is no
// longer the sliders' starting angle, so it is pinned here rather than read
// from the presets.
const EXAMPLE_ANGLE = 69.69;

test("exports the supported presets and fixed dimensions", () => {
  assert.deepEqual(PRESET_ANGLES, {
    initial: 110.23,
    rightAngle: 90,
    angle11254: 112.54,
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
  const diagram = calculateDiagram(EXAMPLE_ANGLE);

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
    "15 ft − 15 ft × sin(69.69°)",
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
    "15 ft − 15 ft × sin(90.00°)",
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

test("the 112.54 degree preset produces the requested overlap", () => {
  const diagram = calculateDiagram(PRESET_ANGLES.angle11254);

  approximately(
    diagram.measurements.perpendicularInset + diagram.measurements.overlap,
    DIMENSIONS.inset,
  );
  assert.equal(diagram.formulas.overlap.result, "= 1.15 ft");
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
  const diagram = calculateDiagram(EXAMPLE_ANGLE);

  assert.equal(diagram.shape.length, 4);
  assert.deepEqual(diagram.insetLines.left.y2 - diagram.insetLines.left.y1, 285.3996);
  assert.equal(diagram.topDimensions.left.x2, diagram.topDimensions.inner.x1);
  assert.equal(diagram.topDimensions.inner.x2, diagram.topDimensions.right.x1);
  assert.equal(diagram.perpendicular.left.x2, diagram.perpendicular.inner.x1);
  assert.equal(diagram.perpendicular.inner.x2, diagram.perpendicular.right.x1);
  assert.equal(diagram.perpendicular.leftSquare.length, 3);
  assert.equal(diagram.perpendicular.rightSquare.length, 3);
  assert.equal(diagram.guides.overlapExtentA.x1, diagram.guides.a.x2);
  assert.equal(Object.hasOwn(diagram.guides, "overlapExtentB"), false);
  assert.equal(
    diagram.guides.overlapExtentA.y2 - diagram.guides.overlapExtentA.y1,
    diagram.insetLines.left.y2 - diagram.insetLines.left.y1,
  );
  assert.equal(diagram.guides.overlapSpan.x1, diagram.guides.overlapExtentA.x1);
  assert.equal(diagram.guides.overlapSpan.x2, diagram.guides.b.x2);
  assert.equal(diagram.arc.radius, 28);
  assert.equal(diagram.angleDegrees, EXAMPLE_ANGLE);
  approximately(diagram.angleRadians, EXAMPLE_ANGLE * Math.PI / 180);
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
  const areas = calculateRightAngleAreas(EXAMPLE_ANGLE);
  const [leftTop, rightTop, rightBottom, leftBottom] = areas.shape;
  // Feet to drawing units, recovered from a band whose width in feet is known.
  const scale = areas.areaA.width / DIMENSIONS.arrowA;

  // A runs back from the right side itself; B starts where the 15 ft inset
  // lands when it is stepped off along the leaning edge, so the two ends miss
  // each other by the amount both claim.
  approximately(areas.areaA.x + areas.areaA.width, rightTop.x);
  approximately(
    areas.areaB.x + areas.areaB.width,
    rightTop.x - DIMENSIONS.inset * Math.sin(EXAMPLE_ANGLE * Math.PI / 180) * scale,
  );
  approximately(areas.areaA.width / areas.areaB.width, DIMENSIONS.arrowA / DIMENSIONS.arrowB);
  approximately(areas.abOverlapPlaceholder ?? 0, 0);
  approximately(areas.areaA.y, Math.min(leftTop.y, rightTop.y));
  approximately(areas.areaA.height, Math.max(leftBottom.y, rightBottom.y) - areas.areaA.y);
  assert.equal(areas.strips.right.width, areas.strips.left.width);
  approximately(areas.dimensions.a.x1, rightTop.x);
  approximately(areas.dimensions.a.x2, areas.areaA.x);
  approximately(areas.dimensions.b.x2, areas.areaB.x);
  assert.equal(areas.dimensions.a.y1, areas.dimensions.a.y2);
  assert.equal(areas.squares.a.length, 3);
  assert.equal(areas.squares.b.length, 3);
  assert.ok(areas.squares.a[1].y < areas.squares.a[0].y);
  assert.ok(areas.squares.b[1].y > areas.squares.b[0].y);
  assert.equal(areas.angleDegrees, EXAMPLE_ANGLE);
  assert.equal(areas.formulas.method.result, "· A = 65 ft · B = 50 ft");
  assert.equal(areas.formulas.width.expression, "80 ft × sin(69.69°)");
  assert.equal(areas.formulas.width.result, "= 75.03 ft across");
  assert.equal(
    areas.formulas.overhang.expression,
    "15 ft × |cos(69.69°)| ÷ sin(69.69°)",
  );
  assert.equal(
    areas.formulas.overhang.result,
    "= 5.55 ft over one edge, short of the other",
  );
});

test("steps 15, 50 and 15 off the side at a right angle", () => {
  const areas = calculateRightAngleAreas(EXAMPLE_ANGLE);
  const [leftTop, rightTop] = areas.shape;
  const span = ({ x1, x2 }) => Math.abs(x2 - x1) / 1.72;

  assert.equal(areas.formulas.chain.expression, "15 ft + 50 ft + 15 ft");
  assert.equal(areas.formulas.chain.result, "= 80 ft of room needed at 90°");
  approximately(areas.chain.rightInset.x1, rightTop.x);
  approximately(areas.chain.rightInset.x2, areas.chain.inner.x1);
  approximately(areas.chain.inner.x2, areas.chain.leftInset.x1);
  approximately(span(areas.chain.rightInset), DIMENSIONS.inset);
  approximately(span(areas.chain.inner), DIMENSIONS.innerSpan);
  approximately(span(areas.chain.leftInset), DIMENSIONS.inset);
  for (const segment of Object.values(areas.chain)) {
    assert.equal(segment.y1, segment.y2);
  }
  assert.equal(areas.chain.rightInset.y1, rightTop.y);
  approximately(areas.labels.chainInner.x, (areas.chain.inner.x1 + areas.chain.inner.x2) / 2);
  assert.equal(areas.farEdgeWitness.x1, leftTop.x);
  assert.equal(areas.farEdgeWitness.x2, leftTop.x);
  assert.equal(areas.squares.chain.length, 3);
  approximately(areas.measurements.perpendicularWidth, DIMENSIONS.side * Math.sin(
    EXAMPLE_ANGLE * Math.PI / 180,
  ));
});

test("squares a 15 ft strip off each side, ends cut at a right angle", () => {
  const areas = calculateRightAngleAreas(EXAMPLE_ANGLE);
  const [leftTop, rightTop, rightBottom, leftBottom] = areas.shape;

  // Each strip hugs its own side and is 15 ft wide measured square off it.
  approximately(areas.strips.right.x + areas.strips.right.width, rightTop.x);
  approximately(areas.strips.left.x, leftTop.x);
  approximately(areas.strips.right.width / 1.72, DIMENSIONS.inset);
  approximately(areas.strips.left.width / 1.72, DIMENSIONS.inset);

  // Square ends: each strip spans exactly its own side, top corner to bottom.
  approximately(areas.strips.right.y, rightTop.y);
  approximately(areas.strips.right.height, rightBottom.y - rightTop.y);
  approximately(areas.strips.left.y, leftTop.y);
  approximately(areas.strips.left.height, leftBottom.y - leftTop.y);
  approximately(areas.strips.right.height, areas.strips.left.height);

  // Those square ends sit clear of the leaning top and bottom edges.
  const radians = EXAMPLE_ANGLE * Math.PI / 180;
  approximately(
    areas.measurements.overhang,
    DIMENSIONS.inset * Math.abs(Math.cos(radians)) / Math.sin(radians),
  );
  approximately(areas.labels.rightStrip.x, rightTop.x - areas.strips.right.width / 2);
  approximately(areas.labels.leftStrip.x, leftTop.x + areas.strips.left.width / 2);
  // Corner labels sit outside their strip, and the lean decides which corner
  // is an overlap and which is a gap.
  assert.equal(areas.leansRight, true);
  assert.equal(calculateRightAngleAreas(PRESET_ANGLES.reverse).leansRight, false);
  assert.ok(areas.labels.rightTop.x > rightTop.x);
  assert.ok(areas.labels.rightBottom.x > rightTop.x);
  assert.ok(areas.labels.leftTop.x < leftTop.x);
  assert.ok(areas.labels.leftBottom.x < leftTop.x);

  // The uncovered slivers are measured off the same strip columns.
  approximately(areas.stripColumns.right.x, areas.strips.right.x);
  approximately(areas.stripColumns.left.width, areas.strips.left.width);
  assert.ok(areas.stripColumns.right.height > areas.strips.right.height);
  assert.ok(areas.labels.rightStrip.y < (rightTop.y + rightBottom.y) / 2);
  assert.ok(areas.labels.leftStrip.y > (leftTop.y + leftBottom.y) / 2);
});

test("the middle only measures a full 50 ft when the shape is square on", () => {
  const square = calculateRightAngleAreas(PRESET_ANGLES.rightAngle);
  assert.equal(square.measurements.middle, DIMENSIONS.innerSpan);
  assert.equal(square.measurements.middleShort, 0);
  assert.equal(square.stripsCollide, false);
  assert.equal(square.formulas.middle.expression, "80.00 ft − 15 ft − 15 ft");
  assert.equal(square.formulas.middle.result, "= 50.00 ft for a 50 ft middle");
  assert.equal(square.formulas.middleShort.result, "= 0.00 ft short in the middle");
  assert.equal(square.measurements.middleEnds, 0);
  assert.equal(calculateRightAngleAreas(180).measurements.middleEnds, 0);

  const areas = calculateRightAngleAreas(EXAMPLE_ANGLE);
  approximately(
    areas.measurements.middle,
    areas.measurements.perpendicularWidth - DIMENSIONS.inset * 2,
  );
  approximately(areas.middleArea.x, areas.strips.left.x + areas.strips.left.width);
  approximately(
    areas.middleArea.x + areas.middleArea.width,
    areas.strips.right.x,
  );
  assert.equal(areas.formulas.middleShort.result, "= 4.97 ft short in the middle");

  // The middle keeps the right strip's square ends, so it leaves the leaning
  // edges further behind the further it runs from the side.
  approximately(areas.middleArea.y, areas.strips.right.y);
  approximately(areas.middleArea.height, areas.strips.right.height);
  approximately(areas.middleColumn.x, areas.middleArea.x);
  assert.ok(areas.middleColumn.height > areas.middleArea.height);
  assert.ok(areas.measurements.middleEnds > areas.measurements.overhang);
  assert.equal(areas.formulas.middleEnds.result, "= 22.22 ft at the middle's far end");
  approximately(areas.labels.middleTop.y, areas.strips.right.y + 26);

  // Leaned far enough the strips cross, and the middle is gone entirely.
  const steep = calculateRightAngleAreas(20);
  assert.equal(steep.stripsCollide, true);
  assert.ok(steep.measurements.middle < 0);
  approximately(steep.middleArea.x, steep.strips.right.x);
  approximately(
    steep.middleArea.x + steep.middleArea.width,
    steep.strips.left.x + steep.strips.left.width,
  );
});

test("the strips hang over the top and bottom at every angle but 90", () => {
  for (let angle = 1; angle <= 180; angle += 0.25) {
    const areas = calculateRightAngleAreas(angle);
    // 180 degrees is the flat, zero-width case and is checked on its own.
    const squareOn = Math.abs(angle - PRESET_ANGLES.rightAngle) < 1e-9;
    if (angle < 180) {
      assert.equal(areas.measurements.overhang === 0, squareOn);
    }
    assert.ok(areas.measurements.overhang >= 0);
  }
});

test("a flattened shape leaves nothing for the strips to hang over", () => {
  const flat = calculateRightAngleAreas(180);
  assert.equal(flat.measurements.overhang, 0);
  assert.equal(
    flat.formulas.overhang.result,
    "= 0.00 ft over one edge, short of the other",
  );
});

test("rejects invalid angles for the right-angle areas too", () => {
  assert.throws(() => calculateRightAngleAreas(0), RangeError);
  assert.throws(() => calculateRightAngleAreas(Number.NaN), RangeError);
});

test("draws the 65 and 50 ft lines parallel to the top edge", () => {
  const fit = calculateParallelAreas(EXAMPLE_ANGLE);
  const [leftTop, rightTop, rightBottom, leftBottom] = fit.shape;
  const topLength = Math.hypot(leftTop.x - rightTop.x, leftTop.y - rightTop.y);
  const length = ({ x1, y1, x2, y2 }) => Math.hypot(x2 - x1, y2 - y1);
  const direction = ({ x1, y1, x2, y2 }) => Math.atan2(y2 - y1, x2 - x1);

  // The top edge is exactly 80 ft long, so both guides keep their true length.
  approximately(topLength / 1.72, DIMENSIONS.side, 1e-9);
  approximately(length(fit.guides.a) / 1.72, DIMENSIONS.arrowA, 1e-9);
  approximately(length(fit.guides.b) / 1.72, DIMENSIONS.innerSpan, 1e-9);
  approximately(
    direction(fit.guides.a),
    Math.atan2(leftTop.y - rightTop.y, leftTop.x - rightTop.x),
  );
  approximately(direction(fit.guides.b), direction(fit.guides.a));

  assert.equal(fit.rotation, EXAMPLE_ANGLE - 90);
  approximately(fit.strips.rightInset.x + fit.strips.rightInset.width, rightTop.x);
  approximately(fit.strips.leftInset.x, leftTop.x);
  approximately(
    fit.strips.rightInset.width + fit.strips.inner.width + fit.strips.leftInset.width,
    rightTop.x - leftTop.x,
  );
  approximately(fit.strips.rightInset.width, fit.strips.leftInset.width);
  approximately(fit.strips.rightInset.y, Math.min(leftTop.y, rightTop.y));
  approximately(
    fit.strips.inner.height,
    Math.max(leftBottom.y, rightBottom.y) - fit.strips.inner.y,
  );
  assert.equal(fit.formulas.method.result, "· no sine, no shrink");
  assert.equal(fit.formulas.reach.expression, "15 ft + 50 ft");
  assert.equal(fit.formulas.reach.result, "= 65.00 ft, exactly where A ends");
  assert.equal(fit.formulas.total.expression, "65 ft + 15 ft");
  assert.equal(fit.formulas.total.result, "= 80.00 ft, the whole side");
  assert.equal(fit.formulas.gap.expression, "|65 ft − (15 ft + 50 ft)|");
  assert.equal(fit.formulas.gap.result, "= 0.00 ft at every angle");
});

test("both parallel guides end on the same line at every angle", () => {
  for (let angle = 1; angle <= 180; angle += 0.25) {
    const fit = calculateParallelAreas(angle);
    assert.equal(fit.measurements.gap, 0);
    assert.equal(fit.measurements.reach, DIMENSIONS.arrowA);
    assert.equal(fit.measurements.topEdge, DIMENSIONS.side);
    approximately(fit.guides.a.x2, fit.guides.b.x2, 1e-9);
    approximately(fit.matchLine.x1, fit.matchLine.x2, 1e-9);
    assert.ok(fit.labels.match.x >= fit.guides.a.x2 - 10);
    assert.ok(fit.labels.match.x >= 265);
  }
});

test("rejects invalid angles for the parallel diagram too", () => {
  assert.throws(() => calculateParallelAreas(181), RangeError);
  assert.throws(() => calculateParallelAreas("90"), RangeError);
});

test("shades where A and B run into the left 15 ft strip", () => {
  // Square on there is exactly 15 + 50 + 15 of room, so neither line reaches
  // past the left strip and nothing is shaded.
  const square = calculateRightAngleAreas(PRESET_ANGLES.rightAngle);
  approximately(square.measurements.leftStripOverlapA, 0);
  approximately(square.measurements.leftStripOverlapB, 0);
  approximately(square.leftStripOverlaps.a.rect.width, 0);

  const leaning = calculateRightAngleAreas(PRESET_ANGLES.reverse);
  const sine = Math.sin(PRESET_ANGLES.reverse * Math.PI / 180);
  const stripStart = DIMENSIONS.side * sine - DIMENSIONS.inset;
  approximately(leaning.measurements.leftStripOverlapA, DIMENSIONS.arrowA - stripStart);
  approximately(
    leaning.measurements.leftStripOverlapB,
    DIMENSIONS.arrowB + DIMENSIONS.inset * sine - stripStart,
  );
  assert.ok(leaning.measurements.leftStripOverlapA > leaning.measurements.leftStripOverlapB);

  // Each shaded run ends where the left strip begins and reaches back along
  // its own line, in the same units the bands are drawn in.
  const scale = leaning.areaA.width / DIMENSIONS.arrowA;
  const stripInnerX = leaning.strips.left.x + leaning.strips.left.width;
  for (const key of ["a", "b"]) {
    const { rect, feet } = leaning.leftStripOverlaps[key];
    approximately(rect.x + rect.width, stripInnerX);
    approximately(rect.width, feet * scale);
    // Full length of the shape, like the strip it eats into.
    approximately(rect.y, leaning.areaA.y);
    approximately(rect.height, leaning.areaA.height);
  }
  assert.equal(
    leaning.formulas.leftStripOverlapA.expression,
    "65 ft − (80 ft × sin(110.23°) − 15 ft)",
  );
  assert.equal(
    leaning.formulas.leftStripOverlapA.result,
    `= ${leaning.measurements.leftStripOverlapA.toFixed(2)} ft`,
  );
  assert.equal(
    leaning.formulas.leftStripOverlapB.expression,
    "(50 ft + 15 ft × sin(110.23°)) − (80 ft × sin(110.23°) − 15 ft)",
  );
  assert.equal(
    leaning.formulas.leftStripOverlapB.result,
    `= ${leaning.measurements.leftStripOverlapB.toFixed(2)} ft`,
  );
});

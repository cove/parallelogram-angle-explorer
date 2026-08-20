export const PRESET_ANGLES = Object.freeze({
  initial: 69.69,
  rightAngle: 90,
  reverse: 110.23,
});

export const DIMENSIONS = Object.freeze({
  side: 80,
  longSide: 165.93,
  inset: 15,
  innerSpan: 50,
  arrowA: 65,
  arrowB: 50,
});

const SCALE = 1.72;
const CENTER_X = 300;
const CENTER_Y = 250;
const INNER_DIMENSION_OFFSET = 23;
const LABEL_OFFSET = 8;
const EXTENSION_START = 3;
const EXTENSION_END = INNER_DIMENSION_OFFSET + 6;
const ARC_RADIUS = 28;

const point = (x, y) => ({ x, y });
const line = (start, end) => ({
  x1: start.x,
  y1: start.y,
  x2: end.x,
  y2: end.y,
});
const midpoint = (start, end) => point(
  (start.x + end.x) / 2,
  (start.y + end.y) / 2,
);
const normalizeZero = (value) => Math.abs(value) < 1e-12 ? 0 : value;
const formatFeet = (value) => normalizeZero(value).toFixed(2);

export function calculateDiagram(angleDegrees) {
  if (!Number.isFinite(angleDegrees) || angleDegrees < 1 || angleDegrees > 180) {
    throw new RangeError("angle must be a finite number from 1 through 180 degrees");
  }

  const angleRadians = angleDegrees * Math.PI / 180;
  const sine = normalizeZero(Math.sin(angleRadians));
  const cosine = normalizeZero(Math.cos(angleRadians));
  const perpendicularWidth = DIMENSIONS.side * sine;
  const projection = DIMENSIONS.side * cosine;
  const scaledWidth = perpendicularWidth * SCALE;
  const scaledProjection = projection * SCALE;
  const scaledLength = DIMENSIONS.longSide * SCALE;
  const leftX = CENTER_X - scaledWidth / 2;
  const rightX = CENTER_X + scaledWidth / 2;
  const topY = CENTER_Y - (scaledLength + scaledProjection) / 2;

  const leftTop = point(leftX, topY + scaledProjection);
  const rightTop = point(rightX, topY);
  const leftBottom = point(leftX, leftTop.y + scaledLength);
  const rightBottom = point(rightX, rightTop.y + scaledLength);
  const insetFraction = DIMENSIONS.inset / DIMENSIONS.side;
  const rightInsetFraction = 1 - insetFraction;
  const leftInsetTop = point(
    leftX + scaledWidth * insetFraction,
    leftTop.y + (rightTop.y - leftTop.y) * insetFraction,
  );
  const rightInsetTop = point(
    leftX + scaledWidth * rightInsetFraction,
    leftTop.y + (rightTop.y - leftTop.y) * rightInsetFraction,
  );
  const leftInsetBottom = point(leftInsetTop.x, leftInsetTop.y + scaledLength);
  const rightInsetBottom = point(rightInsetTop.x, rightInsetTop.y + scaledLength);

  const outwardX = -cosine;
  const outwardY = -sine;
  const offsetPoint = (source, amount) => point(
    source.x + outwardX * amount,
    source.y + outwardY * amount,
  );
  const topDimensionPoints = {
    leftStart: offsetPoint(leftTop, INNER_DIMENSION_OFFSET),
    leftEnd: offsetPoint(leftInsetTop, INNER_DIMENSION_OFFSET),
    innerStart: offsetPoint(leftInsetTop, INNER_DIMENSION_OFFSET),
    innerEnd: offsetPoint(rightInsetTop, INNER_DIMENSION_OFFSET),
    rightStart: offsetPoint(rightInsetTop, INNER_DIMENSION_OFFSET),
    rightEnd: offsetPoint(rightTop, INNER_DIMENSION_OFFSET),
  };
  const topLabelOffset = INNER_DIMENSION_OFFSET + LABEL_OFFSET;
  const topLabels = {
    left: offsetPoint(midpoint(leftTop, leftInsetTop), topLabelOffset),
    inner: offsetPoint(midpoint(leftInsetTop, rightInsetTop), topLabelOffset),
    right: offsetPoint(midpoint(rightInsetTop, rightTop), topLabelOffset),
  };
  const topExtensions = {
    left: line(offsetPoint(leftTop, EXTENSION_START), offsetPoint(leftTop, EXTENSION_END)),
    insetLeft: line(offsetPoint(leftInsetTop, EXTENSION_START), offsetPoint(leftInsetTop, EXTENSION_END)),
    insetRight: line(offsetPoint(rightInsetTop, EXTENSION_START), offsetPoint(rightInsetTop, EXTENSION_END)),
    right: line(offsetPoint(rightTop, EXTENSION_START), offsetPoint(rightTop, EXTENSION_END)),
  };

  const perpendicularY = CENTER_Y - 48;
  const perpendicularInset = DIMENSIONS.inset * sine;
  const perpendicularInner = DIMENSIONS.innerSpan * sine;
  const perpendicular = {
    left: line(point(leftX, perpendicularY), point(leftInsetTop.x, perpendicularY)),
    inner: line(point(leftInsetTop.x, perpendicularY), point(rightInsetTop.x, perpendicularY)),
    right: line(point(rightInsetTop.x, perpendicularY), point(rightX, perpendicularY)),
    leftSquare: [
      point(leftX, perpendicularY - 8),
      point(leftX + 8, perpendicularY - 8),
      point(leftX + 8, perpendicularY),
    ],
    rightSquare: [
      point(rightX, perpendicularY - 8),
      point(rightX - 8, perpendicularY - 8),
      point(rightX - 8, perpendicularY),
    ],
    methodLabel: point(leftX - 10, perpendicularY + 4),
    leftLabel: point((leftX + leftInsetTop.x) / 2, perpendicularY - 10),
    innerLabel: point((leftInsetTop.x + rightInsetTop.x) / 2, perpendicularY - 10),
    rightLabel: point((rightInsetTop.x + rightX) / 2, perpendicularY - 10),
  };

  const staticAY = CENTER_Y + 48;
  const staticBY = CENTER_Y + 94;
  const staticAStart = point(rightX, staticAY);
  const staticAEnd = point(rightX - DIMENSIONS.arrowA * SCALE, staticAY);
  const staticBStart = point(rightInsetTop.x, staticBY);
  const staticBEnd = point(rightInsetTop.x - DIMENSIONS.arrowB * SCALE, staticBY);
  const overlapY = (staticAY + staticBY) / 2;
  const overlap = Math.abs(staticBEnd.x - staticAEnd.x) / SCALE;
  const guides = {
    a: line(staticAStart, staticAEnd),
    aLabel: point((staticAStart.x + staticAEnd.x) / 2, staticAY - 9),
    b: line(staticBStart, staticBEnd),
    bLabel: point((staticBStart.x + staticBEnd.x) / 2, staticBY - 9),
    overlapSpan: line(point(staticAEnd.x, overlapY), point(staticBEnd.x, overlapY)),
    overlapExtension: line(point(staticBEnd.x, overlapY), point(leftInsetTop.x, overlapY)),
    overlapWitness: line(point(staticAEnd.x, staticAY + 4), point(staticAEnd.x, overlapY + 4)),
    overlapLabel: point(Math.min(staticAEnd.x, staticBEnd.x) - 8, overlapY + 4),
  };

  const arcStart = point(rightX, rightTop.y + ARC_RADIUS);
  const arcEndRadians = (90 + angleDegrees) * Math.PI / 180;
  const arcEnd = point(
    rightX + ARC_RADIUS * Math.cos(arcEndRadians),
    rightTop.y + ARC_RADIUS * Math.sin(arcEndRadians),
  );
  const angleLabelRadians = (90 + angleDegrees / 2) * Math.PI / 180;
  const angleLabel = point(
    rightX + 42 * Math.cos(angleLabelRadians),
    rightTop.y + 42 * Math.sin(angleLabelRadians),
  );
  const shortRotation = angleDegrees - 90;
  const measurements = {
    perpendicularInset,
    perpendicularInner,
    perpendicularWidth,
    overlap,
  };

  return {
    angleDegrees,
    angleRadians,
    sine,
    cosine,
    projection,
    shortRotation,
    shape: [leftTop, rightTop, rightBottom, leftBottom],
    insetLines: {
      left: line(leftInsetTop, leftInsetBottom),
      right: line(rightInsetTop, rightInsetBottom),
    },
    topDimensions: {
      left: line(topDimensionPoints.leftStart, topDimensionPoints.leftEnd),
      inner: line(topDimensionPoints.innerStart, topDimensionPoints.innerEnd),
      right: line(topDimensionPoints.rightStart, topDimensionPoints.rightEnd),
    },
    topExtensions,
    topLabels,
    perpendicular,
    guides,
    arc: { radius: ARC_RADIUS, start: arcStart, end: arcEnd },
    angleLabel,
    bottomLabel: point(
      (leftBottom.x + rightBottom.x) / 2,
      (leftBottom.y + rightBottom.y) / 2 + 17,
    ),
    rightSideLabel: point(rightX + 13, (rightTop.y + rightBottom.y) / 2),
    measurements,
    formulas: {
      shape: {
        expression: "15 ft + 50 ft + 15 ft",
        result: "= 80 ft; long sides = 165.93 ft",
      },
      outerOffsets: {
        expression: `15 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(perpendicularInset)} ft each`,
      },
      innerSpan: {
        expression: `50 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(perpendicularInner)} ft`,
      },
      fixedArrows: {
        expression: "A = 65 ft",
        result: "· B = 50 ft",
      },
      overlap: {
        expression: `|65 ft − (50 ft + 15 ft × sin(${angleDegrees.toFixed(2)}°))|`,
        result: `= ${formatFeet(overlap)} ft`,
      },
    },
  };
}

const AREA_LABEL_INSET = 12;

export function calculateRightAngleAreas(angleDegrees) {
  const base = calculateDiagram(angleDegrees);
  const [leftTop, rightTop, rightBottom, leftBottom] = base.shape;
  const rightX = rightTop.x;
  const topY = Math.min(leftTop.y, rightTop.y);
  const bottomY = Math.max(leftBottom.y, rightBottom.y);
  const height = bottomY - topY;

  // Both areas are measured at a right angle to the right side, so each one
  // starts at the right edge and runs horizontally back into the shape.
  const bandRect = (widthFeet) => ({
    x: rightX - widthFeet * SCALE,
    y: topY,
    width: widthFeet * SCALE,
    height,
  });
  const areaA = bandRect(DIMENSIONS.arrowA);
  const areaB = bandRect(DIMENSIONS.arrowB);

  // Measured from the same side, the shorter band always sits inside the
  // longer one, so the overlap is the shorter of the two and never vanishes.
  const overlapFeet = Math.min(DIMENSIONS.arrowA, DIMENSIONS.arrowB);
  const overlapArea = bandRect(overlapFeet);

  // A band longer than the perpendicular width also runs past the far edge.
  const perpendicularWidth = base.measurements.perpendicularWidth;
  const beyondFeet = Math.max(0, DIMENSIONS.arrowA - perpendicularWidth);
  // The spill is drawn against the far edge itself, so it lines up with the
  // slanted left side instead of floating past the corners.
  const beyondArea = {
    x: rightX - DIMENSIONS.arrowA * SCALE,
    y: leftTop.y,
    width: beyondFeet * SCALE,
    height: leftBottom.y - leftTop.y,
  };

  const bandY = (offset) => topY + height / 2 + offset;
  const dimensionA = line(
    point(rightX, bandY(-34)),
    point(areaA.x, bandY(-34)),
  );
  const dimensionB = line(
    point(rightX, bandY(34)),
    point(areaB.x, bandY(34)),
  );
  const rightAngleSquare = (y, direction) => [
    point(rightX - 9, y),
    point(rightX - 9, y + 9 * direction),
    point(rightX, y + 9 * direction),
  ];

  return {
    angleDegrees,
    shape: base.shape,
    areaA,
    areaB,
    overlapArea,
    beyondArea,
    dimensions: { a: dimensionA, b: dimensionB },
    squares: {
      a: rightAngleSquare(bandY(-34), -1),
      b: rightAngleSquare(bandY(34), 1),
    },
    labels: {
      a: point((rightX + areaA.x) / 2, bandY(-34) - 9),
      b: point((rightX + areaB.x) / 2, bandY(34) + 17),
      overlap: point((rightX + overlapArea.x) / 2, bandY(0) + 4),
      beyond: point(beyondArea.x + beyondArea.width / 2, leftTop.y - AREA_LABEL_INSET),
      title: point(CENTER_X, topY - 14),
    },
    measurements: {
      perpendicularWidth,
      overlap: overlapFeet,
      beyond: beyondFeet,
    },
    formulas: {
      method: {
        expression: "both areas start at the right side, turned 90°",
        result: `· A = ${DIMENSIONS.arrowA} ft · B = ${DIMENSIONS.arrowB} ft`,
      },
      width: {
        expression: `80 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(perpendicularWidth)} ft across`,
      },
      overlap: {
        expression: `min(${DIMENSIONS.arrowA} ft, ${DIMENSIONS.arrowB} ft)`,
        result: `= ${formatFeet(overlapFeet)} ft, always overlapping`,
      },
      beyond: {
        expression: `max(0, ${DIMENSIONS.arrowA} ft − ${formatFeet(perpendicularWidth)} ft)`,
        result: `= ${formatFeet(beyondFeet)} ft past the far edge`,
      },
    },
  };
}

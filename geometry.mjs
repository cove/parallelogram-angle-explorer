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
    titleLabel: point(CENTER_X, Math.min(leftTop.y, rightTop.y) - 40),
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

  // A 15 ft strip squared off each side keeps square ends, but the top and
  // bottom edges lean away from those ends, so each strip runs past the shape.
  const stripWidth = DIMENSIONS.inset * SCALE;
  const strips = {
    right: {
      x: rightX - stripWidth,
      y: rightTop.y,
      width: stripWidth,
      height: rightBottom.y - rightTop.y,
    },
    left: {
      x: leftTop.x,
      y: leftTop.y,
      width: stripWidth,
      height: leftBottom.y - leftTop.y,
    },
  };
  // How far a square end runs past the leaning edge, measured along the side.
  const overhangFeet = base.sine === 0
    ? 0
    : DIMENSIONS.inset * Math.abs(base.cosine) / base.sine;

  // Laying 15 + 50 + 15 out at a right angle to the side needs a full 80 ft of
  // horizontal room, but the shape only offers 80 × sin(theta) of it.
  const perpendicularWidth = base.measurements.perpendicularWidth;

  // Squared off the sides the shape measures only 80 x sin(theta) across, yet
  // each strip still claims a full 15 ft of that narrower width, so what is
  // left for the middle falls short of 50 ft - and on a steep lean the two
  // strips meet and there is no middle at all.
  const middleStart = strips.left.x + stripWidth;
  const middleEnd = strips.right.x;
  const middleFeet = perpendicularWidth - DIMENSIONS.inset * 2;
  const middleShortFeet = DIMENSIONS.innerSpan - middleFeet;
  // The middle carries on from the right strip, so it keeps the same square
  // ends and runs past one leaning edge and short of the other in its turn.
  const middleArea = {
    x: Math.min(middleStart, middleEnd),
    y: strips.right.y,
    width: Math.abs(middleEnd - middleStart),
    height: strips.right.height,
  };
  const middleColumn = { x: middleArea.x, y: topY, width: middleArea.width, height };
  const middleEndFeet = base.sine === 0
    ? 0
    : Math.max(0, perpendicularWidth - DIMENSIONS.inset)
      * Math.abs(base.cosine) / base.sine;
  const stripsCollide = middleFeet < 0;
  const chainMark = (feet) => rightX - feet * SCALE;
  // The chain rides the perpendicular off the top corner, so it shows where a
  // right-angle measurement puts the marks against the real top edge.
  const chainY = rightTop.y;
  const chain = {
    rightInset: line(point(rightX, chainY), point(chainMark(DIMENSIONS.inset), chainY)),
    inner: line(
      point(chainMark(DIMENSIONS.inset), chainY),
      point(chainMark(DIMENSIONS.inset + DIMENSIONS.innerSpan), chainY),
    ),
    leftInset: line(
      point(chainMark(DIMENSIONS.inset + DIMENSIONS.innerSpan), chainY),
      point(chainMark(DIMENSIONS.side), chainY),
    ),
  };
  const chainLabel = ({ x1, x2 }) => point((x1 + x2) / 2, chainY - 10);
  const farEdgeWitness = line(
    point(leftTop.x, chainY),
    point(leftTop.x, leftBottom.y),
  );


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
    strips,
    // Which way the shape leans decides which end of a strip runs past its
    // edge and which end stops short of it.
    leansRight: base.cosine > 0,
    stripColumns: {
      right: { x: strips.right.x, y: topY, width: stripWidth, height },
      left: { x: strips.left.x, y: topY, width: stripWidth, height },
    },
    middleArea,
    middleColumn,
    stripsCollide,
    chain,
    farEdgeWitness,
    dimensions: { a: dimensionA, b: dimensionB },
    squares: {
      a: rightAngleSquare(bandY(-34), -1),
      b: rightAngleSquare(bandY(34), 1),
      chain: rightAngleSquare(chainY, 1),
    },
    labels: {
      a: point((rightX + areaA.x) / 2, bandY(-34) - 9),
      b: point((rightX + areaB.x) / 2, bandY(34) + 17),
      // One label per corner: each strip end either runs past its edge or
      // stops short of it, and which is which flips with the lean.
      rightTop: point(rightX + 6, rightTop.y + 15),
      rightBottom: point(rightX + 6, rightBottom.y + 15),
      middleTop: point(middleArea.x + middleArea.width * 0.32, strips.right.y + 26),
      middleBottom: point(
        middleArea.x + middleArea.width * 0.32,
        strips.right.y + strips.right.height + 24,
      ),
      leftTop: point(leftTop.x - 6, leftTop.y - 8),
      leftBottom: point(leftTop.x - 6, leftBottom.y + 18),
      // Kept clear of the A and B arrows that sit across the middle.
      rightStrip: point(
        rightX - stripWidth / 2,
        rightTop.y + (rightBottom.y - rightTop.y) / 4,
      ),
      leftStrip: point(
        leftTop.x + stripWidth / 2,
        leftTop.y + (leftBottom.y - leftTop.y) * 3 / 4,
      ),
      chainRightInset: chainLabel(chain.rightInset),
      chainInner: chainLabel(chain.inner),
      chainLeftInset: chainLabel(chain.leftInset),
      title: point(CENTER_X, topY - 40),
    },
    measurements: {
      perpendicularWidth,
      overhang: overhangFeet,
      middle: middleFeet,
      middleShort: middleShortFeet,
      middleEnds: middleEndFeet,
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
      middle: {
        expression: `${formatFeet(perpendicularWidth)} ft − ${DIMENSIONS.inset} ft − ${DIMENSIONS.inset} ft`,
        result: `= ${formatFeet(middleFeet)} ft for a ${DIMENSIONS.innerSpan} ft middle`,
      },
      middleShort: {
        expression: `${DIMENSIONS.innerSpan} ft − ${formatFeet(middleFeet)} ft`,
        result: `= ${formatFeet(middleShortFeet)} ft short in the middle`,
      },
      middleEnds: {
        expression: `(${formatFeet(perpendicularWidth)} ft − ${DIMENSIONS.inset} ft) × |cot(${angleDegrees.toFixed(2)}°)|`,
        result: `= ${formatFeet(middleEndFeet)} ft at the middle's far end`,
      },
      overhang: {
        expression: `${DIMENSIONS.inset} ft × |cos(${angleDegrees.toFixed(2)}°)| ÷ sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(overhangFeet)} ft over one edge, short of the other`,
      },
      chain: {
        expression: `${DIMENSIONS.inset} ft + ${DIMENSIONS.innerSpan} ft + ${DIMENSIONS.inset} ft`,
        result: `= ${DIMENSIONS.side} ft of room needed at 90°`,
      },
    },
  };
}

export function calculateParallelAreas(angleDegrees) {
  const base = calculateDiagram(angleDegrees);
  const [leftTop, rightTop, rightBottom, leftBottom] = base.shape;
  const rightX = rightTop.x;
  const leftX = leftTop.x;
  const topY = Math.min(leftTop.y, rightTop.y);
  const bottomY = Math.max(leftBottom.y, rightBottom.y);
  const height = bottomY - topY;

  // Walking the top edge is the one direction where a foot is a foot at any
  // angle: the edge is exactly 80 ft long however far the shape leans.
  const alongTop = (feet) => point(
    rightTop.x - base.sine * feet * SCALE,
    rightTop.y + base.cosine * feet * SCALE,
  );
  const rightInsetMark = alongTop(DIMENSIONS.inset);
  const innerMark = alongTop(DIMENSIONS.inset + DIMENSIONS.innerSpan);

  const stripRect = (startX, endX) => ({
    x: Math.min(startX, endX),
    y: topY,
    width: Math.abs(endX - startX),
    height,
  });
  const strips = {
    rightInset: stripRect(rightInsetMark.x, rightX),
    inner: stripRect(innerMark.x, rightInsetMark.x),
    leftInset: stripRect(leftX, innerMark.x),
  };

  const stripLabel = (start, end) => point(
    (start.x + end.x) / 2,
    (start.y + end.y) / 2 + 34,
  );
  const guide = (start, feet) => line(
    start,
    point(start.x - base.sine * feet * SCALE, start.y + base.cosine * feet * SCALE),
  );
  const guideA = guide(point(rightTop.x, rightTop.y + 118), DIMENSIONS.arrowA);
  const guideB = guide(
    point(rightInsetMark.x, rightInsetMark.y + 188),
    DIMENSIONS.innerSpan,
  );

  // A starts at the corner and B starts 15 ft along, so 15 + 50 = 65 puts both
  // far ends on the same line no matter how the shape leans.
  const gap = Math.abs(
    DIMENSIONS.arrowA - (DIMENSIONS.inset + DIMENSIONS.innerSpan),
  );
  const matchLine = line(
    point(guideA.x2, guideA.y2),
    point(guideB.x2, guideB.y2),
  );

  return {
    angleDegrees,
    shape: base.shape,
    rotation: base.shortRotation,
    strips,
    guides: { a: guideA, b: guideB },
    matchLine,
    labels: {
      rightInset: stripLabel(rightInsetMark, rightTop),
      inner: stripLabel(innerMark, rightInsetMark),
      leftInset: stripLabel(leftTop, innerMark),
      a: point((guideA.x1 + guideA.x2) / 2, (guideA.y1 + guideA.y2) / 2 - 9),
      b: point((guideB.x1 + guideB.x2) / 2, (guideB.y1 + guideB.y2) / 2 - 9),
      match: point(guideA.x2 - 10, (guideA.y2 + guideB.y2) / 2),
      title: point(CENTER_X, topY - 14),
    },
    measurements: {
      topEdge: DIMENSIONS.side,
      reach: DIMENSIONS.inset + DIMENSIONS.innerSpan,
      gap,
    },
    formulas: {
      method: {
        expression: "A and B run parallel to the 80 ft top edge",
        result: "· no sine, no shrink",
      },
      reach: {
        expression: `${DIMENSIONS.inset} ft + ${DIMENSIONS.innerSpan} ft`,
        result: `= ${formatFeet(DIMENSIONS.inset + DIMENSIONS.innerSpan)} ft, exactly where A ends`,
      },
      total: {
        expression: `${DIMENSIONS.arrowA} ft + ${DIMENSIONS.inset} ft`,
        result: `= ${formatFeet(DIMENSIONS.side)} ft, the whole side`,
      },
      gap: {
        expression: `|${DIMENSIONS.arrowA} ft − (${DIMENSIONS.inset} ft + ${DIMENSIONS.innerSpan} ft)|`,
        result: `= ${formatFeet(gap)} ft at every angle`,
      },
    },
  };
}

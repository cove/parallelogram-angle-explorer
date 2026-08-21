export const PRESET_ANGLES = Object.freeze({
  initial: 110.23,
  rightAngle: 90,
  angle10080: 100.8,
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
// Right-anchored labels stop here so the mobile viewport never clips them.
const LEFT_LABEL_LIMIT = 250;

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
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
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
  // The chain the assessor's numbers force: the right 15 ft runs to the green
  // inset line, the 50 ft carries on from there to A's far end at 65 ft, and
  // the last 15 ft is whatever is left from A to the parcel's left side.
  const perpendicularRightMark = rightInsetTop.x;
  const perpendicularInnerMark = rightX - DIMENSIONS.arrowA * SCALE;
  const perpendicularLeftOver = perpendicularWidth - DIMENSIONS.arrowA;
  const perpendicular = {
    left: line(point(leftX, perpendicularY), point(perpendicularInnerMark, perpendicularY)),
    inner: line(point(perpendicularInnerMark, perpendicularY), point(perpendicularRightMark, perpendicularY)),
    right: line(point(perpendicularRightMark, perpendicularY), point(rightX, perpendicularY)),
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
    leftLabel: point((leftX + perpendicularInnerMark) / 2, perpendicularY - 10),
    innerLabel: point((perpendicularInnerMark + perpendicularRightMark) / 2, perpendicularY - 10),
    rightLabel: point((perpendicularRightMark + rightX) / 2, perpendicularY - 10),
  };

  const staticAY = CENTER_Y + 48;
  const staticBY = CENTER_Y + 94;
  const staticAStart = point(rightX, staticAY);
  const staticAEnd = point(rightX - DIMENSIONS.arrowA * SCALE, staticAY);
  const staticBStart = point(rightInsetTop.x, staticBY);
  const staticBEnd = point(rightInsetTop.x - DIMENSIONS.arrowB * SCALE, staticBY);
  const overlapY = (staticAY + staticBY) / 2;
  // A's endpoint reaches into the projected left inset. This is the visible
  // overlap; the separate loss from projecting 15 ft is kept in the math.
  const overlap = (leftInsetTop.x - staticAEnd.x) / SCALE;
  const projectionLoss = DIMENSIONS.inset - perpendicularInset;
  const fullLengthGuide = (x) => {
    const fractionAcrossShape = scaledWidth === 0
      ? 0.5
      : clamp((x - leftX) / scaledWidth, 0, 1);
    const guideTopY = leftTop.y + (rightTop.y - leftTop.y) * fractionAcrossShape;
    return line(point(x, guideTopY), point(x, guideTopY + scaledLength));
  };
  const guides = {
    a: line(staticAStart, staticAEnd),
    aLabel: point((staticAStart.x + staticAEnd.x) / 2, staticAY - 9),
    b: line(staticBStart, staticBEnd),
    bLabel: point((staticBStart.x + staticBEnd.x) / 2, staticBY - 9),
    overlapSpan: line(point(staticAEnd.x, overlapY), point(leftInsetTop.x, overlapY)),
    overlapExtentA: fullLengthGuide(staticAEnd.x),
    // Held clear of the left edge so the label is not clipped on a phone.
    overlapLabel: point(
      Math.max(Math.min(staticAEnd.x, staticBEnd.x) - 8, LEFT_LABEL_LIMIT),
      overlapY + 4,
    ),
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
    perpendicularLeftOver,
    overlap,
    projectionLoss,
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
      leftOver: {
        expression: `80 ft × sin(${angleDegrees.toFixed(2)}°) − 65 ft`,
        result: `= ${formatFeet(perpendicularLeftOver)} ft left where 15 ft was claimed`,
      },
      overlap: {
        expression: `65 ft − 65 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(overlap)} ft`,
      },
      projectionLoss: {
        expression: `15 ft − 15 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(projectionLoss)} ft`,
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
  // B starts where the 15 ft inset lands when it is stepped off along the
  // leaning side, so its 50 ft ends up somewhere other than A's 65 ft and the
  // two claims overlap by however far apart those ends fall.
  const insetAlongSide = DIMENSIONS.inset * base.sine;
  const areaBStartFeet = insetAlongSide;
  const areaBEndFeet = areaBStartFeet + DIMENSIONS.arrowB;
  const areaB = {
    x: rightX - areaBEndFeet * SCALE,
    y: topY,
    width: DIMENSIONS.arrowB * SCALE,
    height,
  };

  const chainMark = (feet) => rightX - feet * SCALE;
  // A 15 ft strip squared off each side keeps square ends, but the top and
  // bottom edges lean away from those ends, so each strip runs past the shape.
  // The left strip is stepped off the far end of A's 65 ft line rather than
  // from the left edge, so all three parts chain off the right side and carry
  // the same square ends.
  const stripWidth = DIMENSIONS.inset * SCALE;
  const strips = {
    right: {
      x: rightX - stripWidth,
      y: rightTop.y,
      width: stripWidth,
      height: rightBottom.y - rightTop.y,
    },
    left: {
      x: chainMark(DIMENSIONS.side),
      y: rightTop.y,
      width: stripWidth,
      height: rightBottom.y - rightTop.y,
    },
  };
  // How far a square end runs past the leaning edge, measured along the side.
  const cotangentMagnitude = base.sine === 0
    ? 0
    : Math.abs(base.cosine) / base.sine;
  const overhangFeet = DIMENSIONS.inset * cotangentMagnitude;

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
  // The middle now ends on the left strip's inner edge, a flat 65 ft in from
  // the right side, so that is the reach its square ends are measured over.
  const middleEndFeet = DIMENSIONS.arrowA * cotangentMagnitude;
  // Chained off the right side the middle always measures its full 50 ft, but
  // leaned far enough its far end walks off the parcel altogether.
  const middleOffParcel = perpendicularWidth < DIMENSIONS.arrowA;
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
  const chainWitness = (x) => line(point(x, topY), point(x, bottomY));
  const chainWitnesses = {
    right: chainWitness(rightX),
    rightInset: chainWitness(chain.rightInset.x2),
    inner: chainWitness(chain.inner.x2),
    left: chainWitness(chain.leftInset.x2),
  };
  const chainLabel = ({ x1, x2 }) => point((x1 + x2) / 2, chainY - 10);


  const bandY = (offset) => topY + height / 2 + offset;
  const dimensionA = line(
    point(rightX, bandY(-34)),
    point(areaA.x, bandY(-34)),
  );
  const dimensionB = line(
    point(rightX - areaBStartFeet * SCALE, bandY(34)),
    point(areaB.x, bandY(34)),
  );
  const rightAngleSquare = (y, direction, x = rightX) => [
    point(x - 9, y),
    point(x - 9, y + 9 * direction),
    point(x, y + 9 * direction),
  ];
  // The left strip now starts exactly where A's 65 ft ends, so its inner edge
  // sits a flat 65 ft in from the right side at every angle.
  const leftStripInnerFeet = DIMENSIONS.arrowA;
  const leftStripInnerX = strips.left.x + stripWidth;
  // Each shaded run spans the whole length of the shape, the way the strip it
  // is eating into does.
  const stripEncroachment = (endFeet) => {
    const feet = Math.max(0, endFeet - leftStripInnerFeet);
    return {
      feet,
      rect: {
        x: leftStripInnerX - feet * SCALE,
        y: topY,
        width: feet * SCALE,
        height,
      },
    };
  };
  const leftStripOverlaps = {
    a: stripEncroachment(DIMENSIONS.arrowA),
    b: stripEncroachment(areaBEndFeet),
  };
  // Everything out to the left strip's inner edge is claimed, so the only
  // parcel ground still uncovered past that edge is what lies between it and
  // the far corner.
  const leftGapWidthFeet = clamp(
    perpendicularWidth - leftStripInnerFeet,
    0,
    perpendicularWidth,
  );
  const leftGapFeet = leftGapWidthFeet * cotangentMagnitude;
  const leansRight = base.cosine > 0;

  const topEdgeYAtX = (x) => {
    const width = rightX - leftTop.x;
    const fraction = width === 0 ? 0.5 : (x - leftTop.x) / width;
    return leftTop.y + (rightTop.y - leftTop.y) * fraction;
  };
  const bottomEdgeYAtX = (x) => topEdgeYAtX(x) + (leftBottom.y - leftTop.y);
  const verticalDimension = (measureX, squareY, edgeY, drawX = measureX) => line(
    point(drawX, squareY),
    point(drawX, edgeY),
  );
  const leftGapMeasureX = leftTop.x + leftGapWidthFeet * SCALE;
  // The left strip's own far end is the last link of the chain, 80 ft in from
  // the right side. Past the parcel's corner there is no edge left to measure
  // against, so the run is taken at the corner itself.
  const cornerDimensionLane = 5;
  const leftEndMeasureX = clamp(chainMark(DIMENSIONS.side), leftTop.x, rightX);
  const leftEndFeet = ((rightX - leftEndMeasureX) / SCALE) * cotangentMagnitude;
  const cornerDimensions = {
    rt: verticalDimension(strips.right.x, rightTop.y, topEdgeYAtX(strips.right.x)),
    rb: verticalDimension(strips.right.x, rightBottom.y, bottomEdgeYAtX(strips.right.x)),
    lt: verticalDimension(
      leftEndMeasureX,
      strips.left.y,
      topEdgeYAtX(leftEndMeasureX),
      leftEndMeasureX - cornerDimensionLane,
    ),
    lb: verticalDimension(
      leftEndMeasureX,
      strips.left.y + strips.left.height,
      bottomEdgeYAtX(leftEndMeasureX),
      leftEndMeasureX - cornerDimensionLane,
    ),
    mt: verticalDimension(
      middleArea.x,
      middleArea.y,
      topEdgeYAtX(middleArea.x),
      middleArea.x + cornerDimensionLane,
    ),
    mb: verticalDimension(
      middleArea.x,
      middleArea.y + middleArea.height,
      bottomEdgeYAtX(middleArea.x),
      middleArea.x + cornerDimensionLane,
    ),
  };
  const triangleCentroid = ([a, b, c]) => point(
    (a.x + b.x + c.x) / 3,
    (a.y + b.y + c.y) / 3,
  );
  const triangleAreaFeet = ([a, b, c]) => Math.abs(
    a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y),
  ) / (2 * SCALE * SCALE);
  // Clamp candidate gaps to the parcel before measuring them. The portion
  // beyond the black boundary is parcel geometry, not unclaimed parcel area.
  const mainGapBoundaryX = clamp(leftStripInnerX, leftTop.x, rightX);
  const leftGapBoundaryX = clamp(leftGapMeasureX, leftTop.x, rightX);
  const mainGapBaseFeet = (rightX - mainGapBoundaryX) / SCALE;
  const mainGapFarTop = point(mainGapBoundaryX, topEdgeYAtX(mainGapBoundaryX));
  const mainGapFarBottom = point(mainGapBoundaryX, bottomEdgeYAtX(mainGapBoundaryX));
  const mainGapTriangle = leansRight
    ? [
      rightBottom,
      point(mainGapBoundaryX, rightBottom.y),
      mainGapFarBottom,
    ]
    : [
      rightTop,
      point(mainGapBoundaryX, rightTop.y),
      mainGapFarTop,
    ];
  const leftGapTriangle = leansRight
    ? [
      leftTop,
      point(leftGapBoundaryX, leftTop.y),
      point(leftGapBoundaryX, topEdgeYAtX(leftGapBoundaryX)),
    ]
    : [
      leftBottom,
      point(leftGapBoundaryX, leftBottom.y),
      point(leftGapBoundaryX, bottomEdgeYAtX(leftGapBoundaryX)),
    ];
  const mainGapArea = triangleAreaFeet(mainGapTriangle);
  const leftGapArea = triangleAreaFeet(leftGapTriangle);
  const mainGapTarget = triangleCentroid(mainGapTriangle);
  const leftGapTarget = triangleCentroid(leftGapTriangle);
  const gapLabels = {
    main: point(rightX + 8, leansRight ? rightBottom.y - 12 : rightTop.y + 18),
    left: point(leftTop.x - 8, leansRight ? leftTop.y - 8 : leftBottom.y + 18),
  };
  const gapLeaders = {
    main: line(point(rightX + 3, gapLabels.main.y - 3), mainGapTarget),
    left: line(point(leftTop.x - 3, gapLabels.left.y - 3), leftGapTarget),
  };

  return {
    angleDegrees,
    shape: base.shape,
    areaA,
    areaB,
    strips,
    // Which way the shape leans decides which end of a strip runs past its
    // edge and which end stops short of it.
    leansRight,
    stripColumns: {
      right: { x: strips.right.x, y: topY, width: stripWidth, height },
      left: { x: strips.left.x, y: topY, width: stripWidth, height },
    },
    middleArea,
    middleColumn,
    middleOffParcel,
    chain,
    chainWitnesses,
    dimensions: { a: dimensionA, b: dimensionB },
    cornerDimensions,
    gapLeaders,
    gapAreas: { main: mainGapArea, left: leftGapArea },
    gapPolygons: { main: mainGapTriangle, left: leftGapTriangle },
    leftStripOverlaps,
    squares: {
      a: rightAngleSquare(bandY(-34), -1),
      b: rightAngleSquare(bandY(34), 1, rightX - areaBStartFeet * SCALE),
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
      gapMain: gapLabels.main,
      gapLeft: gapLabels.left,
      chainRightInset: chainLabel(chain.rightInset),
      chainInner: chainLabel(chain.inner),
      chainLeftInset: chainLabel(chain.leftInset),
    },
    measurements: {
      perpendicularWidth,
      overhang: overhangFeet,
      leftEnd: leftEndFeet,
      middle: middleFeet,
      middleShort: middleShortFeet,
      middleEnds: middleEndFeet,
      leftStripOverlapA: leftStripOverlaps.a.feet,
      leftStripOverlapB: leftStripOverlaps.b.feet,
      leftGap: leftGapFeet,
      mainGapArea,
      leftGapArea,
    },
    formulas: {
      leftStripOverlapA: {
        expression: `${DIMENSIONS.arrowA} ft − (${DIMENSIONS.inset} ft + ${DIMENSIONS.innerSpan} ft)`,
        result: `= ${formatFeet(leftStripOverlaps.a.feet)} ft`,
      },
      leftStripOverlapB: {
        expression: `(${DIMENSIONS.arrowB} ft + ${DIMENSIONS.inset} ft × sin(${angleDegrees.toFixed(2)}°)) − ${DIMENSIONS.arrowA} ft`,
        result: `= ${formatFeet(leftStripOverlaps.b.feet)} ft`,
      },
      leftGap: {
        expression: `(${formatFeet(perpendicularWidth)} ft − ${DIMENSIONS.arrowA} ft) × |cot(${angleDegrees.toFixed(2)}°)|`,
        result: `= ${formatFeet(leftGapFeet)} ft uncovered`,
      },
      mainGapArea: {
        expression: `½ × ${formatFeet(mainGapBaseFeet)} ft × ${formatFeet(middleEndFeet)} ft`,
        result: `= ${formatFeet(mainGapArea)} ft² unclaimed`,
      },
      leftGapArea: {
        expression: `½ × ${formatFeet(leftGapWidthFeet)} ft × ${formatFeet(leftGapFeet)} ft`,
        result: `= ${formatFeet(leftGapArea)} ft² unclaimed`,
      },
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
        expression: `${DIMENSIONS.arrowA} ft × |cot(${angleDegrees.toFixed(2)}°)|`,
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

  const topOffset = (source, amount) => point(
    source.x - base.cosine * amount,
    source.y - base.sine * amount,
  );
  const topDimensionOffset = 14;
  const topLabelOffset = 27;
  const topDimensions = {
    rightInset: line(topOffset(rightTop, topDimensionOffset), topOffset(rightInsetMark, topDimensionOffset)),
    inner: line(topOffset(rightInsetMark, topDimensionOffset), topOffset(innerMark, topDimensionOffset)),
    leftInset: line(topOffset(innerMark, topDimensionOffset), topOffset(leftTop, topDimensionOffset)),
  };
  const topExtensions = {
    right: line(rightTop, topOffset(rightTop, topDimensionOffset + 4)),
    rightInset: line(rightInsetMark, topOffset(rightInsetMark, topDimensionOffset + 4)),
    inner: line(innerMark, topOffset(innerMark, topDimensionOffset + 4)),
    left: line(leftTop, topOffset(leftTop, topDimensionOffset + 4)),
  };

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

  const stripLabel = (start, end) => topOffset(midpoint(start, end), topLabelOffset);
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
  const boundaryLine = (x) => line(point(x, topY), point(x, bottomY));
  const boundaryLines = {
    rightInset: boundaryLine(rightInsetMark.x),
    inner: boundaryLine(innerMark.x),
  };

  return {
    angleDegrees,
    shape: base.shape,
    rotation: base.shortRotation,
    strips,
    topDimensions,
    topExtensions,
    boundaryLines,
    guides: { a: guideA, b: guideB },
    matchLine,
    labels: {
      rightInset: stripLabel(rightInsetMark, rightTop),
      inner: stripLabel(innerMark, rightInsetMark),
      leftInset: stripLabel(leftTop, innerMark),
      a: point((guideA.x1 + guideA.x2) / 2, (guideA.y1 + guideA.y2) / 2 - 9),
      b: point((guideB.x1 + guideB.x2) / 2, (guideB.y1 + guideB.y2) / 2 - 9),
      match: point(
        Math.max(guideA.x2 - 10, LEFT_LABEL_LIMIT + 15),
        (guideA.y2 + guideB.y2) / 2,
      ),
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

export const PRESET_ANGLES = Object.freeze({
  initial: 98.74,
  rightAngle: 90,
  angle10080: 100.8,
  reverse: 98.74,
});

export const DIMENSIONS = Object.freeze({
  side: 80,
  longSide: 165.93,
  inset: 15,
  innerSpan: 50,
  arrowA: 65,
  arrowB: 50,
});

// The Assessor's recorded segments across the 80 ft north boundary, east to
// west. They are given figures from the assessment, not values this module
// derives; they total 80 ft but do not land where the true 15 / 50 / 15 marks
// do. Used only by calculateNorthEdgeOverlap.
export const ASSESSOR_NORTH_EDGE = Object.freeze({
  east: 15.21,
  middle: 50.72,
  west: 14.07,
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
  // inset line, the 50 ft carries on from there to line h's far end at 65 ft,
  // and the last 15 ft is whatever is left from line h to the parcel's side.
  const perpendicularRightMark = rightInsetTop.x;
  const perpendicularInnerMark = rightX - DIMENSIONS.arrowA * SCALE;
  const perpendicularLeftOver = perpendicularWidth - DIMENSIONS.arrowA;
  // What each part of the chain actually measures across the shape, as
  // against the 15, 50 and 15 the assessor's figures claim for them. Left
  // stays signed rather than absolute: once line h's 65 ft reach exceeds the
  // parcel's own width, there is no ground left for the last 15 ft to
  // measure, and a negative number says so instead of hiding it as 0.
  const perpendicularChain = {
    left: perpendicularLeftOver,
    inner: Math.abs(DIMENSIONS.arrowA - perpendicularInset),
    right: perpendicularInset,
  };
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
  // The true left-15 boundary is 15 + 50 = 65 ft along the top edge, then
  // projected into this right-angle view. Lines h and g both reach past it.
  const leftBoundaryReach = (DIMENSIONS.inset + DIMENSIONS.innerSpan) * sine;
  const bReach = perpendicularInset + DIMENSIONS.arrowB;
  const overlap = DIMENSIONS.arrowA - leftBoundaryReach;
  const bOverlap = bReach - leftBoundaryReach;
  const projectionLoss = DIMENSIONS.arrowA - bReach;
  // Line h's endpoint can fall outside the shape's own width. Past that edge
  // there is no real vertical to trace, so both the fraction and the x it is
  // drawn at are held to the corner - otherwise the line keeps the corner's
  // y while still being drawn out at the original, off-shape x.
  const fullLengthGuide = (x) => {
    const guideX = clamp(x, leftX, rightX);
    const fractionAcrossShape = scaledWidth === 0
      ? 0.5
      : (guideX - leftX) / scaledWidth;
    const guideTopY = leftTop.y + (rightTop.y - leftTop.y) * fractionAcrossShape;
    return line(point(guideX, guideTopY), point(guideX, guideTopY + scaledLength));
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
    perpendicularChain,
    overlap,
    bOverlap,
    bReach,
    leftBoundaryReach,
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
    // One entry per lettered line in the diagram. Each shows only how that
    // single letter's own value is derived - nothing about any other letter.
    formulas: {
      a: {
        expression: "a",
        result: "= 15 ft — left edge (given)",
      },
      b: {
        expression: "b",
        result: "= 50 ft — middle edge (given)",
      },
      c: {
        expression: "c",
        result: "= 15 ft — right edge (given)",
      },
      d: {
        expression: `d = 80 ft × sin(${angleDegrees.toFixed(2)}°) − h`,
        result: `= ${formatFeet(perpendicularLeftOver)} ft between the left side and line h`,
      },
      e: {
        expression: `e = h − c × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(perpendicularChain.inner)} ft from line h to the right-15 mark`,
      },
      f: {
        expression: `f = c × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(perpendicularInset)} ft, the right-15 projection`,
      },
      g: {
        expression: "g",
        result: "= 50 ft — fixed assessor line (given)",
      },
      h: {
        expression: "h",
        result: "= 65 ft — fixed assessor line (given)",
      },
      i: {
        expression: `i = h − (b + c) × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(overlap)} ft line h enters the left 15 ft`,
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
  // Line g starts where the 15 ft inset lands along the leaning side, so its
  // 50 ft endpoint differs from line h's 65 ft endpoint and the
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

  // Each 15 ft end mark is carried along the slanted parcel edge and then
  // squared off from its own side. Its horizontal footprint is therefore the
  // projection 15 × sin(theta), so the purple strips visibly change width as
  // the angle changes. Their square ends also sit at different heights.
  const projectedInsetFeet = base.measurements.perpendicularInset;
  const stripWidth = projectedInsetFeet * SCALE;
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
  // At the projected inner boundary, the edge has moved vertically by the
  // other component of the same 15 ft slanted-edge measurement.
  const cotangentMagnitude = base.sine === 0
    ? 0
    : Math.abs(base.cosine) / base.sine;
  const overhangFeet = base.sine === 0
    ? 0
    : DIMENSIONS.inset * Math.abs(base.cosine);

  // Laying 15 + 50 + 15 out at a right angle to the side needs a full 80 ft of
  // horizontal room, but the shape only offers 80 × sin(theta) of it.
  const perpendicularWidth = base.measurements.perpendicularWidth;

  // The true 15 / 50 / 15 edge marks project to 15 sin / 50 sin / 15 sin.
  // The incorrect fit below nevertheless forces a full horizontal 50 ft
  // center into the smaller projected middle space.
  const middleFeet = Math.max(0, perpendicularWidth - projectedInsetFeet * 2);
  const middleShortFeet = DIMENSIONS.innerSpan - middleFeet;
  // The incorrect fit still lays out a full 50 ft center from the right-hand
  // strip. Since the perpendicular parcel width is less than 80 ft away from
  // 90 degrees, that fixed center reaches into the independently measured
  // left strip. This is the overlap the diagram is meant to expose.
  const middleStart = strips.right.x - DIMENSIONS.innerSpan * SCALE;
  const middleArea = {
    x: middleStart,
    y: strips.right.y,
    width: DIMENSIONS.innerSpan * SCALE,
    height: strips.right.height,
  };
  const middleColumn = { x: middleArea.x, y: topY, width: middleArea.width, height };
  const middleReachFeet = projectedInsetFeet + DIMENSIONS.innerSpan;
  const middleEndFeet = middleReachFeet * cotangentMagnitude;
  const middleOffParcel = perpendicularWidth < middleReachFeet;
  // The purple row uses line h's fixed 65 ft endpoint as the shared boundary
  // between the center-50 line and the left-15 line. This intentionally does
  // not use the projected left inset witness from the green top dimensions.
  const chainY = CENTER_Y - 48;
  const chainRightMarkX = strips.right.x;
  const chainInnerMarkX = areaA.x;
  const chain = {
    rightInset: line(point(rightX, chainY), point(chainRightMarkX, chainY)),
    inner: line(point(chainRightMarkX, chainY), point(chainInnerMarkX, chainY)),
    leftInset: line(point(chainInnerMarkX, chainY), point(leftTop.x, chainY)),
  };
  // The shape's top and bottom edges lean, so a witness held to the global
  // top/bottom bounds sticks out past whichever edge is higher or lower at
  // that x. Stopping each witness at the real edge keeps it inside the shape.
  const topEdgeYAtX = (x) => {
    const width = rightX - leftTop.x;
    const fraction = width === 0 ? 0.5 : (x - leftTop.x) / width;
    return leftTop.y + (rightTop.y - leftTop.y) * fraction;
  };
  const bottomEdgeYAtX = (x) => topEdgeYAtX(x) + (leftBottom.y - leftTop.y);
  // A chain mark can fall past the shape's own corner once a strip has
  // spilled off the parcel entirely. Past that corner there is no edge left
  // to hit, so the witness is held to the corner itself rather than
  // extrapolating the edge line beyond where the shape actually ends.
  const chainWitness = (x) => {
    const witnessX = clamp(x, leftTop.x, rightX);
    return line(point(witnessX, topEdgeYAtX(witnessX)), point(witnessX, bottomEdgeYAtX(witnessX)));
  };
  const chainWitnesses = {
    right: chainWitness(rightX),
    rightInset: chainWitness(chain.rightInset.x2),
    inner: chainWitness(chain.inner.x2),
    left: chainWitness(chain.leftInset.x2),
  };
  const chainLabel = ({ x1, x2 }) => point((x1 + x2) / 2, chainY - 10);


  // Held below the chain row (now fixed, like the forced-measurements
  // diagram's own rows) rather than centered on the shape, so the h/g
  // dimensions never collide with it as the angle changes.
  const bandY = (offset) => chainY + 90 + offset;
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
  const leftStripInnerX = strips.left.x + stripWidth;
  // Linear encroachment into the left strip. Line h is the 65 ft reach;
  // line g is retained as the second diagnostic guide.
  const stripEncroachment = (claimLeftX) => {
    const overlapRightX = Math.min(leftStripInnerX, rightX);
    const overlapLeftX = clamp(claimLeftX, leftTop.x, overlapRightX);
    const feet = Math.max(0, (overlapRightX - overlapLeftX) / SCALE);
    return {
      feet,
      rect: {
        x: overlapLeftX,
        y: Math.max(leftTop.y, rightTop.y),
        width: feet * SCALE,
        height: Math.max(0, Math.min(leftBottom.y, rightBottom.y)
          - Math.max(leftTop.y, rightTop.y)),
      },
    };
  };
  const leftStripOverlaps = {
    a: stripEncroachment(areaA.x),
    b: stripEncroachment(areaB.x),
  };
  const leansRight = base.cosine > 0;

  const polygonAreaFeet = (points) => {
    let twiceArea = 0;
    for (let index = 0; index < points.length; index += 1) {
      const a = points[index];
      const b = points[(index + 1) % points.length];
      twiceArea += a.x * b.y - b.x * a.y;
    }
    return Math.abs(twiceArea) / (2 * SCALE * SCALE);
  };
  // The double-claimed overlap is the intersection of the left projected
  // strip with the incorrectly fixed 50 ft center (B). Its purple/red
  // rectangle shifts above or below the center as the lean reverses.
  const overlapRect = leftStripOverlaps.b.rect;
  const overlapPolygon = [
    point(overlapRect.x, overlapRect.y),
    point(overlapRect.x + overlapRect.width, overlapRect.y),
    point(overlapRect.x + overlapRect.width, overlapRect.y + overlapRect.height),
    point(overlapRect.x, overlapRect.y + overlapRect.height),
  ];
  const overlapArea = polygonAreaFeet(overlapPolygon);

  // Fitting the left strip from the left and line h from the right leaves two
  // unclaimed triangles inside the parcel: one beside each independently
  // anchored square end. The overlap between the claims covers the would-be
  // gap between those two boundaries.
  const areaLeftX = clamp(middleStart, leftTop.x, rightX);
  const stripInnerX = clamp(leftStripInnerX, leftTop.x, rightX);
  const leftGap = leansRight
    ? [leftTop, point(areaLeftX, leftTop.y), point(areaLeftX, topEdgeYAtX(areaLeftX))]
    : [leftBottom, point(areaLeftX, leftBottom.y), point(areaLeftX, bottomEdgeYAtX(areaLeftX))];
  const rightGap = leansRight
    ? [rightBottom, point(stripInnerX, rightBottom.y), point(stripInnerX, bottomEdgeYAtX(stripInnerX))]
    : [rightTop, point(stripInnerX, rightTop.y), point(stripInnerX, topEdgeYAtX(stripInnerX))];
  const gapPolygons = [leftGap, rightGap];
  const gapPolygonAreas = gapPolygons.map(polygonAreaFeet);
  const gapArea = gapPolygonAreas.reduce((sum, area) => sum + area, 0);

  // The same square-ended rectangles also claim ground beyond the sloping
  // parcel boundary. The strip launched from the left spills past one edge;
  // the fixed center and right strip, launched from the right, spill past the
  // opposite edge. Keep these exterior over-claims separate from the red
  // center/left-strip intersection inside the parcel.
  const spillLeftInnerX = clamp(leftStripInnerX, leftTop.x, rightX);
  const spillCenterStartX = clamp(middleStart, leftTop.x, rightX);
  const leftSpill = leansRight
    ? [
      leftBottom,
      point(spillLeftInnerX, leftBottom.y),
      point(spillLeftInnerX, bottomEdgeYAtX(spillLeftInnerX)),
    ]
    : [
      leftTop,
      point(spillLeftInnerX, leftTop.y),
      point(spillLeftInnerX, topEdgeYAtX(spillLeftInnerX)),
    ];
  const centerSpill = leansRight
    ? [
      rightTop,
      point(spillCenterStartX, rightTop.y),
      point(spillCenterStartX, topEdgeYAtX(spillCenterStartX)),
    ]
    : [
      rightBottom,
      point(spillCenterStartX, rightBottom.y),
      point(spillCenterStartX, bottomEdgeYAtX(spillCenterStartX)),
    ];
  const spillPolygons = [leftSpill, centerSpill];
  const spillArea = spillPolygons
    .map(polygonAreaFeet)
    .reduce((sum, area) => sum + area, 0);

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
    // Reproducing the forced-measurements diagram's own naive top row and
    // its long dashed insets, so it is visible here too how line h
    // crosses the dashed line coming down from the left 15 ft boundary.
    shortRotation: base.shortRotation,
    insetLines: base.insetLines,
    topDimensions: base.topDimensions,
    topExtensions: base.topExtensions,
    topLabels: base.topLabels,
    dimensions: { a: dimensionA, b: dimensionB },
    gapArea,
    gapPolygon: rightGap,
    gapPolygons,
    leftStripOverlaps,
    overlapArea,
    overlapPolygon,
    overlapVisible: overlapArea > 1e-9,
    spillArea,
    spillPolygons,
    spillVisible: spillArea > 1e-9,
    squares: {
      a: rightAngleSquare(bandY(-34), -1),
      b: rightAngleSquare(bandY(34), 1, rightX - areaBStartFeet * SCALE),
      chain: rightAngleSquare(chainY, 1),
    },
    labels: {
      a: point((rightX + areaA.x) / 2, bandY(-34) - 9),
      b: point((rightX + areaB.x) / 2, bandY(34) + 17),
      chainRightInset: chainLabel(chain.rightInset),
      chainInner: chainLabel(chain.inner),
      chainLeftInset: chainLabel(chain.leftInset),
    },
    measurements: {
      perpendicularWidth,
      overhang: overhangFeet,
      middle: middleFeet,
      middleShort: middleShortFeet,
      middleEnds: middleEndFeet,
      leftStripOverlapA: leftStripOverlaps.a.feet,
      leftStripOverlapB: leftStripOverlaps.b.feet,
      gapArea,
      overlapArea,
      spillArea,
      // The purple row: right projected inset, then to line h's endpoint,
      // then from line h to the real left side.
      chainRightAngle: {
        right: projectedInsetFeet,
        inner: Math.abs(DIMENSIONS.arrowA - projectedInsetFeet),
        left: perpendicularWidth - DIMENSIONS.arrowA,
      },
    },
    // Same lettered lines as the top diagram - d, e and f mean exactly what
    // they mean there, so reuse those formulas instead of restating them.
    formulas: {
      a: base.formulas.a,
      b: base.formulas.b,
      c: base.formulas.c,
      d: base.formulas.d,
      e: base.formulas.e,
      f: base.formulas.f,
      g: base.formulas.g,
      h: base.formulas.h,
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

  // Line h starts at the corner and line g starts 15 ft along, so 15 + 50 = 65
  // puts both far ends on the same line no matter how the shape leans.
  const gap = Math.abs(
    DIMENSIONS.arrowA - (DIMENSIONS.inset + DIMENSIONS.innerSpan),
  );
  const matchLine = line(
    point(guideA.x2, guideA.y2),
    point(guideB.x2, guideB.y2),
  );
  // The shape's top and bottom edges lean, so a boundary held to the global
  // top/bottom bounds sticks out past whichever edge is higher or lower at
  // that x. Stopping each one at the real edge keeps it inside the shape.
  const topEdgeYAtX = (x) => {
    const width = rightX - leftX;
    const fraction = width === 0 ? 0.5 : (x - leftX) / width;
    return leftTop.y + (rightTop.y - leftTop.y) * fraction;
  };
  const bottomEdgeYAtX = (x) => topEdgeYAtX(x) + (leftBottom.y - leftTop.y);
  const boundaryLine = (x) => line(point(x, topEdgeYAtX(x)), point(x, bottomEdgeYAtX(x)));
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
    // a, b, c, g and h are given the same way here as on the top diagram,
    // so reuse those formulas instead of restating them.
    formulas: {
      a: base.formulas.a,
      b: base.formulas.b,
      c: base.formulas.c,
      g: base.formulas.g,
      h: base.formulas.h,
      i: {
        expression: "i = |h − (c + g)|",
        result: `= ${formatFeet(gap)} ft at every angle`,
      },
    },
  };
}

export function calculateNorthEdgeOverlap(angleDegrees) {
  const base = calculateDiagram(angleDegrees);
  const [leftTop, rightTop, rightBottom, leftBottom] = base.shape;
  const rightX = rightTop.x;
  const leftX = leftTop.x;
  const topY = Math.min(leftTop.y, rightTop.y);
  const bottomY = Math.max(leftBottom.y, rightBottom.y);

  // Along the north edge a foot is a foot at any angle, so the Assessor's
  // recorded 14.07 / 50.72 / 15.21 and the true 15 / 50 / 15 can be stepped
  // off from the same east corner and compared mark for mark.
  const alongTop = (feet) => point(
    rightTop.x - base.sine * feet * SCALE,
    rightTop.y + base.cosine * feet * SCALE,
  );

  const trueEastFeet = DIMENSIONS.inset;
  const trueWestFeet = DIMENSIONS.inset + DIMENSIONS.innerSpan;
  const assessorEastFeet = ASSESSOR_NORTH_EDGE.east;
  const assessorWestFeet = ASSESSOR_NORTH_EDGE.east + ASSESSOR_NORTH_EDGE.middle;
  const marks = {
    trueEast: alongTop(trueEastFeet),
    trueWest: alongTop(trueWestFeet),
    assessorEast: alongTop(assessorEastFeet),
    assessorWest: alongTop(assessorWestFeet),
  };

  const topOffset = (source, amount) => point(
    source.x - base.cosine * amount,
    source.y - base.sine * amount,
  );
  const trueRowOffset = 16;
  const assessorRowOffset = 50;
  const trueLabelOffset = 31;
  const assessorLabelOffset = 82;
  const rowDimensions = (eastMark, westMark, offset) => ({
    east: line(topOffset(rightTop, offset), topOffset(eastMark, offset)),
    middle: line(topOffset(eastMark, offset), topOffset(westMark, offset)),
    west: line(topOffset(westMark, offset), topOffset(leftTop, offset)),
  });
  // The narrow 15 ft end segments cannot hold a label between their marks, so
  // the two end labels are biased out toward the corners to clear the middle.
  const weighted = (from, to, t) => point(
    from.x + (to.x - from.x) * t,
    from.y + (to.y - from.y) * t,
  );
  const rowLabels = (eastMark, westMark, offset, endBias) => ({
    east: topOffset(weighted(eastMark, rightTop, endBias), offset),
    middle: topOffset(midpoint(eastMark, westMark), offset),
    west: topOffset(weighted(westMark, leftTop, endBias), offset),
  });
  const trueRow = rowDimensions(marks.trueEast, marks.trueWest, trueRowOffset);
  const assessorRow = rowDimensions(marks.assessorEast, marks.assessorWest, assessorRowOffset);

  const witness = (source) => line(source, topOffset(source, assessorRowOffset + 4));
  const extensions = {
    right: witness(rightTop),
    left: witness(leftTop),
    trueEast: witness(marks.trueEast),
    trueWest: witness(marks.trueWest),
    assessorEast: witness(marks.assessorEast),
    assessorWest: witness(marks.assessorWest),
  };

  // The parcel's left and right sides are vertical in this drawing, so a
  // boundary dropped from a north-edge mark and run parallel to the sides is a
  // vertical line held between the leaning top and bottom edges.
  const topEdgeYAtX = (x) => {
    const width = rightX - leftX;
    const fraction = width === 0 ? 0.5 : (x - leftX) / width;
    return leftTop.y + (rightTop.y - leftTop.y) * fraction;
  };
  const bottomEdgeYAtX = (x) => topEdgeYAtX(x) + (leftBottom.y - leftTop.y);
  const boundaryLine = (x) => line(point(x, topEdgeYAtX(x)), point(x, bottomEdgeYAtX(x)));
  const boundaryLines = {
    trueEast: boundaryLine(marks.trueEast.x),
    trueWest: boundaryLine(marks.trueWest.x),
    assessorEast: boundaryLine(marks.assessorEast.x),
    assessorWest: boundaryLine(marks.assessorWest.x),
  };

  // Each overlap band is the ground between a true mark and the Assessor mark
  // that should have coincided with it, carried the full depth of the parcel.
  const band = (xTrue, xAssessor) => [
    point(xTrue, topEdgeYAtX(xTrue)),
    point(xAssessor, topEdgeYAtX(xAssessor)),
    point(xAssessor, bottomEdgeYAtX(xAssessor)),
    point(xTrue, bottomEdgeYAtX(xTrue)),
  ];
  const overlaps = {
    west: band(marks.trueWest.x, marks.assessorWest.x),
    east: band(marks.trueEast.x, marks.assessorEast.x),
  };

  const westOverlap = DIMENSIONS.inset - ASSESSOR_NORTH_EDGE.west;
  const eastOverlap = ASSESSOR_NORTH_EDGE.east - DIMENSIONS.inset;
  const total = ASSESSOR_NORTH_EDGE.east + ASSESSOR_NORTH_EDGE.middle + ASSESSOR_NORTH_EDGE.west;

  // The callout runs right, into the open middle of the parcel, so its label
  // never clips off the left edge of the drawing on a narrow screen.
  const calloutY = (topY + bottomY) / 2;
  const westCallout = line(
    point(marks.assessorWest.x, calloutY),
    point(marks.assessorWest.x + 96, calloutY),
  );
  const westCalloutLabel = point(marks.assessorWest.x + 100, calloutY + 4);

  return {
    angleDegrees,
    shape: base.shape,
    rotation: base.shortRotation,
    marks,
    trueRow,
    assessorRow,
    rowLabels: {
      true: rowLabels(marks.trueEast, marks.trueWest, trueLabelOffset, 0.5),
      assessor: rowLabels(marks.assessorEast, marks.assessorWest, assessorLabelOffset, 0.62),
    },
    extensions,
    boundaryLines,
    overlaps,
    westCallout,
    westCalloutLabel,
    measurements: {
      trueSegments: {
        east: DIMENSIONS.inset,
        middle: DIMENSIONS.innerSpan,
        west: DIMENSIONS.inset,
      },
      assessorSegments: { ...ASSESSOR_NORTH_EDGE },
      westOverlap,
      eastOverlap,
      total,
    },
    // Same a / b / c given edges as the other diagrams; d / e / f carry the
    // Assessor's own recorded segments here, and i is the western overlap.
    formulas: {
      a: base.formulas.a,
      b: base.formulas.b,
      c: base.formulas.c,
      d: {
        expression: "d",
        result: `= ${ASSESSOR_NORTH_EDGE.west.toFixed(2)} ft — Assessor west segment (recorded)`,
      },
      e: {
        expression: "e",
        result: `= ${ASSESSOR_NORTH_EDGE.middle.toFixed(2)} ft — Assessor middle segment (recorded)`,
      },
      f: {
        expression: "f",
        result: `= ${ASSESSOR_NORTH_EDGE.east.toFixed(2)} ft — Assessor east segment (recorded)`,
      },
      i: {
        expression: "i = a − d",
        result: `= ${formatFeet(westOverlap)} ft the Assessor middle span enters the true west 15 ft`,
      },
    },
  };
}
